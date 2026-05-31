/**
 * ZopGo Admin — Détail d'une livraison
 *
 * Shows the pickup/dropoff, the client + livreur, the price, and a
 * chronological lifecycle timeline built from the row's timestamp columns
 * (created → accepted → picked up → delivered / cancelled).
 */

import { Show } from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Space,
    Avatar,
    Tag,
    Typography,
    Timeline,
    Button,
} from "antd";
import { ShoppingOutlined, UserOutlined } from "@ant-design/icons";
import { useShow, useGo } from "@refinedev/core";
import dayjs from "dayjs";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { LIVRAISON_STATUS_LABELS, DARK } from "@/config/constants";
import { buildLivraisonTimeline } from "./timeline";
import type { DbLivraison } from "@/types";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
    en_attente: "orange",
    acceptee: "blue",
    refusee: "red",
    en_cours: "processing",
    livree: "green",
    annulee: "red",
    expiree: "default",
};

const TIMELINE_DOT_COLORS: Record<string, string> = {
    blue: DARK.accent,
    green: "#52c41a",
    red: "#ff4d4f",
    gray: "#8c8c8c",
};

export function LivraisonShow() {
    const { queryResult } = useShow<DbLivraison>({
        resource: "livraisons",
        meta: {
            select:
                "*, client:client_id(id, name, avatar), livreur:livreur_id(id, name, avatar)",
        },
    });
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const go = useGo();

    const timeline = record ? buildLivraisonTimeline(record) : [];

    const renderParty = (
        label: string,
        party: DbLivraison["client"],
        partyId: string | undefined
    ) => (
        <Card bordered={false} style={{ borderRadius: 12 }} title={label}>
            <Space
                style={{ width: "100%", justifyContent: "space-between" }}
                align="center"
            >
                <Space>
                    <Avatar size={40} src={party?.avatar} icon={<UserOutlined />} />
                    <Text style={{ fontWeight: 600 }}>{party?.name ?? "—"}</Text>
                </Space>
                {partyId && (
                    <Button
                        icon={<UserOutlined />}
                        onClick={() =>
                            go({ to: `/users/show/${partyId}`, type: "push" })
                        }
                    >
                        Voir le profil
                    </Button>
                )}
            </Space>
        </Card>
    );

    return (
        <Show isLoading={isLoading} title="Détail livraison">
            {record && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Space size={16} align="start">
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 10,
                                    background: "rgba(245, 158, 11, 0.16)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <ShoppingOutlined style={{ color: "#F59E0B", fontSize: 20 }} />
                            </div>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    {record.pickup_location} → {record.dropoff_location}
                                </Title>
                                <Tag
                                    color={STATUS_COLORS[record.status] ?? "default"}
                                    style={{ marginTop: 6 }}
                                >
                                    {LIVRAISON_STATUS_LABELS[record.status] ?? record.status}
                                </Tag>
                            </div>
                        </Space>

                        <Descriptions
                            column={{ xs: 1, sm: 2 }}
                            style={{ marginTop: 24 }}
                            size="small"
                            bordered
                        >
                            <Descriptions.Item label="Prix estimé">
                                <PriceDisplay amount={record.prix_estime} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Créée le">
                                {dayjs(record.created_at).format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                            <Descriptions.Item label="Description" span={2}>
                                {record.description || "—"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {renderParty("Client", record.client, record.client_id)}
                    {renderParty("Livreur", record.livreur, record.livreur_id)}

                    <Card
                        bordered={false}
                        style={{ borderRadius: 12 }}
                        title="Historique"
                    >
                        <Timeline
                            items={timeline.map((step) => ({
                                color: TIMELINE_DOT_COLORS[step.color] ?? DARK.accent,
                                children: (
                                    <Space direction="vertical" size={0}>
                                        <Text style={{ fontWeight: 600 }}>{step.label}</Text>
                                        <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                            {dayjs(step.at).format("DD/MM/YYYY HH:mm")}
                                        </Text>
                                    </Space>
                                ),
                            }))}
                        />
                    </Card>
                </Space>
            )}
        </Show>
    );
}
