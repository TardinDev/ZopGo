/**
 * ZopGo Admin — Composer pour annonces broadcast (admin_messages)
 *
 * Workflow :
 *   1. Admin remplit titre + corps + cible (user/role/all)
 *   2. Soumission → INSERT dans admin_messages
 *   3. onMutationSuccess → sendAdminPush() pour notifier les cibles
 *   4. Redirect vers la liste
 */

import { useState } from "react";
import { Create, useForm, useSelect } from "@refinedev/antd";
import {
    Form,
    Input,
    Select,
    Radio,
    DatePicker,
    Alert,
    Typography,
    Space,
    message as antdMessage,
} from "antd";
import { useGetIdentity } from "@refinedev/core";
import { sendAdminPush } from "@/lib/sendAdminPush";
import {
    ADMIN_MESSAGE_TARGET_LABELS,
    USER_ROLE_LABELS,
} from "@/config/constants";
import type {
    DbAdminMessage,
    DbProfile,
    AdminMessageTargetType,
    UserRole,
} from "@/types";

const { TextArea } = Input;
const { Text } = Typography;

interface AdminIdentity {
    id: string;
    name: string;
    email?: string;
}

interface FormValues {
    title: string;
    body: string;
    target_type: AdminMessageTargetType;
    target_user_id?: string | null;
    target_role?: UserRole | null;
    expires_at?: string | null;
}

export function AdminMessageCreate() {
    const { data: identity } = useGetIdentity<AdminIdentity>();
    const [pushFeedback, setPushFeedback] = useState<string | null>(null);

    const { formProps, saveButtonProps, form, onFinish, redirect } =
        useForm<DbAdminMessage>({
            resource: "admin_messages",
            redirect: false, // on redirige nous-mêmes après le push
            successNotification: () => ({
                type: "success",
                message: "Annonce créée — envoi push en cours…",
                description: "",
            }),
            onMutationSuccess: async (data) => {
                const created = data?.data;
                if (!created?.id) return;

                try {
                    const result = await sendAdminPush({
                        messageId: created.id,
                        targetType: created.target_type,
                        targetUserId: created.target_user_id,
                        targetRole: created.target_role,
                        title: created.title,
                        body: created.body,
                    });
                    setPushFeedback(
                        `Push : ${result.sent} envoyées, ${result.failed} échecs, ${result.skipped} ignorées (préférences ou pas de token).`,
                    );
                    antdMessage.success(
                        `Push envoyée à ${result.sent} destinataire(s)`,
                    );
                } catch (err) {
                    const errorMsg =
                        err instanceof Error ? err.message : "Erreur inconnue";
                    setPushFeedback(`Push échouée : ${errorMsg}`);
                    antdMessage.warning(
                        "Annonce créée mais push échouée. L'in-app est OK.",
                    );
                }

                // Redirige vers la liste après le push
                redirect("list");
            },
        });

    // Watch target_type pour afficher le bon picker
    const targetType = Form.useWatch("target_type", form) as
        | AdminMessageTargetType
        | undefined;

    // Async search dans profiles pour target_type=user
    const { selectProps: userSelectProps } = useSelect<DbProfile>({
        resource: "profiles",
        optionLabel: (item) => `${item.name} (${item.email})`,
        optionValue: "id",
        onSearch: (value) => [
            { field: "name", operator: "contains", value },
        ],
        pagination: { mode: "server", pageSize: 20 },
    });

    // Injecte sender_clerk_id et sender_name avant submit
    const handleFinish = (values: FormValues) => {
        return onFinish({
            title: values.title,
            body: values.body,
            target_type: values.target_type,
            target_user_id:
                values.target_type === "user" ? values.target_user_id ?? null : null,
            target_role:
                values.target_type === "role" ? values.target_role ?? null : null,
            expires_at: values.expires_at ?? null,
            push_sent: false,
            sender_clerk_id: identity?.id ?? "",
            sender_name: identity?.name ?? "Admin",
        });
    };

    return (
        <Create
            saveButtonProps={{
                ...saveButtonProps,
                children: "Envoyer l'annonce",
            }}
            title="Nouvelle annonce"
        >
            <Form
                {...formProps}
                onFinish={(values) => handleFinish(values as FormValues)}
                layout="vertical"
                style={{ maxWidth: 720 }}
                initialValues={{ target_type: "all" }}
            >
                <Form.Item
                    label="Titre"
                    name="title"
                    rules={[
                        { required: true, message: "Le titre est requis" },
                        { max: 100, message: "100 caractères maximum" },
                    ]}
                >
                    <Input
                        placeholder="ex. Maintenance prévue dimanche"
                        showCount
                        maxLength={100}
                    />
                </Form.Item>

                <Form.Item
                    label="Message"
                    name="body"
                    rules={[
                        { required: true, message: "Le message est requis" },
                        { max: 500, message: "500 caractères maximum" },
                    ]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Texte de l'annonce…"
                        showCount
                        maxLength={500}
                    />
                </Form.Item>

                <Form.Item
                    label="Cible"
                    name="target_type"
                    rules={[{ required: true, message: "Choisissez une cible" }]}
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Détermine qui recevra l'annonce dans l'app mobile.
                        </Text>
                    }
                >
                    <Radio.Group>
                        <Space direction="vertical">
                            <Radio value="all">
                                {ADMIN_MESSAGE_TARGET_LABELS.all}
                            </Radio>
                            <Radio value="role">
                                {ADMIN_MESSAGE_TARGET_LABELS.role}
                            </Radio>
                            <Radio value="user">
                                {ADMIN_MESSAGE_TARGET_LABELS.user}
                            </Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>

                {targetType === "role" && (
                    <Form.Item
                        label="Rôle ciblé"
                        name="target_role"
                        rules={[{ required: true, message: "Choisissez un rôle" }]}
                    >
                        <Select
                            placeholder="Sélectionner un rôle"
                            options={Object.entries(USER_ROLE_LABELS).map(
                                ([value, label]) => ({ value, label }),
                            )}
                            style={{ maxWidth: 300 }}
                        />
                    </Form.Item>
                )}

                {targetType === "user" && (
                    <Form.Item
                        label="Utilisateur ciblé"
                        name="target_user_id"
                        rules={[
                            { required: true, message: "Choisissez un utilisateur" },
                        ]}
                    >
                        <Select
                            {...userSelectProps}
                            placeholder="Rechercher par nom…"
                            showSearch
                            style={{ maxWidth: 480 }}
                        />
                    </Form.Item>
                )}

                <Form.Item
                    label="Expire le (optionnel)"
                    name="expires_at"
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Après cette date, l'annonce ne s'affichera plus dans l'app.
                        </Text>
                    }
                >
                    <DatePicker
                        showTime
                        format="DD/MM/YYYY HH:mm"
                        style={{ maxWidth: 300 }}
                    />
                </Form.Item>

                {pushFeedback && (
                    <Alert
                        message={pushFeedback}
                        type="info"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                )}
            </Form>
        </Create>
    );
}
