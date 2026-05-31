/**
 * ZopGo Admin — Détail / modération d'un message direct
 *
 * Beyond the single flagged message, this rebuilds the full conversation
 * between the two users (both directions) so the admin has the context
 * needed to moderate — not just the isolated line. The flagged message is
 * highlighted within the thread.
 */

import { Show } from "@refinedev/antd";
import { Card, Space, Avatar, Typography, Tag, Empty } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useShow, useList } from "@refinedev/core";
import dayjs from "dayjs";
import { DARK } from "@/config/constants";
import type { DbDirectMessage } from "@/types";

const { Text } = Typography;

export function DirectMessageShow() {
    const { queryResult } = useShow<DbDirectMessage>({
        resource: "direct_messages",
        meta: {
            select:
                "*, sender:sender_id(id, name, avatar), receiver:receiver_id(id, name, avatar)",
        },
    });
    const { data, isLoading } = queryResult;
    const record = data?.data;

    // Rebuild the whole conversation between the two participants. Both
    // filters use `in [sender, receiver]` so we catch messages in either
    // direction. Ordered chronologically (oldest first) like a chat.
    const participants = record ? [record.sender_id, record.receiver_id] : [];
    const { data: threadData } = useList<DbDirectMessage>({
        resource: "direct_messages",
        filters: record
            ? [
                { field: "sender_id", operator: "in", value: participants },
                { field: "receiver_id", operator: "in", value: participants },
            ]
            : [],
        sorters: [{ field: "created_at", order: "asc" }],
        pagination: { pageSize: 200 },
        meta: {
            select:
                "*, sender:sender_id(id, name, avatar), receiver:receiver_id(id, name, avatar)",
        },
        queryOptions: { enabled: !!record },
    });

    const thread = threadData?.data ?? [];

    return (
        <Show isLoading={isLoading} title="Conversation (modération)">
            {record && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Space size="large" align="center">
                            <Space>
                                <Avatar
                                    size={36}
                                    src={record.sender?.avatar}
                                    icon={<UserOutlined />}
                                />
                                <Text style={{ fontWeight: 600 }}>
                                    {record.sender?.name ?? "—"}
                                </Text>
                            </Space>
                            <Text style={{ color: DARK.textSecondary }}>↔</Text>
                            <Space>
                                <Avatar
                                    size={36}
                                    src={record.receiver?.avatar}
                                    icon={<UserOutlined />}
                                />
                                <Text style={{ fontWeight: 600 }}>
                                    {record.receiver?.name ?? "—"}
                                </Text>
                            </Space>
                            <Tag>{thread.length} message(s)</Tag>
                        </Space>
                    </Card>

                    <Card
                        bordered={false}
                        style={{ borderRadius: 12 }}
                        title="Fil de discussion"
                    >
                        {thread.length === 0 ? (
                            <Empty description="Aucun message" />
                        ) : (
                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                {thread.map((msg) => {
                                    const isFlagged = msg.id === record.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                padding: 12,
                                                borderRadius: 10,
                                                background: isFlagged
                                                    ? "rgba(245, 158, 11, 0.12)"
                                                    : "rgba(255, 255, 255, 0.02)",
                                                border: isFlagged
                                                    ? "1px solid rgba(245, 158, 11, 0.4)"
                                                    : "1px solid rgba(255, 255, 255, 0.06)",
                                            }}
                                        >
                                            <Space
                                                style={{
                                                    width: "100%",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <Space>
                                                    <Avatar size={24} src={msg.sender?.avatar}>
                                                        {msg.sender?.name?.[0] ?? "?"}
                                                    </Avatar>
                                                    <Text style={{ fontSize: 13, fontWeight: 600 }}>
                                                        {msg.sender?.name ?? "—"}
                                                    </Text>
                                                    {isFlagged && (
                                                        <Tag color="orange" style={{ margin: 0 }}>
                                                            Message ciblé
                                                        </Tag>
                                                    )}
                                                </Space>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: DARK.textSecondary,
                                                    }}
                                                >
                                                    {dayjs(msg.created_at).format("DD/MM/YY HH:mm")}
                                                </Text>
                                            </Space>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 14,
                                                    color: DARK.textPrimary,
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                            </Space>
                        )}
                    </Card>
                </Space>
            )}
        </Show>
    );
}
