# Invitations de comptes depuis l'admin — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'administration d'enrôler un chauffeur ou un hébergeur en lui envoyant une invitation par email, sans passer par le Dashboard Clerk.

**Architecture:** Une Edge Function `admin-invitations` détient la clé secrète Clerk et expose trois opérations (créer, lister, révoquer). Elle autorise l'appelant via `_shared/adminAuth.ts`, déjà écrit et vérifié en production. Le webhook `clerk-webhook` est corrigé pour lire le rôle dans `public_metadata`, seul emplacement qu'une invitation Clerk transporte.

**Tech Stack:** Supabase Edge Functions (Deno), Clerk Backend API, React + Refine + Ant Design, Jest.

**Spec:** `docs/superpowers/specs/2026-08-21-invitations-comptes-admin-design.md`

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `supabase/functions/admin-invitations/index.ts` | Les trois opérations, seul détenteur de la clé Clerk |
| `supabase/functions/clerk-webhook/index.ts:145` | Repli du rôle sur `public_metadata` |
| `supabase/config.toml` | Déclare la fonction en `verify_jwt = false` |
| `admin-ZopGo/src/pages/invitations/payload.ts` | Construction de la charge, testable |
| `admin-ZopGo/src/pages/invitations/__tests__/payload.test.ts` | Tests de la charge |
| `admin-ZopGo/src/pages/invitations/index.tsx` | Formulaire + liste des invitations en attente |
| `admin-ZopGo/src/App.tsx` | Ressource, route et entrée de menu |

`_shared/adminAuth.ts` existe déjà — aucune modification.

---

### Task 1 : Repli du rôle dans le webhook

**Files:**
- Modify: `supabase/functions/clerk-webhook/index.ts:145`

- [ ] **Step 1 : Modifier la lecture du rôle**

Remplacer la ligne :

```typescript
        const role = userData.unsafe_metadata?.role || 'client';
```

par :

```typescript
        // Une invitation Clerk ne transporte que `public_metadata`. Sans ce
        // repli, tout compte créé par invitation deviendrait `client` quel que
        // soit le rôle choisi par l'administration — sans qu'aucune erreur ne
        // le signale.
        //
        // `unsafe_metadata` reste prioritaire : c'est lui qu'alimentent les
        // inscriptions faites depuis l'application mobile, et leur
        // comportement ne doit pas changer.
        const role =
          userData.unsafe_metadata?.role ||
          userData.public_metadata?.role ||
          'client';
```

- [ ] **Step 2 : Déployer**

Run: `npx supabase functions deploy clerk-webhook --no-verify-jwt`
Expected: `"functions":["clerk-webhook"]` et `Deployed Functions.`

- [ ] **Step 3 : Vérifier qu'un événement signé passe toujours**

Le webhook refuse toute requête non signée. Vérifier la non-régression :

```bash
URL=$(grep EXPO_PUBLIC_SUPABASE_URL .env | cut -d= -f2 | tr -d '\r\n')
curl -s -X POST "$URL/functions/v1/clerk-webhook" \
  -H "Content-Type: application/json" -d '{"type":"user.created"}' \
  -w "\n→ HTTP %{http_code}\n"
```
Expected: `Invalid signature` et `HTTP 401`

- [ ] **Step 4 : Verrouiller le repli par un test de contrat**

Le webhook tourne sous Deno, hors de portée de Jest. On garde donc la règle
depuis la suite mobile, comme le fait déjà
`src/lib/__tests__/sendPushAuthContract.test.ts` pour `send-push`.

Créer `src/lib/__tests__/clerkWebhookRoleContract.test.ts` :

