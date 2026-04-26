/**
 * ZopGo Admin — Détail d'une annonce broadcast (admin_messages)
 * Affiche le contenu + qui a lu (admin_message_reads)
 */

import { Show, DateField } from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Tag,
    Typography,
    Space,
    Table,
    Empty,
} from "antd";
import {
    NotificationOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { useShow, useList } from "@refinedev/core";
import dayjs from "dayjs";
import {
    USER_ROLE_LABELS,
    ADMIN_MESSAGE_TARGET_LABELS,
    DARK,
} from "@/config/constants";
import type {
    DbAdminMessage,
    DbAdminMessageRead,
    DbProfile,
} from "@/types";

const { Title, Paragraph, Text } = Typography;

interface AdminMessageReadWithUser extends DbAdminMessageRead {
    user?: DbProfile;
}

export function AdminMessageShow() {
    const { queryResult } = useShow<DbAdminMessage>({
        resource: "admin_messages",
    });
    const { data, isLoading } = queryResult;
    const record = data?.data;

    // Liste des reads pour ce message (avec join sur profiles)
    const { data: readsData } = useList<AdminMessageReadWithUser>({
        resource: "admin_message_reads",
        filters: record
            ? [{ field: "message_id", operator: "eq", value: record.id }]
            : [],
        sorters: [{ field: "read_at", order: "desc" }],
        pagination: { pageSize: 50 },
        meta: { select: "*, user:profiles!admin_message_reads_user_id_fkey(*)" },
        queryOptions: { enabled: !!record },
    });

    const renderTarget = () => {
        if (!record) return null;
        if (record.target_type === "all") {
            return <Tag color="purple">Tous les utilisateurs</Tag>;
        }
        if (record.target_type === "role") {
            return (
                <Tag color="blue">
                    Rôle : {USER_ROLE_LABELS[record.target_role ?? ""] ?? record.target_role}
                </Tag>
            );
        }
        return <Tag color="cyan">Utilisateur précis</Tag>;
    };

    const reads = (readsData?.data ?? []) as AdminMessageReadWithUser[];

    return (
        <Show isLoading={isLoading} title="Détail de l'annonce">
            {record && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Space size={16} align="start" style={{ marginBottom: 16 }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: DARK.accentLight,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <NotificationOutlined
                                    style={{ fontSize: 22, color: DARK.accent }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Title level={4} style={{ margin: 0 }}>
                                    {record.title}
                                </Title>
                                <Space size={8} style={{ marginTop: 6 }}>
                                    {renderTarget()}
                                    {record.push_sent ? (
                                        <Tag
                                            icon={<CheckCircleOutlined />}
                                            color="success"
                                        >
                                            Push envoyée
                                        </Tag>
                                    ) : (
                                        <Tag
                                            icon={<ClockCircleOutlined />}
                                            color="default"
                                        >
                                            Push en attente
                                        </Tag>
                                    )}
                                </Space>
                            </div>
                        </Space>

                        <Paragraph
                            style={{
                                background: DARK.cardBgHover,
                                padding: 16,
                                borderRadius: 8,
                                marginTop: 16,
                                color: DARK.textPrimary,
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {record.body}
                        </Paragraph>

                        <Descriptions
                            column={{ xs: 1, sm: 2 }}
                            size="small"
                            style={{ marginTop: 16 }}
                            bordered
                        >
                            <Descriptions.Item label="Émetteur">
                                {record.sender_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Envoyée le">
                                <DateField
                                    value={record.created_at}
                                    format="DD/MM/YYYY HH:mm"
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Type de cible">
                                {ADMIN_MESSAGE_TARGET_LABELS[record.target_type]}
                            </Descriptions.Item>
                            <Descriptions.Item label="Expire le">
                                {record.expires_at
                                    ? dayjs(record.expires_at).format("DD/MM/YYYY HH:mm")
                                    : "—"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card
                        bordered={false}
                        style={{ borderRadius: 12 }}
                        title={
                            <Space>
                                <Text strong>Lecteurs</Text>
                                <Tag>{reads.length}</Tag>
                            </Space>
                        }
                    >
                        {reads.length === 0 ? (
                            <Empty
                                description="Aucun utilisateur n'a encore lu cette annonce"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <Table
                                dataSource={reads}
                                rowKey={(row) => `${row.message_id}-${row.user_id}`}
                                size="small"
                                pagination={{ pageSize: 10 }}
                            >
                                <Table.Column<AdminMessageReadWithUser>
                                    title="Utilisateur"
                                    key="user"
                                    render={(_, row) => (
                                        <div>
                                            <Text strong>
                                                {row.user?.name ?? row.user_id}
                                            </Text>
                                            {row.user?.email && (
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: DARK.textSecondary,
                                                    }}
                                                >
                                                    {row.user.email}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                                <Table.Column<AdminMessageReadWithUser>
                                    title="Rôle"
                                    key="role"
                                    render={(_, row) =>
                                        row.user?.role ? (
                                            <Tag>
                                                {USER_ROLE_LABELS[row.user.role] ?? row.user.role}
                                            </Tag>
                                        ) : (
                                            "—"
                                        )
                                    }
                                />
                                <Table.Column<AdminMessageReadWithUser>
                                    title="Lu le"
                                    dataIndex="read_at"
                                    render={(date: string) => (
                                        <DateField
                                            value={date}
                                            format="DD/MM/YYYY HH:mm"
                                        />
                                    )}
                                />
                            </Table>
                        )}
                    </Card>
                </Space>
            )}
        </Show>
    );
}
