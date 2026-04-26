/**
 * ZopGo Admin — Liste des annonces broadcast (admin_messages)
 */

import { List, useTable, ShowButton, CreateButton, DateField } from "@refinedev/antd";
import { Table, Tag, Typography, Space, Tooltip } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import {
    ADMIN_MESSAGE_TARGET_LABELS,
    USER_ROLE_LABELS,
    DARK,
} from "@/config/constants";
import type { DbAdminMessage } from "@/types";

const { Text } = Typography;

export function AdminMessageList() {
    const { tableProps } = useTable<DbAdminMessage>({
        resource: "admin_messages",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
    });

    return (
        <List
            title="Annonces (broadcast)"
            headerButtons={<CreateButton>Nouvelle annonce</CreateButton>}
        >
            <Table
                {...tableProps}
                rowKey="id"
                size="middle"
                scroll={{ x: 900 }}
            >
                <Table.Column<DbAdminMessage>
                    title="Annonce"
                    dataIndex="title"
                    key="title"
                    width={320}
                    render={(title, record) => (
                        <div>
                            <div
                                style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: DARK.textPrimary,
                                    marginBottom: 2,
                                }}
                            >
                                {title}
                            </div>
                            <Text
                                style={{ color: DARK.textSecondary, fontSize: 12 }}
                                ellipsis={{ tooltip: record.body }}
                            >
                                {record.body}
                            </Text>
                        </div>
                    )}
                />

                <Table.Column<DbAdminMessage>
                    title="Cible"
                    dataIndex="target_type"
                    key="target_type"
                    width={220}
                    render={(targetType: DbAdminMessage["target_type"], record) => {
                        if (targetType === "all") {
                            return <Tag color="purple">Tous les utilisateurs</Tag>;
                        }
                        if (targetType === "role") {
                            return (
                                <Tag color="blue">
                                    Rôle : {USER_ROLE_LABELS[record.target_role ?? ""] ?? record.target_role}
                                </Tag>
                            );
                        }
                        return (
                            <Tag color="cyan">
                                Utilisateur précis
                            </Tag>
                        );
                    }}
                />

                <Table.Column<DbAdminMessage>
                    title="Émetteur"
                    dataIndex="sender_name"
                    key="sender_name"
                    width={160}
                    render={(name) => (
                        <Text style={{ color: DARK.textSecondary }}>{name}</Text>
                    )}
                />

                <Table.Column<DbAdminMessage>
                    title="Push"
                    dataIndex="push_sent"
                    key="push_sent"
                    width={90}
                    align="center"
                    render={(sent: boolean) =>
                        sent ? (
                            <Tooltip title="Push envoyée">
                                <CheckCircleOutlined
                                    style={{ color: DARK.success, fontSize: 16 }}
                                />
                            </Tooltip>
                        ) : (
                            <Tooltip title="Push non envoyée">
                                <ClockCircleOutlined
                                    style={{ color: DARK.textMuted, fontSize: 16 }}
                                />
                            </Tooltip>
                        )
                    }
                />

                <Table.Column<DbAdminMessage>
                    title="Envoyée le"
                    dataIndex="created_at"
                    key="created_at"
                    width={150}
                    sorter
                    render={(date) => <DateField value={date} format="DD/MM/YYYY HH:mm" />}
                />

                <Table.Column<DbAdminMessage>
                    title="Actions"
                    key="actions"
                    width={90}
                    fixed="right"
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}