```typescript
/**
 * Garde-fou du rôle des comptes créés par invitation.
 *
 * Une invitation Clerk ne transporte que `public_metadata`. Sans le repli
 * ci-dessous, tout invité deviendrait `client` quel que soit le rôle choisi
 * par l'administration — et rien ne le signalerait : ni erreur, ni log. Le
 * chauffeur invité se retrouverait simplement avec les onglets d'un client.
 *
 * Ce test lit la source de la fonction Deno, que l'environnement Jest de
 * l'application ne peut pas importer.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(
  join(__dirname, '..', '..', '..', 'supabase', 'functions', 'clerk-webhook', 'index.ts'),
  'utf8'
);

describe('clerk-webhook — rôle des invités', () => {
  it('lit le rôle dans public_metadata en repli', () => {
    expect(source).toMatch(/public_metadata\?\.role/);
  });

  it('garde unsafe_metadata prioritaire', () => {
    // Les inscriptions depuis l'application alimentent `unsafe_metadata` ;
    // inverser l'ordre changerait leur comportement.
    const i = source.indexOf('unsafe_metadata?.role');
    const j = source.indexOf('public_metadata?.role');

    expect(i).toBeGreaterThan(-1);
    expect(j).toBeGreaterThan(-1);
    expect(i).toBeLessThan(j);
  });

  it('retombe sur client quand aucun rôle n’est fourni', () => {
    expect(source).toMatch(/\|\|\s*'client'/);
  });
});
```

- [ ] **Step 5 : Lancer le test**

Run: `npx jest clerkWebhookRoleContract`
Expected: PASS — 3 tests

- [ ] **Step 6 : Commit**

```bash
git add supabase/functions/clerk-webhook/index.ts src/lib/__tests__/clerkWebhookRoleContract.test.ts
git commit -m "fix(webhook): lit le role d'un invite dans public_metadata"
```

---

### Task 2 : Construction de la charge d'invitation

**Files:**
- Create: `admin-ZopGo/src/pages/invitations/payload.ts`
- Test: `admin-ZopGo/src/pages/invitations/__tests__/payload.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

```typescript
/**
 * buildInvitationPayload prépare l'appel à l'API Clerk.
 *
 * Le rôle DOIT atterrir dans `public_metadata` : c'est le seul emplacement
 * qu'une invitation Clerk transporte jusqu'au compte créé. Le placer ailleurs
 * ferait de chaque invité un `client`, sans qu'aucune erreur ne le signale.
 *
 * L'email est mis en minuscules parce que Clerk considère `A@b.com` et
 * `a@b.com` comme deux adresses distinctes à l'invitation, alors que la
 * personne recevra le message dans la même boîte.
 */

import { buildInvitationPayload } from "../payload";

