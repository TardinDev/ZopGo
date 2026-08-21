/**
 * Garde-fou sur la résolution du rôle à la création de compte.
 *
 * L'enrôlement des chauffeurs et hébergeurs se fait par invitation email
 * depuis l'admin. Or une invitation Clerk ne transporte que
 * `public_metadata` jusqu'au compte créé : `unsafe_metadata` n'y survit
 * pas. Sans repli sur `public_metadata`, tout compte créé par invitation
 * retomberait sur `'client'` quel que soit le rôle choisi par
 * l'administration — et rien ne le signalerait, ni erreur ni log : le
 * webhook répondrait 200 avec un profil parfaitement valide, mais faux.
 *
 * L'ordre compte autant que la présence du repli. `unsafe_metadata` reste
 * prioritaire parce que c'est lui qu'alimentent les inscriptions faites
 * depuis l'application mobile ; inverser les deux changerait leur
 * comportement.
 *
 * Ce test lit la SOURCE du webhook : il tourne sous Deno, hors de portée de
 * l'environnement Jest de l'app — même convention que
 * `sendPushAuthContract.test.ts`.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const webhookSource = readFileSync(
  join(REPO_ROOT, 'supabase', 'functions', 'clerk-webhook', 'index.ts'),
  'utf8'
);

/**
 * Retire les commentaires (lignes `//`, blocs `/* *\/`) pour qu'aucune
 * assertion ne se satisfasse d'un code commenté ou d'une simple mention en
 * prose — la doc de ce même fichier nomme les deux champs.
 */
function activeSource(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
}

const activeWebhook = activeSource(webhookSource);

/** L'expression qui résout le rôle, commentaires exclus. */
function roleExpression(): string {
  const match = activeWebhook.match(/const role\s*=([\s\S]*?);/);
  if (!match) {
    throw new Error(
      "Aucune affectation `const role = ...` trouvée dans clerk-webhook/index.ts"
    );
  }
  return match[1];
}

describe('clerk-webhook role resolution contract', () => {
  it('retombe sur public_metadata — le seul champ qu’une invitation transporte', () => {
    expect(roleExpression()).toMatch(/public_metadata\?\.role/);
  });

  it('donne la priorité à unsafe_metadata, alimenté par l’app mobile', () => {
    const expression = roleExpression();
    const unsafeIndex = expression.indexOf('unsafe_metadata');
    const publicIndex = expression.indexOf('public_metadata');

    expect(unsafeIndex).toBeGreaterThanOrEqual(0);
    expect(publicIndex).toBeGreaterThanOrEqual(0);
    // L'ordre des opérandes du `||` EST la règle de priorité.
    expect(unsafeIndex).toBeLessThan(publicIndex);
  });

  it('conserve le défaut client quand aucune métadonnée ne porte de rôle', () => {
    expect(roleExpression()).toMatch(/\|\|\s*'client'/);
  });
});
