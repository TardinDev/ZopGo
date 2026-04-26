/**
 * ZopGo Admin — Modération des messages directs entre utilisateurs
 */

import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Typography, Avatar } from "antd";
import dayjs from "dayjs";
import { DARK } from "@/config/constants";
import type { DbDirectMessage } from "@/types";

const { Text, Paragraph } = Typography;

export function DirectMessageList() {
    const { tableProps } = useTable<DbDirectMessage>({
        resource: "direct_messages",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        meta: {
            select: "*, sender:sender_id(id, name, avatar), receiver:receiver_id(id, name, avatar)",
        },
        pagination: { pageSize: 20 },
    });

    return (
        <List title="Messages utilisateurs (modération)">
            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 900 }}>
                <Table.Column<DbDirectMessage>
                    title="Émetteur"
                    width={200}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={28} src={r.sender?.avatar}>
                                {r.sender?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.sender?.name ?? "—"}</Text>
                        </Space>
                    )}
                />

                <Table.Column<DbDirectMessage>
                    title="Destinataire"
                    width={200}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={28} src={r.receiver?.avatar}>
                                {r.receiver?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.receiver?.name ?? "—"}</Text>
                        </Space>
                    )}
                />

                <Table.Column<DbDirectMessage>
                    title="Message"
                    dataIndex="content"
                    render={(c: string) => (
                        <Paragraph
                            ellipsis={{ rows: 2, expandable: true, symbol: "voir" }}
                            style={{ margin: 0, fontSize: 13, color: DARK.textPrimary }}
                        >
                            {c}
                        </Paragraph>
                    )}
                />

                <Table.Column<DbDirectMessage>
                    title="Lu"
                    dataIndex="read"
                    width={70}
                    align="center"
                    render={(read: boolean) => (
                        <Tag color={read ? "green" : "default"}>
                            {read ? "Oui" : "Non"}
                        </Tag>
                    )}
                />

                <Table.Column<DbDirectMessage>
                    title="Envoyé le"
                    dataIndex="created_at"
                    width={150}
                    sorter
                    render={(d) => dayjs(d).format("DD/MM/YY HH:mm")}
                />
            </Table>
        </List>
    );
}