describe("buildInvitationPayload", () => {
    it("place le rôle dans public_metadata", () => {
        const p = buildInvitationPayload("chauffeur@zopgo.app", "chauffeur");

        expect(p.public_metadata).toEqual({ role: "chauffeur" });
    });

    it("demande à Clerk d'envoyer l'email", () => {
        expect(buildInvitationPayload("a@b.com", "client").notify).toBe(true);
    });

    it("détoure et met l'email en minuscules", () => {
        const p = buildInvitationPayload("  Chauffeur@ZopGo.App  ", "chauffeur");

        expect(p.email_address).toBe("chauffeur@zopgo.app");
    });

    it("refuse un email vide", () => {
        expect(() => buildInvitationPayload("   ", "client")).toThrow();
    });

    it("refuse un rôle vide", () => {
        expect(() => buildInvitationPayload("a@b.com", "")).toThrow();
    });
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

Depuis `admin-ZopGo/` :

```bash
npx jest --config '{"preset":"ts-jest","testEnvironment":"jsdom","setupFilesAfterEnv":["<rootDir>/jest.setup.ts"],"moduleNameMapper":{"\\.(css|less|scss)$":"identity-obj-proxy","^@/(.*)$":"<rootDir>/src/$1"}}' invitations
```
Expected: FAIL — `Cannot find module '../payload'`

- [ ] **Step 3 : Écrire le module**

```typescript
/**
 * Construction de la charge envoyée à l'API Clerk pour inviter quelqu'un.
 *
 * Extrait du composant pour être testable, comme `trajets/payload.ts`.
 *
 * Le point à ne pas manquer : le rôle va dans `public_metadata`. Une
 * invitation Clerk ne transporte que ce champ jusqu'au compte créé —
 * `unsafe_metadata` n'y survit pas. S'en écarter ferait de chaque invité un
 * `client`, en silence.
 */

export interface InvitationPayload {
    email_address: string;
    public_metadata: { role: string };
    notify: boolean;
}

export function buildInvitationPayload(
    email: string,
    role: string
): InvitationPayload {
    const adresse = email.trim().toLowerCase();
    if (!adresse) throw new Error("L'adresse email est requise");
    if (!role) throw new Error("Le rôle est requis");

    return {
        email_address: adresse,
        public_metadata: { role },
        notify: true,
    };
}
```

- [ ] **Step 4 : Relancer le test**

Même commande qu'à l'étape 2.
Expected: PASS — 5 tests

- [ ] **Step 5 : Commit**

```bash
cd admin-ZopGo
git add src/pages/invitations/payload.ts src/pages/invitations/__tests__/payload.test.ts
git commit -m "feat(invitations): construction de la charge d'invitation"
```

---

### Task 3 : L'Edge Function

**Files:**
- Create: `supabase/functions/admin-invitations/index.ts`
- Modify: `supabase/config.toml`

- [ ] **Step 1 : Écrire la fonction**

```typescript
/**
 * Edge Function admin-invitations — enrôle un chauffeur ou un hébergeur.
 *
 * Elle existe parce que créer un compte exige la clé secrète Clerk, qui ne
 * peut pas vivre dans un navigateur : n'importe quel visiteur l'extrairait du
 * bundle. La clé reste donc ici, côté serveur.
 *
 * Déployée en `verify_jwt = false` comme les autres fonctions du projet — le
 * gateway Edge ne sait valider ni les jetons Clerk, ni ceux du template
 * `supabase`. L'autorisation est faite par `_shared/adminAuth.ts`.
 */
import { isAdminCaller } from '../_shared/adminAuth.ts';

const CLERK_API = 'https://api.clerk.com/v1';
const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function clerk(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (!CLERK_SECRET_KEY) {
    console.error('[admin-invitations] CLERK_SECRET_KEY absent');
    return json({ error: 'Configuration serveur incomplète.' }, 500);
  }

  // Aucune information sur la cause du refus : un appelant non autorisé n'a
  // pas à apprendre ce qui lui manque.
  if (!(await isAdminCaller(req))) {
    return json({ error: 'Accès refusé.' }, 403);
  }

  try {
    if (req.method === 'GET') {
      const res = await clerk('/invitations?status=pending&limit=100');
      const data = await res.json();
      if (!res.ok) return json({ error: 'Lecture impossible.', detail: data }, 502);
      return json({ invitations: data });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const res = await clerk('/invitations', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        // L'erreur de Clerk est relayée telle quelle : « cette adresse est
        // déjà inscrite » est une information utile à l'administrateur.
        const message =
          data?.errors?.map((e: { long_message?: string; message?: string }) =>
            e.long_message || e.message
          ).join(' | ') || 'Invitation refusée.';
        return json({ error: message }, 400);
      }
      return json({ invitation: data }, 201);
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      if (!id) return json({ error: 'Identifiant requis.' }, 400);

      const res = await clerk(`/invitations/${id}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data?.errors?.map((e: { long_message?: string; message?: string }) =>
            e.long_message || e.message
          ).join(' | ') || 'Révocation refusée.';
        return json({ error: message }, 400);
      }
      return json({ revoked: true });
    }

    return json({ error: 'Méthode non supportée.' }, 405);
  } catch (err) {
    console.error('[admin-invitations]', (err as Error).message);
    return json({ error: 'Erreur inattendue.' }, 500);
  }
});
```

- [ ] **Step 2 : Déclarer la fonction dans `supabase/config.toml`**

Ajouter à la fin du fichier :

```toml
# Détient la clé secrète Clerk pour créer des invitations. Comme les autres,
# le gateway ne sait pas valider le jeton de l'admin — l'autorisation est
# faite dans la fonction par _shared/adminAuth.ts.
[functions.admin-invitations]
verify_jwt = false
```

- [ ] **Step 3 : Poser le secret Clerk**

La clé `sk_live_` de l'instance de production doit être fournie par l'exploitant. Elle ne doit apparaître ni dans le dépôt, ni dans un message.

```bash
printf 'CLERK_SECRET_KEY=sk_live_XXXX\n' > /tmp/ci.env
npx supabase secrets set --env-file /tmp/ci.env
rm -f /tmp/ci.env
```
Expected: `Finished supabase secrets set.`

- [ ] **Step 4 : Déployer**

Run: `npx supabase functions deploy admin-invitations --no-verify-jwt`
Expected: `"functions":["admin-invitations"]`

- [ ] **Step 5 : Vérifier le refus d'un appelant non admin**

```bash
URL=$(grep EXPO_PUBLIC_SUPABASE_URL .env | cut -d= -f2 | tr -d '\r\n')
ANON=$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2 | tr -d '\r\n')
curl -s -X GET "$URL/functions/v1/admin-invitations" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -w "\n→ HTTP %{http_code}\n"
```
Expected: `{"error":"Accès refusé."}` et `HTTP 403`

- [ ] **Step 6 : Commit**

```bash
git add supabase/functions/admin-invitations/index.ts supabase/config.toml
git commit -m "feat(invitations): Edge Function de creation et revocation"
```

---

### Task 4 : L'écran admin

**Files:**
- Create: `admin-ZopGo/src/pages/invitations/index.tsx`
- Modify: `admin-ZopGo/src/App.tsx`

- [ ] **Step 1 : Écrire la page**

```tsx
/**
 * ZopGo Admin — Invitations de comptes
 *
 * Enrôle un chauffeur ou un hébergeur en lui envoyant une invitation par
 * email. La personne choisit elle-même son mot de passe : l'administration
 * n'en manipule aucun.
 *
 * Tout passe par l'Edge Function `admin-invitations`, seul détenteur de la
 * clé secrète Clerk.
 */

