/**
 * Vérification des jetons Clerk, partagée par les Edge Functions.
 *
 * POURQUOI PLUSIEURS ÉMETTEURS
 * Pendant une bascule d'instance Clerk (développement → production, ou
 * changement de domaine), deux instances coexistent forcément : le build
 * déjà publié sur le store embarque l'ancienne clé publishable en dur et
 * continue de tourner chez les utilisateurs, tandis que le nouveau build
 * utilise la nouvelle. N'accepter qu'un seul émetteur couperait
 * instantanément tous les utilisateurs de la version publiée — c'est
 * exactement la panne silencieuse de notifications push qu'on a déjà
 * connue ici.
 *
 * On accepte donc une liste d'émetteurs, et on valide la signature contre
 * le JWKS de celui que le jeton déclare. Le claim `iss` est lu avant
 * vérification uniquement pour choisir le bon jeu de clés : la signature
 * est ensuite validée contre ce JWKS précis, avec l'émetteur épinglé. Un
 * jeton forgé ne peut donc pas passer — il lui faudrait une signature
 * valide de l'instance Clerk qu'il prétend représenter.
 *
 * CONFIGURATION
 *   CLERK_ISSUERS   liste séparée par des virgules (recommandé)
 *   CLERK_ISSUER    valeur unique (ancien nom, toujours accepté)
 *
 * Retirer un émetteur de la liste dès que plus aucun build en circulation
 * ne l'utilise : chaque émetteur accepté est une surface d'attaque.
 */
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5';

function parseIssuers(): string[] {
  const raw =
    Deno.env.get('CLERK_ISSUERS') ??
    Deno.env.get('CLERK_ISSUER') ??
    'https://saved-chimp-89.clerk.accounts.dev';

  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter((s) => s.length > 0);
}

export const CLERK_ISSUERS = parseIssuers();

const JWKS_BY_ISSUER = new Map<string, ReturnType<typeof createRemoteJWKSet>>(
  CLERK_ISSUERS.map((iss) => [
    iss,
    createRemoteJWKSet(new URL(`${iss}/.well-known/jwks.json`)),
  ])
);

/** Lit le claim `iss` sans vérifier — sert uniquement à choisir le JWKS. */
function unverifiedIssuer(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return typeof payload.iss === 'string'
      ? payload.iss.replace(/\/+$/, '')
      : null;
  } catch {
    return null;
  }
}

/**
 * Vérifie un jeton de session Clerk et renvoie son `sub`, ou null si le
 * jeton est absent, malformé, expiré, ou signé par une instance qui ne
 * figure pas dans la liste des émetteurs acceptés.
 */
export async function verifyClerkToken(token: string): Promise<string | null> {
  if (!token) return null;

  const issuer = unverifiedIssuer(token);
  if (!issuer) return null;

  const jwks = JWKS_BY_ISSUER.get(issuer);
  if (!jwks) {
    console.error(
      `[clerkAuth] émetteur refusé: ${issuer} — acceptés: ${CLERK_ISSUERS.join(', ')}`
    );
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch (err) {
    console.error('[clerkAuth] signature invalide:', (err as Error).message);
    return null;
  }
}

/** Extrait le Bearer de la requête puis le vérifie. */
export async function verifyClerkRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyClerkToken(auth.slice(7).trim());
}
