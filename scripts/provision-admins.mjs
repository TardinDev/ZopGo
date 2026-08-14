#!/usr/bin/env node

/**
 * Provisionne les comptes administrateurs ZopGo dans Clerk.
 *
 * L'acces a l'admin (admin-ZopGo) est gate par `publicMetadata.role === "admin"`
 * (voir admin-ZopGo/src/auth/authProvider.ts). Ce champ n'est PAS modifiable
 * depuis le front — il faut passer par la Backend API Clerk avec une cle secrete.
 *
 * Cette meme valeur doit remonter dans le JWT Supabase sous le claim `admin_role`
 * pour que les policies RLS admin s'appliquent (supabase/migrations/006_admin_rls.sql).
 * Le template JWT Clerk doit donc contenir :
 *   { "admin_role": "{{user.public_metadata.role}}" }
 *
 * Usage:
 *   CLERK_SECRET_KEY=sk_... node scripts/provision-admins.mjs
 *   CLERK_SECRET_KEY=sk_... node scripts/provision-admins.mjs --dry-run
 *
 * Le script est idempotent : si le compte existe deja, il est mis a jour
 * (role + mot de passe) au lieu d'etre recree.
 */

const CLERK_API = 'https://api.clerk.com/v1';

const ADMINS = [
    { email: 'tardindavy@gmail.com', password: '2025TEst@' },
    { email: 'zangpulcherie89@gmail.com', password: '2025TEst@' },
];

const secretKey = process.env.CLERK_SECRET_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY manquante.');
    console.error('   Recuperez-la sur https://dashboard.clerk.com → API Keys → Secret key');
    console.error('   Puis : CLERK_SECRET_KEY=sk_... node scripts/provision-admins.mjs');
    process.exit(1);
}

if (!secretKey.startsWith('sk_')) {
    console.error('❌ CLERK_SECRET_KEY invalide : elle doit commencer par "sk_".');
    process.exit(1);
}

const instanceKind = secretKey.startsWith('sk_live_') ? 'production (live)' : 'development (test)';

async function clerk(path, options = {}) {
    const res = await fetch(`${CLERK_API}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const text = await res.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }

    if (!res.ok) {
        const detail = body?.errors?.map((e) => e.long_message || e.message).join(' | ') || text;
        throw new Error(`${res.status} ${path} — ${detail}`);
    }

    return body;
}

async function findByEmail(email) {
    const users = await clerk(`/users?email_address=${encodeURIComponent(email)}&limit=1`);
    return Array.isArray(users) && users.length > 0 ? users[0] : null;
}

async function provision({ email, password }) {
    const existing = await findByEmail(email);

    if (dryRun) {
        console.log(`   [dry-run] ${existing ? 'MAJ' : 'creation'} de ${email} (role=admin)`);
        return { email, action: existing ? 'would-update' : 'would-create' };
    }

    if (existing) {
        await clerk(`/users/${existing.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                password,
                skip_password_checks: true,
                public_metadata: { ...existing.public_metadata, role: 'admin' },
            }),
        });
        console.log(`   ✅ ${email} — mis a jour (role=admin, mot de passe reinitialise)`);
        return { email, action: 'updated', id: existing.id };
    }

    const created = await clerk('/users', {
        method: 'POST',
        body: JSON.stringify({
            email_address: [email],
            password,
            skip_password_checks: true,
            public_metadata: { role: 'admin' },
        }),
    });
    console.log(`   ✅ ${email} — cree (role=admin)`);
    return { email, action: 'created', id: created.id };
}

async function main() {
    console.log('🔐 Provisioning des admins ZopGo');
    console.log(`   Instance Clerk : ${instanceKind}`);
    if (dryRun) console.log('   Mode : dry-run (aucune ecriture)');
    console.log('');

    const results = [];
    let failed = 0;

    for (const admin of ADMINS) {
        try {
            results.push(await provision(admin));
        } catch (err) {
            failed += 1;
            console.error(`   ❌ ${admin.email} — ${err.message}`);
        }
    }

    console.log('');
    if (failed > 0) {
        console.error(`❌ ${failed}/${ADMINS.length} compte(s) en echec.`);
        process.exit(1);
    }

    console.log(`✅ ${results.length}/${ADMINS.length} compte(s) admin prets.`);
    console.log('');
    console.log('Rappel — pour que les policies RLS Supabase s\'appliquent, le template');
    console.log('JWT Clerk "supabase" doit exposer : { "admin_role": "{{user.public_metadata.role}}" }');
}

main().catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
});