import { useCallback, useEffect, useState } from "react";
import {
    Card,
    Form,
    Input,
    Select,
    Button,
    Table,
    Tag,
    Popconfirm,
    Typography,
    Space,
    message as antdMessage,
} from "antd";
import { MailOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "@/config/supabase";
import { USER_ROLE_LABELS } from "@/config/constants";
import { buildInvitationPayload } from "./payload";

const { Text } = Typography;

interface ClerkInvitation {
    id: string;
    email_address: string;
    status: string;
    created_at: number;
    public_metadata?: { role?: string };
}

// Les administrateurs se créent au Dashboard Clerk, délibérément — pas ici.
const ROLES_INVITABLES = ["chauffeur", "hebergeur", "client"];

export function InvitationsPage() {
    const [form] = Form.useForm();
    const [invitations, setInvitations] = useState<ClerkInvitation[]>([]);
    const [chargement, setChargement] = useState(false);
    const [envoi, setEnvoi] = useState(false);

    const charger = useCallback(async () => {
        setChargement(true);
        const { data, error } = await supabase.functions.invoke(
            "admin-invitations",
            { method: "GET" }
        );
        setChargement(false);

        if (error) {
            antdMessage.error("Impossible de charger les invitations.");
            return;
        }
        setInvitations((data as { invitations: ClerkInvitation[] })?.invitations ?? []);
    }, []);

    useEffect(() => {
        void charger();
    }, [charger]);

    const inviter = async (values: { email: string; role: string }) => {
        setEnvoi(true);
        const { data, error } = await supabase.functions.invoke("admin-invitations", {
            method: "POST",
            body: buildInvitationPayload(values.email, values.role),
        });
        setEnvoi(false);

        if (error) {
            const detail = (data as { error?: string } | null)?.error;
            antdMessage.error(detail || "L'invitation n'a pas pu être envoyée.");
            return;
        }
        antdMessage.success(`Invitation envoyée à ${values.email.trim()}.`);
        form.resetFields();
        void charger();
    };

    const revoquer = async (id: string) => {
        const { error } = await supabase.functions.invoke("admin-invitations", {
            method: "DELETE",
            body: { id },
        });
        if (error) {
            antdMessage.error("La révocation a échoué.");
            return;
        }
        antdMessage.success("Invitation révoquée.");
        void charger();
    };

    return (
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Card title="Inviter un chauffeur ou un hébergeur" bordered={false}>
                <Form form={form} layout="inline" onFinish={inviter}>
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: "Adresse email requise" },
                            { type: "email", message: "Adresse invalide" },
                        ]}
                        style={{ minWidth: 280 }}
                    >
                        <Input placeholder="chauffeur@exemple.com" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        rules={[{ required: true, message: "Rôle requis" }]}
                        style={{ minWidth: 180 }}
                    >
                        <Select
                            placeholder="Rôle"
                            options={ROLES_INVITABLES.map((r) => ({
                                value: r,
                                label: USER_ROLE_LABELS[r] ?? r,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={envoi}
                            icon={<MailOutlined />}
                        >
                            Envoyer l'invitation
                        </Button>
                    </Form.Item>
                </Form>

                <Text type="secondary" style={{ fontSize: 12 }}>
                    La personne recevra un email et choisira elle-même son mot de
                    passe. Son compte n'existera qu'une fois l'invitation acceptée.
                </Text>
            </Card>

            <Card title="Invitations en attente" bordered={false}>
                <Table<ClerkInvitation>
                    dataSource={invitations}
                    loading={chargement}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: "Aucune invitation en attente" }}
                >
                    <Table.Column<ClerkInvitation>
                        title="Destinataire"
                        dataIndex="email_address"
                    />
                    <Table.Column<ClerkInvitation>
                        title="Rôle prévu"
                        render={(_, r) => {
                            const role = r.public_metadata?.role;
                            return role ? (
                                <Tag>{USER_ROLE_LABELS[role] ?? role}</Tag>
                            ) : (
                                <Text type="secondary">—</Text>
                            );
                        }}
                    />
                    <Table.Column<ClerkInvitation>
                        title="Envoyée le"
                        render={(_, r) =>
                            dayjs(r.created_at).format("DD/MM/YY HH:mm")
                        }
                    />
                    <Table.Column<ClerkInvitation>
                        title="Action"
                        width={140}
                        render={(_, r) => (
                            <Popconfirm
                                title="Révoquer cette invitation ?"
                                onConfirm={() => revoquer(r.id)}
                            >
                                <Button size="small" danger>
                                    Révoquer
                                </Button>
                            </Popconfirm>
                        )}
                    />
                </Table>
            </Card>
        </Space>
    );
}
```

- [ ] **Step 2 : Déclarer la ressource et la route dans `App.tsx`**

Ajouter l'import à côté des autres pages :

```tsx
import { InvitationsPage } from "@/pages/invitations";
```

Ajouter la ressource dans le tableau `resources`, après celle des codes agence :

```tsx
                {
                    name: "invitations",
                    list: "/invitations",
                    meta: {
                        label: "Invitations",
                        icon: <MailOutlined />,
                    },
                },
