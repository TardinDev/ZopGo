/**
 * ZopGo Admin — Enrôlement par invitation email
 *
 * POURQUOI CET ÉCRAN
 * Chauffeurs et hébergeurs ne s'inscrivent pas librement : leur rôle donne
 * accès à des écrans de gestion (publier des trajets, des logements) et ne
 * peut pas être auto-attribué. On les enrôle donc par invitation nominative,
 * dont le rôle voyage dans `public_metadata` — le seul champ qu'une
 * invitation Clerk transporte jusqu'au compte créé (voir ./payload.ts).
 *
 * POURQUOI PASSER PAR UNE EDGE FUNCTION
 * Créer une invitation exige la clé secrète Clerk, qui ne peut pas vivre dans
 * un bundle navigateur. Tous les appels passent donc par la fonction
 * `admin-invitations`, qui la détient côté serveur et vérifie elle-même la
 * qualité d'administrateur de l'appelant.
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
    Typography,
    Space,
    Popconfirm,
    Alert,
    Empty,
    App,
} from "antd";
import { MailOutlined, SendOutlined } from "@ant-design/icons";
import { DateField } from "@refinedev/antd";
import { supabase } from "@/config/supabase";
import { DARK, USER_ROLE_LABELS } from "@/config/constants";
import { buildInvitationPayload } from "./payload";

const { Text, Paragraph } = Typography;

/**
 * Rôles proposés à l'invitation.
 *
 * `agence` en est volontairement absent : une agence s'enrôle par code
 * d'invitation à usage unique (écran « Codes agence »), pas par email. Et
 * `admin` encore moins — promouvoir un administrateur doit rester un geste
 * délibéré, fait à la main dans Clerk, pas une entrée de liste déroulante à
 * un clic d'une invitation ordinaire.
 */
const ROLES_INVITABLES = ["chauffeur", "hebergeur", "client"] as const;

/** Ce qu'on lit d'une invitation Clerk — le reste de l'objet ne sert pas ici. */
interface ClerkInvitation {
    id: string;
    email_address: string;
    public_metadata?: { role?: string } | null;
    created_at?: number;
    status?: string;
}

interface FormValues {
    email: string;
    role: string;
}

/**
 * Extrait le message porté par une erreur de `functions.invoke`.
 *
 * `functions.invoke` ne met pas le corps d'une réponse d'erreur dans `data` :
 * il renvoie un `FunctionsHttpError` dont le `context` est la Response brute.
 * Sans la relire ici, l'admin verrait « Edge Function returned a non-2xx
 * status code » à la place de « cette adresse est déjà inscrite » — le seul
 * message qui lui dise quoi faire.
 *
 * Toute anomalie de relecture (corps vide, non-JSON, flux déjà consommé) est
 * avalée : on retombe alors sur le message de l'erreur d'origine plutôt que
 * de faire remonter un « Unexpected end of JSON input » qui n'apprend rien.
 */
async function messageDErreur(error: Error): Promise<string> {
    const context = (error as { context?: Response }).context;

    if (context && typeof context.json === "function") {
        try {
            const corps = (await context.json()) as { error?: string } | null;
            if (corps?.error) return corps.error;
        } catch {
            /* corps illisible — on garde le message d'origine */
        }
    }

    return error.message || "L'appel au service d'invitation a échoué.";
}

/**
 * Appelle `admin-invitations` et renvoie son corps, ou lève avec le message
 * de la fonction.
 */
async function invoquerInvitations<T>(
    method: "GET" | "POST" | "DELETE",
    body?: object,
): Promise<T> {
    const { data, error } = await supabase.functions.invoke("admin-invitations", {
        method,
        // Un GET ne doit porter aucun corps : le passer, même vide, ferait
        // basculer fetch sur une requête que l'Edge Function refuserait.
        ...(body === undefined ? {} : { body: body as Record<string, unknown> }),
    });

    if (error) {
        throw new Error(await messageDErreur(error));
    }

    return data as T;
}

