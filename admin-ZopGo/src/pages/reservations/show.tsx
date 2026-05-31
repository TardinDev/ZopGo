/**
 * ZopGo Admin — Détail d'une réservation de trajet
 *
 * Cross-links the trajet, the client, and the transporteur (chauffeur or
 * agence) so an admin can resolve a dispute by jumping to any of the three
 * related records from one screen.
 */

import { Show } from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Space,
    Avatar,
    Tag,
    Typography,
    Button,
} from "antd";
import {
    UserOutlined,
    GlobalOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import { useShow, useGo } from "@refinedev/core";
import dayjs from "dayjs";
import { StatusTag } from "@/components/common/StatusTag";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { resolveIdentity } from "@/lib/identity";
import { DARK } from "@/config/constants";
import type { DbReservation } from "@/types";

const { Title, Text } = Typography;

export function ReservationShow() {
    const { queryResult } = useShow<DbReservation>({
        resource: "reservations",
        meta: {
            select:
                "*, trajet:trajet_id(id, ville_depart, ville_arrivee, vehicule), client:client_id(id, name, avatar), chauffeur:chauffeur_id(id, name, avatar, role, agency_name, agency_logo_url)",
        },
    });
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const go = useGo();

    const transporteur = resolveIdentity(record?.chauffeur);

    return (
        <Show isLoading={isLoading} title="Détail réservation">
            {record && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Space size={16} align="start">
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 10,
                                    background: DARK.accentLight,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <CalendarOutlined style={{ color: DARK.accent, fontSize: 20 }} />
                            </div>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    {record.trajet?.ville_depart ?? "—"} →{" "}
                                    {record.trajet?.ville_arrivee ?? "—"}
                                </Title>
                                <StatusTag status={record.status} type="reservation" />
                            </div>
                        </Space>

                        <Descriptions
                            column={{ xs: 1, sm: 2, md: 3 }}
                            style={{ marginTop: 24 }}
                            size="small"
                            bordered
                        >
                            <Descriptions.Item label="Places réservées">
                                {record.nombre_places}
                            </Descriptions.Item>
                            <Descriptions.Item label="Prix total">
                                <PriceDisplay amount={record.prix_total} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Véhicule">
                                {record.trajet?.vehicule ?? "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Réservée le">
                                {dayjs(record.created_at).format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                        </Descriptions>

                        {record.trajet && (
                            <Button
                                icon={<GlobalOutlined />}
                                style={{ marginTop: 16 }}
                                onClick={() =>
                                    go({
                                        to: `/trajets/show/${record.trajet!.id}`,
                                        type: "push",
                                    })
                                }
                            >
                                Voir le trajet
                            </Button>
                        )}
                    </Card>

                    <Card bordered={false} style={{ borderRadius: 12 }} title="Client">
                        <Space
                            style={{ width: "100%", justifyContent: "space-between" }}
                            align="center"
                        >
                            <Space>
                                <Avatar
                                    size={40}
                                    src={record.client?.avatar}
                                    icon={<UserOutlined />}
                                />
                                <Text style={{ fontWeight: 600 }}>
                                    {record.client?.name ?? "—"}
                                </Text>
                            </Space>
                            <Button
                                icon={<UserOutlined />}
                                onClick={() =>
                                    go({
                                        to: `/users/show/${record.client_id}`,
                                        type: "push",
                                    })
                                }
                            >
                                Voir le profil
                            </Button>
                        </Space>
                    </Card>

                    <Card
                        bordered={false}
                        style={{ borderRadius: 12 }}
                        title="Transporteur"
                    >
                        <Space
                            style={{ width: "100%", justifyContent: "space-between" }}
                            align="center"
                        >
                            <Space>
                                <Avatar
                                    size={40}
                                    src={transporteur.avatar}
                                    shape={transporteur.isAgence ? "square" : "circle"}
                                    icon={<UserOutlined />}
                                    style={
                                        transporteur.isAgence ? { borderRadius: 8 } : undefined
                                    }
                                />
                                <Space direction="vertical" size={2}>
                                    <Text style={{ fontWeight: 600 }}>{transporteur.name}</Text>
                                    {transporteur.isAgence && (
                                        <Tag color="cyan" style={{ margin: 0 }}>
                                            AGENCE
                                        </Tag>
                                    )}
                                </Space>
                            </Space>
                            <Button
                                icon={<UserOutlined />}
                                onClick={() =>
                                    go({
                                        to: `/users/show/${record.chauffeur_id}`,
                                        type: "push",
                                    })
                                }
                            >
                                Voir le profil
                            </Button>
                        </Space>
                    </Card>
                </Space>
            )}
        </Show>
    );
}
