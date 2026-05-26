/**
 * ZopGo Admin — Créer un code d'invitation agence
 *
 * Workflow :
 *   1. Admin saisit le nom de l'agence + (optionnel) une date d'expiration
 *   2. Le code peut être laissé vide → on génère "ZOPGO-AGENCE-XXXXXX"
 *      (6 chiffres alphanum) côté client. Sinon on respecte la valeur saisie
 *      (uppercase forcé) tant qu'elle fait 6–64 chars (contrainte DB de la
 *      migration 028).
 *   3. INSERT dans agency_invitations avec created_by = id du profil admin
 *   4. Redirect vers la liste — l'admin peut copier le code depuis là
 */

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker, Typography, Alert } from "antd";
import { useGetIdentity } from "@refinedev/core";
import { supabase } from "@/config/supabase";
import { useEffect, useState } from "react";
import type { DbAgencyInvitation } from "@/types";

const { Text } = Typography;

interface AdminIdentity {
    id: string; // Clerk id
    name: string;
    email?: string;
}

interface FormValues {
    agency_name: string;
    code?: string;
    expires_at?: string | null;
}

// Generate a memorable-but-unguessable code. Format mirrors the example
// shown in the mobile app placeholder (ZOPGO-AGENCE-XXXXXX).
function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid OCR/manual typos
    let out = "";
    for (let i = 0; i < 6; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return `ZOPGO-AGENCE-${out}`;
}

export function AgencyInvitationCreate() {
    const { data: identity } = useGetIdentity<AdminIdentity>();
    const [adminProfileId, setAdminProfileId] = useState<string | null>(null);
    const [profileLookupError, setProfileLookupError] = useState<string | null>(null);

    // The `created_by` column is a FK to public.profiles(id), not Clerk id.
    // Resolve the admin's profile row from their Clerk id (which is what
    // useGetIdentity returns).
    useEffect(() => {
        if (!identity?.id) return;
        let cancelled = false;
        (async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id")
                .eq("clerk_id", identity.id)
                .maybeSingle();
            if (cancelled) return;
            if (error) {
                setProfileLookupError(
                    "Impossible de récupérer ton profil admin — created_by sera laissé vide."
                );
                return;
            }
            if (data) setAdminProfileId(data.id as string);
        })();
        return () => {
            cancelled = true;
        };
    }, [identity?.id]);

    const { formProps, saveButtonProps, onFinish } = useForm<DbAgencyInvitation>({
        resource: "agency_invitations",
        redirect: "list",
        successNotification: (data) => ({
            type: "success",
            message: "Code d'invitation créé",
            description: `Code : ${data?.data?.code ?? ""}`,
        }),
    });

    const handleFinish = (values: FormValues) => {
        const code = (values.code?.trim() || generateCode()).toUpperCase();
        return onFinish({
            agency_name: values.agency_name.trim(),
            code,
            expires_at: values.expires_at ?? null,
            // `used_at` / `used_by` left untouched (defaults to null).
            created_by: adminProfileId,
        });
    };

    return (
        <Create
            saveButtonProps={{ ...saveButtonProps, children: "Créer le code" }}
            title="Nouveau code d'invitation"
        >
            <Form
                {...formProps}
                onFinish={(values) => handleFinish(values as FormValues)}
                layout="vertical"
                style={{ maxWidth: 640 }}
            >
                {profileLookupError && (
                    <Alert
                        type="warning"
                        message={profileLookupError}
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Form.Item
                    label="Nom de l'agence"
                    name="agency_name"
                    rules={[
                        { required: true, message: "Le nom de l'agence est requis" },
                        { max: 120, message: "120 caractères maximum" },
                    ]}
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Ce nom apparaîtra sur toutes les VoyageCard que l&apos;agence
                            publiera (ex. &laquo;&nbsp;Air ZopGo&nbsp;&raquo;).
                        </Text>
                    }
                >
                    <Input placeholder="ex. Air ZopGo" showCount maxLength={120} />
                </Form.Item>

                <Form.Item
                    label="Code (optionnel)"
                    name="code"
                    rules={[
                        {
                            pattern: /^.{6,64}$/,
                            message: "Le code doit faire entre 6 et 64 caractères",
                        },
                    ]}
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Laisse vide pour générer automatiquement un code de la forme
                            <Text code>ZOPGO-AGENCE-XXXXXX</Text>. Si tu saisis ton propre
                            code, il sera converti en MAJUSCULES.
                        </Text>
                    }
                >
                    <Input
                        placeholder="ZOPGO-AGENCE-AB12CD (laisse vide pour auto)"
                        style={{
                            fontFamily:
                                "'JetBrains Mono', 'SF Mono', Menlo, monospace",
                            letterSpacing: 1,
                        }}
                        onChange={(e) => {
                            // Mirror the mobile signup field — UX consistency.
                            const upper = e.target.value.toUpperCase();
                            if (upper !== e.target.value) {
                                e.target.value = upper;
                            }
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label="Expire le (optionnel)"
                    name="expires_at"
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Après cette date, le code ne pourra plus être utilisé pour
                            s&apos;inscrire. Laisse vide pour aucune expiration.
                        </Text>
                    }
                >
                    <DatePicker
                        showTime
                        format="DD/MM/YYYY HH:mm"
                        style={{ maxWidth: 280 }}
                    />
                </Form.Item>

                <Alert
                    type="info"
                    showIcon
                    message="Code à usage unique"
                    description="Une fois le code consommé par une agence, il devient invalide. Pour ajouter un autre compte à la même agence, génère un nouveau code."
                />
            </Form>
        </Create>
    );
}
