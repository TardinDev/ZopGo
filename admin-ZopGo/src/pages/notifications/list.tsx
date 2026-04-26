/**
 * ZopGo Admin — Liste des notifications push (in-app)
 */

import { List, useTable, FilterDropdown } from "@refinedev/antd";
import { Table, Space, Select, Tag, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DARK, USER_ROLE_LABELS } from "@/config/constants";
import type { DbNotification } from "@/types";

const { Text, Paragraph } = Typography;

export function NotificationList() {
    const { tableProps } = useTable<DbNotification>({
        resource: "notifications",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        pagination: { pageSize: 25 },
    });

    return (
        <List title="Notifications push">
            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 900 }}>
                <Table.Column<DbNotification>
                    title="Notification"
                    width={400}
                    render={(_, r) => (
                        <Space>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: r.icon_bg || "rgba(33, 98, 254, 0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <BellOutlined style={{ color: r.icon_color || "#2162FE", fontSize: 16 }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: DARK.textPrimary }}>
                                    {r.title}
                                </div>
                                <Paragraph
                                    ellipsis={{ rows: 1 }}
                                    style={{ margin: 0, fontSize: 12, color: DARK.textSecondary }}
                                >
                                    {r.message}
                                </Paragraph>
                            </div>
                        </Space>
                    )}
                />

                <Table.Column<DbNotification>
                    title="Type"
                    dataIndex="type"
                    width={140}
                    render={(t) => (
                        <Tag style={{ borderRadius: 6 }}>
                            <Text style={{ fontSize: 11 }}>{t}</Text>
                        </Tag>
                    )}
                />

                <Table.Column<DbNotification>
                    title="Cible"
                    width={140}
                    render={(_, r) => {
                        if (r.recipient_role === "all") return <Tag color="purple">Tous</Tag>;
                        if (r.recipient_role) return <Tag color="blue">{USER_ROLE_LABELS[r.recipient_role] ?? r.recipient_role}</Tag>;
                        if (r.recipient_id) return <Tag color="cyan">User précis</Tag>;
                        return <Tag>—</Tag>;
                    }}
                />

                <Table.Column<DbNotification>
                    title="Lu"
                    dataIndex="read"
                    width={70}
                    align="center"
                    filterDropdown={(p) => (
                        <FilterDropdown {...p}>
                            <Select
                                placeholder="Statut"
                                style={{ width: 140 }}
                                allowClear
                                options={[
                                    { value: true, label: "Lu" },
                                    { value: false, label: "Non lu" },
                                ]}
                            />
                        </FilterDropdown>
                    )}
                    render={(read: boolean) => (
                        <Tag color={read ? "green" : "orange"}>
                            {read ? "Lu" : "Non lu"}
                        </Tag>
                    )}
                />

                <Table.Column<DbNotification>
                    title="Envoyée le"
                    dataIndex="created_at"
                    width={150}
                    sorter
                    render={(d) => dayjs(d).format("DD/MM/YY HH:mm")}
                />
            </Table>
        </List>
    );
}