```

Ajouter la route à côté des autres routes protégées :

```tsx
                    <Route path="/invitations" element={<InvitationsPage />} />
```

Vérifier que `MailOutlined` figure dans l'import `@ant-design/icons` du fichier ; l'ajouter sinon.

- [ ] **Step 3 : Vérifier**

Depuis `admin-ZopGo/` :

```bash
npx tsc --noEmit
npx jest --config '{"preset":"ts-jest","testEnvironment":"jsdom","setupFilesAfterEnv":["<rootDir>/jest.setup.ts"],"moduleNameMapper":{"\\.(css|less|scss)$":"identity-obj-proxy","^@/(.*)$":"<rootDir>/src/$1"}}'
```
Expected: aucune erreur de typage, tous les tests verts

- [ ] **Step 4 : Commit**

```bash
cd admin-ZopGo
git add src/pages/invitations/index.tsx src/App.tsx
git commit -m "feat(invitations): ecran d'invitation et suivi des envois"
```

---

### Task 5 : Vérification en production

**Files:** aucun

- [ ] **Step 1 : Forger un jeton admin et créer une vraie invitation**

```bash
python3 - <<'PY' > /tmp/adm.txt
import base64, hashlib, hmac, json, time
secret='<le JWT Secret Supabase>'
def b64(x): return base64.urlsafe_b64encode(x).decode().rstrip('=')
now=int(time.time())
p={"aud":"authenticated","role":"authenticated","admin_role":"admin",
   "sub":"probe_invit","iat":now,"exp":now+900}
