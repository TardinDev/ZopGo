/**
 * ZopGo Admin — Détail d'un trajet inter-villes
 *
 * Surfaces the trajet itself, the publisher (chauffeur or agence) with a
 * shortcut to their profile, and the reservations placed on this trajet
 * so the admin can audit a route end-to-end.
 */

import { Show } from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Space,
    Avatar,
    Tag,
    Typography,
    Table,
    Button,
} from "antd";
import { GlobalOutlined, UserOutlined } from "@ant-design/icons";
import { useShow, useList, useGo } from "@refinedev/core";
import dayjs from "dayjs";
import { StatusTag } from "@/components/common/StatusTag";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { resolveIdentity } from "@/lib/identity";
import { DARK } from "@/config/constants";
import type { DbTrajet, DbReservation } from "@/types";

const { Title, Text } = Typography;

export function TrajetShow() {
    const { queryResult } = useShow<DbTrajet>({
        resource: "trajets",
        meta: {
            select:
                "*, chauffeur:chauffeur_id(id, name, avatar, role, agency_name, agency_logo_url)",
        },
    });
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const go = useGo();

    const { data: reservationsData } = useList<DbReservation>({
        resource: "reservations",
        filters: record
            ? [{ field: "trajet_id", operator: "eq", value: record.id }]
            : [],
        sorters: [{ field: "created_at", order: "desc" }],
        pagination: { pageSize: 50 },
        meta: { select: "*, client:client_id(id, name, avatar)" },
        queryOptions: { enabled: !!record },
    });

    const publisher = resolveIdentity(record?.chauffeur);

    return (
        <Show isLoading={isLoading} title="Détail trajet">
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
                                <GlobalOutlined style={{ color: DARK.accent, fontSize: 20 }} />
                            </div>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    {record.ville_depart} → {record.ville_arrivee}
                                </Title>
                                <Space size={8} style={{ marginTop: 4 }}>
                                    <Tag color="blue">{record.vehicule}</Tag>
                                    <StatusTag status={record.status} type="trajet" />
                                </Space>
                            </div>
                        </Space>

                        <Descriptions
                            column={{ xs: 1, sm: 2, md: 3 }}
                            style={{ marginTop: 24 }}
                            size="small"
                            bordered
                        >
                            <Descriptions.Item label="Prix">
                                <PriceDisplay amount={record.prix} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Places disponibles">
                                {record.places_disponibles}
                            </Descriptions.Item>
                            <Descriptions.Item label="Date de départ">
                                {record.date
                                    ? dayjs(record.date).format("DD/MM/YYYY HH:mm")
                                    : "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Créé le">
                                {dayjs(record.created_at).format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Publisher */}
                    <Card
                        bordered={false}
                        style={{ borderRadius: 12 }}
                        title="Publié par"
                    >
                        <Space
                            style={{ width: "100%", justifyContent: "space-between" }}
                            align="center"
                        >
                            <Space>
                                <Avatar
                                    size={44}
                                    src={publisher.avatar}
                                    shape={publisher.isAgence ? "square" : "circle"}
                                    icon={<UserOutlined />}
                                    style={publisher.isAgence ? { borderRadius: 8 } : undefined}
                                />
                                <Space direction="vertical" size={2}>
                                    <Text style={{ fontWeight: 600 }}>{publisher.name}</Text>
                                    {publisher.isAgence && (
                                        <Tag color="cyan" style={{ margin: 0 }}>
                                            AGENCE
                                        </Tag>
                                    )}
                                </Space>
                            </Space>
                            {record.chauffeur && (
                                <Button
                                    icon={<UserOutlined />}
                                    onClick={() =>
                                        go({
                                            to: `/users/show/${record.chauffeur!.id}`,
                                            type: "push",
                                        })
                                    }
                                >
                                    Voir le profil
                                </Button>
                            )}
                        </Space>
                    </Card>

                    {/* Reservations on this trajet */}
                    <Card
                        bordered={false}
                        style={{ borderRadius: 12 }}
                        title={`Réservations (${reservationsData?.total ?? 0})`}
                    >
                        <Table
                            dataSource={reservationsData?.data ?? []}
                            rowKey="id"
                            size="small"
                            pagination={false}
                        >
                            <Table.Column<DbReservation>
                                title="Client"
                                render={(_, r) => (
                                    <Space>
                                        <Avatar size={26} src={r.client?.avatar}>
                                            {r.client?.name?.[0] ?? "?"}
                                        </Avatar>
                                        <Text>{r.client?.name ?? "—"}</Text>
                                    </Space>
                                )}
                            />
                            <Table.Column
                                title="Places"
                                dataIndex="nombre_places"
                                align="center"
                            />
                            <Table.Column
                                title="Total"
                                dataIndex="prix_total"
                                render={(p: number) => <PriceDisplay amount={p} />}
                            />
                            <Table.Column
                                title="Statut"
                                dataIndex="status"
                                render={(s: string) => (
                                    <StatusTag status={s} type="reservation" />
                                )}
                            />
                            <Table.Column
                                title="Date"
                                dataIndex="created_at"
                                render={(d: string) => dayjs(d).format("DD/MM/YY HH:mm")}
                            />
                        </Table>
                    </Card>
                </Space>
            )}
        </Show>
    );
}
