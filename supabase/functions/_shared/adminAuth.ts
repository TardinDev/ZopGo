/**
 * Reconnaît un appelant administrateur de l'interface web.
 *
 * POURQUOI CE MODULE EXISTE
 * L'admin web s'authentifie auprès de Supabase avec un jeton **HS256** issu du
 * template Clerk `supabase`, signé avec le secret JWT du projet — et non avec
 * les clés asymétriques de Clerk. `_shared/clerkAuth.ts`, qui valide du RS256
 * contre le JWKS Clerk, le rejette donc systématiquement.
 *
 * UNE PREMIÈRE CONCEPTION, FAUSSE
 * L'idée initiale était de déléguer l'autorisation aux policies : créer un
 * client portant le jeton de l'appelant, lire `audit_log` — table réservée aux
 * admins — et conclure « admin » si la lecture passait.
 *
 * Elle ne tient pas. **Un refus RLS ne produit aucune erreur** : PostgREST
 * renvoie simplement un résultat vide. La fonction concluait donc « admin »
 * pour n'importe quel porteur de jeton valide. Vérifié en production : le
 * jeton d'un utilisateur ordinaire était accepté.
 *
 * C'est la même famille de piège que celles rencontrées ailleurs dans ce
 * projet — un mécanisme de sécurité présent, syntaxiquement correct, et
 * silencieusement inopérant.
 *
 * CE QUI EST FAIT MAINTENANT
 * On vérifie la signature du jeton avec le secret JWT du projet, puis on lit
 * le claim `admin_role`. C'est exactement ce que font les policies, sur la
 * même valeur — pas une seconde définition de l'autorisation, mais le même
 * contrôle appliqué en amont de la base.
 */

const ADMIN_JWT_SECRET = Deno.env.get('ADMIN_JWT_SECRET');

const ROLES_ADMIN = ['admin', 'super_admin'];

function base64urlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
}

/**
 * Renvoie true si le porteur du jeton `Authorization` est administrateur.
 *
 * Ne lève jamais : toute anomalie vaut « pas administrateur ».
 */
export async function isAdminCaller(req: Request): Promise<boolean> {
  if (!ADMIN_JWT_SECRET) {
    console.error('[adminAuth] ADMIN_JWT_SECRET absent — appelant refusé');
    return false;
  }

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;

  const parts = auth.slice(7).trim().split('.');
  if (parts.length !== 3) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(ADMIN_JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valide = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valide) return false;

    const claims = JSON.parse(new TextDecoder().decode(base64urlToBytes(parts[1])));

    // Un jeton expiré n'autorise rien, même correctement signé.
    if (typeof claims.exp === 'number' && claims.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return ROLES_ADMIN.includes(claims.admin_role);
  } catch (err) {
    console.error('[adminAuth] verification impossible:', (err as Error).message);
    return false;
  }
}
