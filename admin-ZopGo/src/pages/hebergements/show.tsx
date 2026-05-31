/**
 * ZopGo Admin — Détail d'un hébergement
 *
 * Photo gallery + full listing info, the hébergeur with a profile
 * shortcut, and the reservations placed on this listing. The header
 * carries an Edit shortcut so an admin can correct or deactivate a
 * mis-listed property.
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
    Image,
} from "antd";
import { HomeOutlined, UserOutlined, EditOutlined } from "@ant-design/icons";
import { useShow, useList, useNavigation, useGo } from "@refinedev/core";
import dayjs from "dayjs";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import {
    HEBERGEMENT_TYPE_LABELS,
    HEBERGEMENT_STATUS_LABELS,
    RESERVATION_STATUS_LABELS,
    DARK,
} from "@/config/constants";
import type { DbHebergement, DbHebergementReservation } from "@/types";

const { Title, Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
    hotel: "purple",
    auberge: "geekblue",
    appartement: "blue",
    maison: "cyan",
    chambre: "default",
};

const RESA_STATUS_COLORS: Record<string, string> = {
    en_attente: "orange",
    acceptee: "green",
    refusee: "red",
    annulee: "default",
};

export function HebergementShow() {
    const { queryResult } = useShow<DbHebergement>({
        resource: "hebergements",
        meta: { select: "*, hebergeur:hebergeur_id(id, name, avatar)" },
    });
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const { edit } = useNavigation();
    const go = useGo();

    const { data: reservationsData } = useList<DbHebergementReservation>({
        resource: "hebergement_reservations",
        filters: record
            ? [{ field: "hebergement_id", operator: "eq", value: record.id }]
            : [],
        sorters: [{ field: "created_at", order: "desc" }],
        pagination: { pageSize: 50 },
        meta: { select: "*, client:client_id(id, name, avatar)" },
        queryOptions: { enabled: !!record },
    });

    return (
        <Show
            isLoading={isLoading}
            title="Détail hébergement"
            headerButtons={
                <Button
                    icon={<EditOutlined />}
                    onClick={() => record && edit("hebergements", record.id)}
                >
                    Modifier
                </Button>
            }
        >
            {record && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        {record.images && record.images.length > 0 ? (
                            <Image.PreviewGroup>
                                <Space wrap size={8}>
                                    {record.images.map((src, i) => (
                                        <Image
                                            key={i}
                                            src={src}
                                            width={120}
                                            height={90}
                                            style={{ borderRadius: 10, objectFit: "cover" }}
                                        />
                                    ))}
                                </Space>
                            </Image.PreviewGroup>
                        ) : (
                            <div
                                style={{
                                    width: 120,
                                    height: 90,
                                    borderRadius: 10,
                                    background: "rgba(139, 92, 246, 0.16)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <HomeOutlined style={{ color: "#8B5CF6", fontSize: 24 }} />
                            </div>
                        )}

                        <Space size={12} align="center" style={{ marginTop: 16 }}>
                            <Title level={4} style={{ margin: 0 }}>
                                {record.nom}
                            </Title>
                            <Tag color={TYPE_COLORS[record.type] ?? "default"}>
                                {HEBERGEMENT_TYPE_LABELS[record.type] ?? record.type}
                            </Tag>
                            <Tag color={record.status === "actif" ? "green" : "default"}>
                                {HEBERGEMENT_STATUS_LABELS[record.status] ?? record.status}
                            </Tag>
                        </Space>

                        <Descriptions
                            column={{ xs: 1, sm: 2, md: 3 }}
                            style={{ marginTop: 16 }}
                            size="small"
                            bordered
                        >
                            <Descriptions.Item label="Ville">{record.ville}</Descriptions.Item>
                            <Descriptions.Item label="Adresse">
                                {record.adresse || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Prix / nuit">
                                <PriceDisplay amount={record.prix_par_nuit} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Capacité">
                                {record.capacite}
                            </Descriptions.Item>
                            <Descriptions.Item label="Disponibilité">
                                <Tag color={record.disponibilite > 0 ? "green" : "default"}>
                                    {record.disponibilite > 0
                                        ? `${record.disponibilite} dispo`
                                        : "Complet"}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Créé le">
                                {dayjs(record.created_at).format("DD/MM/YYYY")}
                            </Descriptions.Item>
                            <Descriptions.Item label="Description" span={3}>
                                {record.description || "—"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card bordered={false} style={{ borderRadius: 12 }} title="Hébergeur">
                        <Space
                            style={{ width: "100%", justifyContent: "space-between" }}
                            align="center"
                        >
                            <Space>
                                <Avatar
                                    size={40}
                                    src={record.hebergeur?.avatar}
                                    icon={<UserOutlined />}
                                />
                                <Text style={{ fontWeight: 600 }}>
                                    {record.hebergeur?.name ?? "—"}
                                </Text>
                            </Space>
                            <Button
                                icon={<UserOutlined />}
                                onClick={() =>
                                    go({
                                        to: `/users/show/${record.hebergeur_id}`,
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
                        title={`Réservations (${reservationsData?.total ?? 0})`}
                    >
                        <Table
                            dataSource={reservationsData?.data ?? []}
                            rowKey="id"
                            size="small"
                            pagination={false}
                        >
                            <Table.Column<DbHebergementReservation>
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
                                title="Nuits"
                                dataIndex="nombre_nuits"
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
                                    <Tag color={RESA_STATUS_COLORS[s] ?? "default"}>
                                        {RESERVATION_STATUS_LABELS[s] ?? s}
                                    </Tag>
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