export function InvitationsPage() {
    const { message } = App.useApp();
    const [form] = Form.useForm<FormValues>();

    const [invitations, setInvitations] = useState<ClerkInvitation[]>([]);
    const [chargement, setChargement] = useState(true);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [revocationEnCours, setRevocationEnCours] = useState<string | null>(null);
    const [erreurListe, setErreurListe] = useState<string | null>(null);

    const chargerInvitations = useCallback(async () => {
        setChargement(true);
        try {
            const data = await invoquerInvitations<{ invitations: ClerkInvitation[] }>(
                "GET",
            );
            setInvitations(data?.invitations ?? []);
            setErreurListe(null);
        } catch (err) {
            setErreurListe((err as Error).message);
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        void chargerInvitations();
    }, [chargerInvitations]);

    const handleEnvoyer = async (values: FormValues) => {
        setEnvoiEnCours(true);
        try {
            // buildInvitationPayload normalise l'email et garantit que le rôle
            // atterrit dans public_metadata — sans quoi le webhook retomberait
            // sur `client` en silence.
            const payload = buildInvitationPayload(values.email, values.role);
            await invoquerInvitations("POST", payload);

            message.success(`Invitation envoyée à ${payload.email_address}`);
            form.resetFields();
            await chargerInvitations();
        } catch (err) {
            // Le message vient de Clerk (« cette adresse est déjà inscrite »,
            // « invitation déjà en attente »…) : bien plus actionnable qu'un
            // « échec de l'envoi » générique.
            message.error((err as Error).message);
        } finally {
            setEnvoiEnCours(false);
        }
    };

    const handleRevoquer = async (id: string) => {
        setRevocationEnCours(id);
        try {
            await invoquerInvitations("DELETE", { id });
            message.success("Invitation révoquée");
            await chargerInvitations();
        } catch (err) {
            message.error((err as Error).message);
        } finally {
            setRevocationEnCours(null);
        }
    };

    return (
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* ─── Formulaire d'invitation ─────────────────────────── */}
            <Card
                title={
                    <Space>
                        <MailOutlined />
                        <span>Inviter un utilisateur</span>
                    </Space>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleEnvoyer}
                    style={{ maxWidth: 640 }}
                    initialValues={{ role: "chauffeur" }}
                >
                    <Form.Item
                        label="Adresse email"
                        name="email"
                        rules={[
                            { required: true, message: "L'adresse email est requise" },
                            { type: "email", message: "Adresse email invalide" },
                        ]}
                    >
                        <Input
                            placeholder="chauffeur@exemple.ga"
                            autoComplete="off"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Rôle attribué"
                        name="role"
                        rules={[{ required: true, message: "Le rôle est requis" }]}
                    >
                        <Select
                            size="large"
                            options={ROLES_INVITABLES.map((role) => ({
                                value: role,
                                label: USER_ROLE_LABELS[role] ?? role,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 12 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SendOutlined />}
                            loading={envoiEnCours}
                            size="large"
                        >
                            Envoyer l&apos;invitation
                        </Button>
                    </Form.Item>

                    <Paragraph
                        style={{
                            color: DARK.textSecondary,
                            fontSize: 12,
                            marginBottom: 0,
                        }}
                    >
                        La personne recevra un email de ZopGo et choisira elle-même son
                        mot de passe. Son compte n&apos;existe pas tant qu&apos;elle
                        n&apos;a pas accepté l&apos;invitation — jusque-là, elle
                        n&apos;apparaîtra pas dans la liste des utilisateurs.
                    </Paragraph>
                </Form>
            </Card>

            {/* ─── Invitations en attente ──────────────────────────── */}
            <Card
                title="Invitations en attente"
                extra={
                    <Button size="small" onClick={() => void chargerInvitations()}>
                        Actualiser
                    </Button>
                }
            >
                {erreurListe && (
                    <Alert
                        type="error"
                        showIcon
                        message="Impossible de charger les invitations"
                        description={erreurListe}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Table<ClerkInvitation>
                    dataSource={invitations}
                    rowKey="id"
                    loading={chargement}
                    size="middle"
                    pagination={false}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <Text style={{ color: DARK.textSecondary }}>
                                        Aucune invitation en attente. Les invitations
                                        acceptées disparaissent d&apos;ici et
                                        apparaissent dans les utilisateurs.
                                    </Text>
                                }
                            />
                        ),
                    }}
                >
                    <Table.Column<ClerkInvitation>
                        title="Destinataire"
                        dataIndex="email_address"
                        key="email_address"
                        render={(email: string) => (
                            <Text style={{ fontWeight: 600, color: DARK.textPrimary }}>
                                {email}
                            </Text>
                        )}
                    />

                    <Table.Column<ClerkInvitation>
                        title="Rôle prévu"
                        key="role"
                        width={160}
                        render={(_, record) => {
                            const role = record.public_metadata?.role;
                            if (!role) {
                                // Une invitation sans rôle créerait un compte
                                // `client` par défaut : il vaut mieux le voir.
                                return <Tag color="orange">Non défini</Tag>;
                            }
                            return <Tag color="blue">{USER_ROLE_LABELS[role] ?? role}</Tag>;
                        }}
                    />

                    <Table.Column<ClerkInvitation>
                        title="Envoyée le"
                        dataIndex="created_at"
                        key="created_at"
                        width={180}
                        render={(value?: number) =>
                            value ? (
                                <DateField value={value} format="DD/MM/YYYY HH:mm" />
                            ) : (
                                <Text style={{ color: DARK.textSecondary }}>—</Text>
                            )
                        }
                    />

                    <Table.Column<ClerkInvitation>
                        title="Actions"
                        key="actions"
                        width={140}
                        render={(_, record) => (
                            <Popconfirm
                                title="Révoquer cette invitation ?"
                                description="Le lien reçu par email cessera de fonctionner."
                                okText="Révoquer"
                                cancelText="Annuler"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleRevoquer(record.id)}
                            >
                                <Button
                                    danger
                                    size="small"
                                    loading={revocationEnCours === record.id}
                                >
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