sign=f"{b64(json.dumps({'alg':'HS256','typ':'JWT'}).encode())}.{b64(json.dumps(p).encode())}"
print(f"{sign}.{b64(hmac.new(secret.encode(), sign.encode(), hashlib.sha256).digest())}")
PY

URL=$(grep EXPO_PUBLIC_SUPABASE_URL .env | cut -d= -f2 | tr -d '\r\n')
ANON=$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2 | tr -d '\r\n')
curl -s -X POST "$URL/functions/v1/admin-invitations" \
  -H "apikey: $ANON" -H "Authorization: Bearer $(cat /tmp/adm.txt)" \
  -H 'Content-Type: application/json' \
  -d '{"email_address":"invit.probe@zopgo.app","public_metadata":{"role":"chauffeur"},"notify":false}' \
  -w "\n→ HTTP %{http_code}\n"
```
Expected: `HTTP 201` et un objet `invitation` contenant un `id`

`notify: false` évite d'envoyer un vrai email lors de la vérification.

- [ ] **Step 2 : Lister, puis révoquer**

```bash
curl -s -X GET "$URL/functions/v1/admin-invitations" \
  -H "apikey: $ANON" -H "Authorization: Bearer $(cat /tmp/adm.txt)"

curl -s -X DELETE "$URL/functions/v1/admin-invitations" \
  -H "apikey: $ANON" -H "Authorization: Bearer $(cat /tmp/adm.txt)" \
  -H 'Content-Type: application/json' -d '{"id":"<id retourné à l étape 1>"}' \
  -w "\n→ HTTP %{http_code}\n"
```
Expected: l'invitation apparaît dans la liste, puis `{"revoked":true}` et `HTTP 200`

- [ ] **Step 3 : Nettoyer**

```bash
rm -f /tmp/adm.txt
```

- [ ] **Step 4 : Vérification complète et commit final**

Depuis la racine :

```bash
npm test && npx tsc --noEmit && npx expo lint
```
Expected: toute la suite verte, aucune erreur de typage hors `admin-ZopGo/`, lint en code 0

```bash
git commit --allow-empty -m "test(invitations): verification en production du cycle complet"
```

---

## Notes d'implémentation

**Le rôle ne survit que dans `public_metadata`.** C'est l'unique subtilité de cette fonctionnalité, et elle est silencieuse : sans le repli du webhook, chaque invité deviendrait `client` sans qu'aucune erreur n'apparaisse nulle part.

**L'autorisation ne délègue pas à RLS.** Une première conception lisait `audit_log` pour prouver la qualité d'admin. Elle était fausse — un refus RLS renvoie un résultat vide, pas une erreur — et acceptait n'importe quel porteur de jeton valide. `_shared/adminAuth.ts` vérifie donc la signature et le claim.

**Le compte n'existe qu'après acceptation.** Tant que l'invitation est en attente, il n'y a ni utilisateur Clerk, ni ligne `profiles`. La liste des invitations est le seul endroit où l'administration voit ces personnes.
