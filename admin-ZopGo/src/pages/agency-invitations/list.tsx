/**
 * ZopGo Admin — Liste des codes d'invitation agence (agency_invitations)
 *
 * Codes à usage unique remis aux agences pour qu'elles puissent s'inscrire
 * dans l'app mobile avec role='agence'. Tableau lecture seule (la création
 * passe par /agency-invitations/create) ; on affiche le statut calculé
 * (pending / used / expired) en Tag coloré pour distinguer en un coup d'œil
 * les codes encore disponibles des codes consommés ou périmés.
 */

import { useState } from "react";
import { List, useTable, CreateButton, DateField, DeleteButton } from "@refinedev/antd";
import { Table, Tag, Typography, Space, Tooltip, Button, message } from "antd";
import {
    CopyOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { DARK } from "@/config/constants";
import type { DbAgencyInvitation } from "@/types";

const { Text } = Typography;

type Status = "pending" | "used" | "expired";

function computeStatus(row: DbAgencyInvitation): Status {
    if (row.used_at) return "used";
    if (row.expires_at && new Date(row.expires_at) < new Date()) return "expired";
    return "pending";
}

function StatusTag({ status }: { status: Status }) {
    if (status === "used") {
        return (
            <Tag color="default" icon={<CheckCircleOutlined />}>
                Utilisé
            </Tag>
        );
    }
    if (status === "expired") {
        return (
            <Tag color="red" icon={<CloseCircleOutlined />}>
                Expiré
            </Tag>
        );
    }
    return (
        <Tag color="green" icon={<ClockCircleOutlined />}>
            Disponible
        </Tag>
    );
}

function CopyCodeCell({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            message.success("Code copié");
            setTimeout(() => setCopied(false), 1500);
        } catch {
            message.error("Impossible de copier — copie manuelle requise");
        }
    };
    return (
        <Space size={6}>
            <Text
                code
                style={{
                    fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
                    fontSize: 13,
                    color: DARK.textPrimary,
                }}
            >
                {code}
            </Text>
            <Tooltip title={copied ? "Copié !" : "Copier le code"}>
                <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                />
            </Tooltip>
        </Space>
    );
}

export function AgencyInvitationList() {
    const { tableProps } = useTable<DbAgencyInvitation>({
        resource: "agency_invitations",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        // Pull the relation so "Utilisé par" can render the agency profile
        // name instead of just a UUID.
        meta: {
            select: "*, used_by_profile:used_by(id, name, email)",
        },
    });

    return (
        <List
            title="Codes d'invitation agence"
            headerButtons={<CreateButton>Nouveau code</CreateButton>}
        >
            <Table
                {...tableProps}
                rowKey="id"
                size="middle"
                scroll={{ x: 1100 }}
            >
                <Table.Column<DbAgencyInvitation>
                    title="Agence"
                    dataIndex="agency_name"
                    key="agency_name"
                    width={220}
                    render={(name: string) => (
                        <Text style={{ fontWeight: 600, color: DARK.textPrimary }}>
                            {name}
                        </Text>
                    )}
                />

                <Table.Column<DbAgencyInvitation>
                    title="Code"
                    dataIndex="code"
                    key="code"
                    width={260}
                    render={(code: string) => <CopyCodeCell code={code} />}
                />

                <Table.Column<DbAgencyInvitation>
                    title="Statut"
                    key="status"
                    width={130}
                    render={(_, row) => <StatusTag status={computeStatus(row)} />}
                    filters={[
                        { text: "Disponible", value: "pending" },
                        { text: "Utilisé", value: "used" },
                        { text: "Expiré", value: "expired" },
                    ]}
                    onFilter={(value, row) => computeStatus(row) === value}
                />

                <Table.Column<DbAgencyInvitation>
                    title="Utilisé par"
                    key="used_by"
                    width={220}
                    render={(_, row) => {
                        if (!row.used_at) {
                            return (
                                <Text style={{ color: DARK.textSecondary, fontSize: 12 }}>
                                    —
                                </Text>
                            );
                        }
                        const profile = row.used_by_profile;
                        return (
                            <div>
                                <div style={{ fontWeight: 500 }}>
                                    {profile?.name ?? "(profil inconnu)"}
                                </div>
                                {profile?.email && (
                                    <Text
                                        style={{
                                            color: DARK.textSecondary,
                                            fontSize: 11,
                                        }}
                                    >
                                        {profile.email}
                                    </Text>
                                )}
                            </div>
                        );
                    }}
                />

                <Table.Column<DbAgencyInvitation>
                    title="Expire le"
                    dataIndex="expires_at"
                    key="expires_at"
                    width={160}
                    render={(value: string | null) => {
                        if (!value) {
                            return (
                                <Text
                                    style={{ color: DARK.textSecondary, fontSize: 12 }}
                                >
                                    Jamais
                                </Text>
                            );
                        }
                        return <DateField value={value} format="DD/MM/YYYY HH:mm" />;
                    }}
                />

                <Table.Column<DbAgencyInvitation>
                    title="Créé le"
                    dataIndex="created_at"
                    key="created_at"
                    width={160}
                    render={(value: string) => (
                        <DateField value={value} format="DD/MM/YYYY HH:mm" />
                    )}
                />

                {/* Revoke action — only meaningful for codes that haven't
                    been claimed yet. Once used_at is set, the FK on
                    profiles.used_by makes deletion noisy and there's no
                    reason to revoke a code already consumed. */}
                <Table.Column<DbAgencyInvitation>
                    title="Actions"
                    key="actions"
                    width={130}
                    fixed="right"
                    render={(_, record) => {
                        if (record.used_at) {
                            return (
                                <Tooltip title="Code déjà utilisé, impossible de le révoquer.">
                                    <Button type="text" size="small" disabled>
                                        Verrouillé
                                    </Button>
                                </Tooltip>
                            );
                        }
                        return (
                            <DeleteButton
                                hideText
                                size="small"
                                resource="agency_invitations"
                                recordItemId={record.id}
                                confirmTitle="Révoquer ce code ?"
                                confirmOkText="Révoquer"
                                confirmCancelText="Annuler"
                                successNotification={() => ({
                                    type: "success",
                                    message: "Code révoqué",
                                    description: "Il ne pourra plus être utilisé.",
                                })}
                            />
                        );
                    }}
                />
            </Table>
        </List>
    );
}
