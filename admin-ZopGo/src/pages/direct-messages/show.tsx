/**
 * ZopGo Admin — Détail / modération d'un message direct
 *
 * Beyond reading the flagged message, the admin can:
 *   - Masquer / réafficher n'importe quel message du fil (soft-delete via
 *     deleted_at + hidden_by_admin — réversible, filtré par RLS côté
 *     mobile pour les deux participants).
 *   - Avertir l'émetteur (réutilise admin_messages : message 1:1).
 *   - Suspendre / restaurer l'émetteur (soft-delete profil, comme la fiche
 *     utilisateur).
 *
 * Le fil complet (les deux sens) est reconstruit pour donner le contexte
 * de modération ; l'admin voit aussi les messages déjà masqués.
 */

import { Show } from "@refinedev/antd";
import {
    Card,
    Space,
    Avatar,
    Typography,
    Tag,
    Empty,
    Button,
    Popconfirm,
    message as antdMessage,
} from "antd";
import {
    UserOutlined,
    MessageOutlined,
    StopOutlined,
    CheckCircleOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { useShow, useList, useUpdate, useGo } from "@refinedev/core";
import dayjs from "dayjs";
import { DARK } from "@/config/constants";
import { hideMessagePayload, suspendProfilePayload } from "./moderation";
import type { DbDirectMessage } from "@/types";

const { Text } = Typography;

export function DirectMessageShow() {
    const { queryResult } = useShow<DbDirectMessage>({
        resource: "direct_messages",
        meta: {
            select:
                "*, sender:sender_id(id, name, avatar, deleted_at), receiver:receiver_id(id, name, avatar, deleted_at)",
        },
    });
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const go = useGo();
    const { mutate: update } = useUpdate();

    // Rebuild the whole conversation between the two participants. Both
    // filters use `in [sender, receiver]` so we catch messages in either
    // direction. Ordered chronologically (oldest first) like a chat. The
    // admin RLS lets us see hidden messages too.
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
    const senderSuspended = !!record?.sender?.deleted_at;

    const handleHideToggle = (msg: DbDirectMessage) => {
        const hide = !msg.deleted_at;
        update(
            {
                resource: "direct_messages",
                id: msg.id,
                values: hideMessagePayload(hide, new Date().toISOString()),
            },
            {
                onSuccess: () =>
                    antdMessage.success(hide ? "Message masqué" : "Message réaffiché"),
            }
        );
    };

    const handleSuspendSender = () => {
        if (!record) return;
        update(
            {
                resource: "profiles",
                id: record.sender_id,
                values: suspendProfilePayload(
                    !senderSuspended,
                    new Date().toISOString()
                ),
            },
            {
                onSuccess: () =>
                    antdMessage.success(
                        senderSuspended ? "Émetteur restauré" : "Émetteur suspendu"
                    ),
            }
        );
    };

    const handleWarnSender = () => {
        if (!record) return;
        go({
            to: "/admin-messages/create",
            query: { target_user_id: record.sender_id },
            type: "push",
        });
    };

    return (
        <Show
            isLoading={isLoading}
            title="Conversation (modération)"
            headerButtons={
                <Space>
                    <Button
                        type="primary"
                        icon={<MessageOutlined />}
                        onClick={handleWarnSender}
                    >
                        Avertir l'émetteur
                    </Button>
                    <Popconfirm
                        title={
                            senderSuspended
                                ? "Restaurer l'émetteur ?"
                                : "Suspendre l'émetteur ?"
                        }
                        onConfirm={handleSuspendSender}
                    >
                        <Button
                            danger={!senderSuspended}
                            icon={
                                senderSuspended ? (
                                    <CheckCircleOutlined />
                                ) : (
                                    <StopOutlined />
                                )
                            }
                        >
                            {senderSuspended ? "Restaurer l'émetteur" : "Suspendre l'émetteur"}
                        </Button>
                    </Popconfirm>
                </Space>
            }
        >
            {record && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Space size="large" align="center" wrap>
                            <Space>
                                <Avatar
                                    size={36}
                                    src={record.sender?.avatar}
                                    icon={<UserOutlined />}
                                />
                                <Text style={{ fontWeight: 600 }}>
                                    {record.sender?.name ?? "—"}
                                </Text>
                                {senderSuspended && <Tag color="red">Suspendu</Tag>}
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
                                    const isHidden = !!msg.deleted_at;
                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                padding: 12,
                                                borderRadius: 10,
                                                opacity: isHidden ? 0.55 : 1,
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
                                                align="start"
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
                                                    {isHidden && (
                                                        <Tag color="red" style={{ margin: 0 }}>
                                                            Masqué
                                                        </Tag>
                                                    )}
                                                </Space>
                                                <Space size={8}>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            color: DARK.textSecondary,
                                                        }}
                                                    >
                                                        {dayjs(msg.created_at).format("DD/MM/YY HH:mm")}
                                                    </Text>
                                                    <Button
                                                        size="small"
                                                        type="text"
                                                        danger={!isHidden}
                                                        icon={
                                                            isHidden ? (
                                                                <EyeOutlined />
                                                            ) : (
                                                                <EyeInvisibleOutlined />
                                                            )
                                                        }
                                                        onClick={() => handleHideToggle(msg)}
                                                    >
                                                        {isHidden ? "Réafficher" : "Masquer"}
                                                    </Button>
                                                </Space>
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
