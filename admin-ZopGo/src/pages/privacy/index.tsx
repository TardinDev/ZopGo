/**
 * Politique de confidentialité — page publique (hors auth Clerk).
 * Sert d'URL de règles de confidentialité pour le Google Play Store.
 * Contenu dérivé de PRIVACY_POLICY.md (app mobile ZopGo).
 */

import { Typography, Table, Layout, Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { COLORS, DARK } from "@/config/constants";

const { Title, Paragraph, Text, Link } = Typography;

const CONTACT_EMAIL = "tardindavy@gmail.com";
const LAST_UPDATED = "15 mars 2026";

const thirdParties = [
    {
        key: "clerk",
        service: "Clerk",
        url: "https://clerk.com/privacy",
        usage: "Authentification",
        data: "Email, nom, session",
    },
    {
        key: "supabase",
        service: "Supabase",
        url: "https://supabase.com/privacy",
        usage: "Base de données et stockage",
        data: "Profil, évaluations, avatar",
    },
    {
        key: "gemini",
        service: "Google Gemini",
        url: "https://ai.google.dev/terms",
        usage: "Assistant IA",
        data: "Messages de conversation",
    },
    {
        key: "fcm",
        service: "Firebase Cloud Messaging (Google)",
        url: "https://firebase.google.com/support/privacy",
        usage: "Notifications push (Android)",
        data: "Token d'appareil",
    },
    {
        key: "expo",
        service: "Expo Push",
        url: "https://expo.dev/privacy",
        usage: "Notifications push (iOS)",
        data: "Token de notification",
    },
];

export function PrivacyPage() {
    return (
        <Layout style={{ minHeight: "100vh", background: DARK.pageBg }}>
            <div
                style={{
                    maxWidth: 820,
                    margin: "0 auto",
                    padding: "48px 24px 96px",
                }}
            >
                <Button
                    type="primary"
                    icon={<HomeOutlined />}
                    href="/"
                    style={{ marginBottom: 24 }}
                >
                    Retour à l'accueil
                </Button>
                <Title level={1} style={{ color: COLORS.primary }}>
                    Politique de Confidentialité — ZopGo
                </Title>
                <Paragraph type="secondary">
                    <Text strong>Dernière mise à jour :</Text> {LAST_UPDATED}
                </Paragraph>
                <Paragraph>
                    ZopGo est une application mobile de mise en relation entre
                    clients, transporteurs et hébergeurs. La présente politique
                    de confidentialité décrit les données que nous collectons,
                    comment nous les utilisons et les droits dont vous disposez.
                </Paragraph>

                <Title level={2}>1. Données collectées</Title>
                <Title level={4}>Données de compte</Title>
                <ul>
                    <li>
                        <Text strong>Email</Text> : utilisé pour
                        l'authentification et les communications
                    </li>
                    <li>
                        <Text strong>Nom et prénom</Text> : affichés dans votre
                        profil
                    </li>
                    <li>
                        <Text strong>Numéro de téléphone</Text> : facultatif,
                        utilisé pour la mise en relation
                    </li>
                    <li>
                        <Text strong>Rôle</Text> : client, transporteur ou
                        hébergeur
                    </li>
                    <li>
                        <Text strong>Photo de profil (avatar)</Text> :
                        facultative, stockée sur nos serveurs
                    </li>
                </ul>
                <Title level={4}>Données d'utilisation</Title>
                <ul>
                    <li>
                        <Text strong>Évaluations et avis</Text> : notes et
                        commentaires laissés sur les prestations
                    </li>
                    <li>
                        <Text strong>Statut de disponibilité</Text> : pour les
                        transporteurs et hébergeurs
                    </li>
                    <li>
                        <Text strong>Conversations avec l'assistant IA</Text> :
                        messages envoyés à l'assistant intégré
                    </li>
                </ul>
                <Title level={4}>Données techniques</Title>
                <ul>
                    <li>
                        <Text strong>Tokens de notifications push</Text> : pour
                        l'envoi de notifications
                    </li>
                    <li>
                        <Text strong>Identifiant d'appareil</Text> : pour le
                        diagnostic d'erreurs
                    </li>
                </ul>

                <Title level={2}>2. Données NON collectées</Title>
                <ul>
                    <li>
                        <Text strong>Localisation</Text> : ZopGo ne collecte pas
                        votre position géographique
                    </li>
                    <li>
                        <Text strong>Contacts</Text> : aucun accès à votre
                        carnet d'adresses
                    </li>
                    <li>
                        <Text strong>Caméra/Microphone</Text> : aucun accès
                        direct (sauf sélection manuelle de photo de profil)
                    </li>
                </ul>

                <Title level={2}>3. Services tiers</Title>
                <Paragraph>
                    Nous utilisons les services tiers suivants, chacun ayant sa
                    propre politique de confidentialité :
                </Paragraph>
                <Table
                    dataSource={thirdParties}
                    pagination={false}
                    size="small"
                    columns={[
                        {
                            title: "Service",
                            dataIndex: "service",
                            render: (_: string, r) => (
                                <Link href={r.url} target="_blank">
                                    {r.service}
                                </Link>
                            ),
                        },
                        { title: "Usage", dataIndex: "usage" },
                        { title: "Données partagées", dataIndex: "data" },
                    ]}
                />

                <Title level={2} style={{ marginTop: 32 }}>
                    4. Stockage local
                </Title>
                <Paragraph>
                    L'application stocke localement sur votre appareil :
                </Paragraph>
                <ul>
                    <li>
                        <Text strong>SecureStore</Text> (chiffré) : tokens
                        d'authentification Clerk
                    </li>
                    <li>
                        <Text strong>AsyncStorage</Text> : préférences
                        utilisateur et cache de données
                    </li>
                </ul>
                <Paragraph>
                    Ces données ne quittent jamais votre appareil sauf pour
                    l'authentification.
                </Paragraph>

                <Title level={2}>5. Notifications push</Title>
                <Paragraph>
                    ZopGo utilise Firebase Cloud Messaging (Google) sur Android
                    et Expo Push sur iOS pour vous envoyer des notifications. Un
                    token unique est généré pour votre appareil et stocké sur
                    nos serveurs afin de vous adresser les notifications. Vous
                    pouvez désactiver les notifications dans les paramètres de
                    votre appareil à tout moment.
                </Paragraph>

                <Title level={2}>6. Assistant IA</Title>
                <Paragraph>
                    L'assistant IA intégré utilise l'API Google Gemini. Les
                    messages que vous envoyez à l'assistant sont transmis à
                    Google pour générer les réponses. Google peut traiter ces
                    données conformément à ses conditions d'utilisation. Ne
                    partagez pas d'informations personnelles sensibles avec
                    l'assistant.
                </Paragraph>

                <Title level={2}>7. Sécurité</Title>
                <ul>
                    <li>
                        Les tokens d'authentification sont stockés de manière
                        chiffrée (SecureStore)
                    </li>
                    <li>
                        Les communications avec nos serveurs sont chiffrées
                        (HTTPS)
                    </li>
                    <li>
                        L'accès aux données est restreint par rôle et
                        authentification
                    </li>
                </ul>

                <Title level={2}>8. Vos droits</Title>
                <Paragraph>
                    Conformément à la réglementation applicable, vous disposez
                    des droits suivants :
                </Paragraph>
                <ul>
                    <li>
                        <Text strong>Accès</Text> : obtenir une copie de vos
                        données personnelles
                    </li>
                    <li>
                        <Text strong>Rectification</Text> : corriger vos données
                        via les paramètres de votre profil
                    </li>
                    <li>
                        <Text strong>Suppression</Text> : demander la
                        suppression de votre compte et de vos données
                    </li>
                    <li>
                        <Text strong>Opposition</Text> : vous opposer au
                        traitement de vos données
                    </li>
                </ul>
                <Paragraph>
                    Pour exercer ces droits, contactez-nous à l'adresse indiquée
                    ci-dessous.
                </Paragraph>

                <Title level={2}>9. Modifications</Title>
                <Paragraph>
                    Nous pouvons mettre à jour cette politique de
                    confidentialité. Les modifications seront publiées dans
                    l'application et sur notre page de store. La date de
                    dernière mise à jour est indiquée en haut de ce document.
                </Paragraph>

                <Title level={2}>10. Contact</Title>
                <Paragraph>
                    Pour toute question relative à la protection de vos données :
                </Paragraph>
                <ul>
                    <li>
                        <Text strong>Email</Text> :{" "}
                        <Link href={`mailto:${CONTACT_EMAIL}`}>
                            {CONTACT_EMAIL}
                        </Link>
                    </li>
                    <li>
                        <Text strong>Application</Text> : section Paramètres
                        &gt; Aide &amp; Contact
                    </li>
                </ul>
            </div>
        </Layout>
    );
}
