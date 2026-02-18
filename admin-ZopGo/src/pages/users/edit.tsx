/**
 * ZopGo Admin — Formulaire de modification utilisateur
 */

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Switch, Space, Typography } from "antd";
import { USER_ROLE_LABELS } from "@/config/constants";
import type { DbProfile } from "@/types";

const { Text } = Typography;

export function UserEdit() {
    const { formProps, saveButtonProps, queryResult } = useForm<DbProfile>({
        resource: "profiles",
    });

    const record = queryResult?.data?.data;
    const isSuspended = !!record?.deleted_at;

    return (
        <Edit
            saveButtonProps={saveButtonProps}
            title="Modifier utilisateur"
        >
            <Form
                {...formProps}
                layout="vertical"
                style={{ maxWidth: 600 }}
            >
                <Form.Item
                    label="Nom"
                    name="name"
                    rules={[{ required: true, message: "Le nom est requis" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: "L'email est requis" },
                        { type: "email", message: "Format email invalide" },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Téléphone" name="phone">
                    <Input placeholder="+241 …" />
                </Form.Item>

                <Form.Item
                    label="Rôle"
                    name="role"
                    rules={[{ required: true }]}
                >
                    <Select
                        options={Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                    />
                </Form.Item>

                {/* Suspend toggle */}
                <Form.Item label="Suspension">
                    <Space>
                        <Switch
                            checked={isSuspended}
                            onChange={(checked) => {
                                formProps.form?.setFieldsValue({
                                    deleted_at: checked ? new Date().toISOString() : null,
                                });
                            }}
                            checkedChildren="Suspendu"
                            unCheckedChildren="Actif"
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {isSuspended
                                ? "L'utilisateur est actuellement suspendu"
                                : "L'utilisateur est actif"}
                        </Text>
                    </Space>
                </Form.Item>

                {/* Hidden field for deleted_at */}
                <Form.Item name="deleted_at" hidden>
                    <Input />
                </Form.Item>
            </Form>
        </Edit>
    );
}
