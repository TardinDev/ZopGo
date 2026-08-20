#!/usr/bin/env node

/**
 * Migre les comptes d'une instance Clerk vers une autre.
 *
 * POURQUOI
 * Les instances Clerk ont des bases utilisateurs totalement separees. Passer
 * du developpement a la production laisse donc les comptes existants derriere
 * — et avec eux le lien vers leurs donnees Supabase, puisque `profiles`
 * reference l'utilisateur par son `clerk_id`.
 *
 * CE QUI EST MIGRE
 *   email, prenom/nom, `unsafe_metadata` (le role choisi a l'inscription),
 *   `public_metadata` (le role admin)
 *
 * CE QUI NE PEUT PAS L'ETRE
 *   Les mots de passe. Clerk n'expose pas les empreintes via son API. Chaque
 *   utilisateur devra en definir un nouveau, ou se connecter par code email —
 *   l'application gere les deux.
 *
 * LE LIEN AVEC SUPABASE
 *   Le script n'ecrit rien en base. Il produit un fichier de correspondance
 *   ancien_id → nouveau_id et le SQL de reliaison. Les donnees metier
 *   (trajets, hebergements, reservations) referencent `profiles.id`, pas le
 *   `clerk_id` : mettre a jour cette seule colonne preserve donc tout
 *   l'historique.
 *
 * USAGE
 *   CLERK_SOURCE_KEY=sk_test_... CLERK_TARGET_KEY=sk_live_... \
 *     node scripts/migrate-clerk-users.mjs --dry-run
 *
 *   Retirer --dry-run pour appliquer. Le script est idempotent : un compte
 *   deja present sur la cible est ignore, jamais ecrase.
 */

import { writeFileSync } from 'node:fs';

const CLERK_API = 'https://api.clerk.com/v1';
const SOURCE = process.env.CLERK_SOURCE_KEY;
const TARGET = process.env.CLERK_TARGET_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!SOURCE || !TARGET) {
    console.error('❌ CLERK_SOURCE_KEY et CLERK_TARGET_KEY sont requises.');
    console.error('   SOURCE = instance de depart (sk_test_...)');
    console.error('   TARGET = instance d\'arrivee (sk_live_...)');
    process.exit(1);
}

async function clerk(key, path, options = {}) {
    const res = await fetch(`${CLERK_API}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const detail =
            body?.errors?.map((e) => e.long_message || e.message).join(' | ') || text;
        throw new Error(`${res.status} ${path} — ${detail}`);
    }
    return body;
}

const emailOf = (u) => u.email_addresses?.[0]?.email_address ?? null;

/** Les adresses en `+clerk_test@` ne sont que des artefacts de test. */
const isTestAccount = (email) => !email || email.includes('+clerk_test@');

async function main() {
    console.log('🔄 Migration des comptes Clerk');
    console.log(`   Mode : ${dryRun ? 'simulation (aucune ecriture)' : 'APPLICATION'}`);
    console.log('');

    const source = await clerk(SOURCE, '/users?limit=200&order_by=-created_at');
    const target = await clerk(TARGET, '/users?limit=200');
    const existants = new Set(target.map(emailOf).filter(Boolean));

    const aMigrer = source.filter((u) => !isTestAccount(emailOf(u)));
    console.log(`   ${source.length} comptes source, ${aMigrer.length} reels`);
    console.log(`   ${existants.size} deja presents sur la cible`);
    console.log('');

    const mapping = [];
    let crees = 0;
    let ignores = 0;
    let echecs = 0;

    for (const u of aMigrer) {
        const email = emailOf(u);

        if (existants.has(email)) {
            console.log(`   ⏭  ${email} — deja present, laisse intact`);
            ignores += 1;
            continue;
        }

        if (dryRun) {
            console.log(`   [simulation] ${email}`);
            crees += 1;
            continue;
        }

        try {
            const cree = await clerk(TARGET, '/users', {
                method: 'POST',
                body: JSON.stringify({
                    email_address: [email],
                    first_name: u.first_name || undefined,
                    last_name: u.last_name || undefined,
                    unsafe_metadata: u.unsafe_metadata || {},
                    public_metadata: u.public_metadata || {},
                    skip_password_requirement: true,
                }),
            });

            mapping.push({ email, ancien: u.id, nouveau: cree.id });
            console.log(`   ✅ ${email}`);
            crees += 1;
        } catch (err) {
            console.error(`   ❌ ${email} — ${err.message}`);
            echecs += 1;
        }

        // Respire entre deux creations : l'API Clerk limite le debit.
        await new Promise((r) => setTimeout(r, 350));
    }

    console.log('');
    console.log(`   crees ${crees} | ignores ${ignores} | echecs ${echecs}`);

    if (dryRun || mapping.length === 0) return;

    writeFileSync('clerk-migration-mapping.json', JSON.stringify(mapping, null, 2));

    const sql = mapping
        .map(
            (m) =>
                `UPDATE public.profiles SET clerk_id = '${m.nouveau}' ` +
                `WHERE clerk_id = '${m.ancien}'; -- ${m.email}`
        )
        .join('\n');
    writeFileSync('clerk-migration-relink.sql', sql + '\n');

    console.log('');
    console.log('   correspondance → clerk-migration-mapping.json');
    console.log('   reliaison SQL  → clerk-migration-relink.sql');
    console.log('');
    console.log('   Relire ce SQL avant de l\'appliquer : il reattribue les');
    console.log('   profils existants, et avec eux tout l\'historique metier.');
}

main().catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
});
