/**
 * ZopGo Admin — Détail utilisateur avec tabs
 */

import {
    Show,
    TagField,
} from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Rate,
    Space,
    Tabs,
    Table,
    Typography,
    Button,
    Popconfirm,
    Badge,
    message,
    Image as AntImage,
    Tag,
} from "antd";
import {
    EditOutlined,
    StopOutlined,
    CheckCircleOutlined,
    MessageOutlined,
} from "@ant-design/icons";
import { useShow, useNavigation, useUpdate, useList, useGo } from "@refinedev/core";
import dayjs from "dayjs";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusTag } from "@/components/common/StatusTag";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { USER_ROLE_LABELS, COLORS, DARK } from "@/config/constants";
import type {
    DbProfile,
    DbTrip,
    DbDelivery,
    DbVehicle,
    DbTrajet,
    DbReservation,
    DbHebergement,
} from "@/types";

const { Title, Text } = Typography;

export function UserShow() {
    const { queryResult } = useShow<DbProfile>({ resource: "profiles" });
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const { edit } = useNavigation();
    const { mutate: updateProfile } = useUpdate();
    const go = useGo();

    // Load related data
    const { data: tripsData } = useList<DbTrip>({
        resource: "trips",
        filters: record
            ? [
                {
                    field: record.role === "chauffeur" ? "driver_id" : "client_id",
                    operator: "eq",
                    value: record.id,
                },
            ]
            : [],
        sorters: [{ field: "created_at", order: "desc" }],
        pagination: { pageSize: 10 },
        queryOptions: { enabled: !!record },
    });

    const { data: deliveriesData } = useList<DbDelivery>({
        resource: "deliveries",
        filters: record
            ? [
                {
                    field: record.role === "chauffeur" ? "driver_id" : "client_id",
                    operator: "eq",
                    value: record.id,
                },
            ]
            : [],
        sorters: [{ field: "created_at", order: "desc" }],
        pagination: { pageSize: 10 },
        queryOptions: { enabled: !!record },
    });

    const { data: vehiclesData } = useList<DbVehicle>({
        resource: "vehicles",
        filters: record
            ? [{ field: "owner_id", operator: "eq", value: record.id }]
            : [],
        queryOptions: { enabled: !!record && record.role === "chauffeur" },
    });

    // Published trajets — relevant for both chauffeur and agence (an agence
    // publishes from the same form, just with a restricted vehicle set).
    const { data: trajetsData } = useList<DbTrajet>({
        resource: "trajets",
        filters: record
            ? [{ field: "chauffeur_id", operator: "eq", value: record.id }]
            : [],
        sorters: [{ field: "created_at", order: "desc" }],
        pagination: { pageSize: 20 },
        queryOptions: {
            enabled:
                !!record && (record.role === "chauffeur" || record.role === "agence"),
        },
    });

    // Reservations (modern table — migration 012). Same query for every role,
    // we just flip the filter field: clients filter by client_id (résas faites),
    // chauffeurs/agences by chauffeur_id (résas reçues).
    const reservationFilterField =
        record?.role === "client" ? "client_id" : "chauffeur_id";
    const { data: reservationsData } = useList<DbReservation>({
        resource: "reservations",
        filters: record
            ? [{ field: reservationFilterField, operator: "eq", value: record.id }]
            : [],
        sorters: [{ field: "created_at", order: "desc" }],
        pagination: { pageSize: 20 },
        meta: {
            select:
                "*, trajet:trajet_id(ville_depart, ville_arrivee, vehicule), client:client_id(name, avatar), chauffeur:chauffeur_id(name, avatar, role, agency_name)",
        },
        queryOptions: { enabled: !!record },
    });

    // Hebergements published by a hebergeur (migration 007).
    const { data: hebergementsData } = useList<DbHebergement>({
        resource: "hebergements",
        filters: record
            ? [{ field: "hebergeur_id", operator: "eq", value: record.id }]
            : [],
        sorters: [{ field: "created_at", order: "desc" }],
        pagination: { pageSize: 20 },
        queryOptions: { enabled: !!record && record.role === "hebergeur" },
    });

    const handleSuspend = () => {
        if (!record) return;
        updateProfile(
            {
                resource: "profiles",
                id: record.id,
                values: {
                    deleted_at: record.deleted_at ? null : new Date().toISOString(),
                },
            },
            {
                onSuccess: () => {
                    message.success(
                        record.deleted_at
                            ? "Utilisateur restauré"
                            : "Utilisateur suspendu"
                    );
                },
            }
        );
    };

    return (
        <Show
            isLoading={isLoading}
            title="Détail utilisateur"
            headerButtons={
                <Space>
                    <Button
                        type="primary"
                        icon={<MessageOutlined />}
                        onClick={() => {
                            if (!record) return;
                            // Routes to AdminMessageCreate with the target
                            // pre-filled so the admin can compose a 1-to-1
                            // message without re-selecting the user manually.
                            go({
                                to: "/admin-messages/create",
                                query: { target_user_id: record.id },
                                type: "push",
                            });
                        }}
                    >
                        Envoyer un message
                    </Button>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => record && edit("profiles", record.id)}
                    >
                        Modifier
                    </Button>
                    <Popconfirm
                        title={
                            record?.deleted_at
                                ? "Restaurer cet utilisateur ?"
                                : "Suspendre cet utilisateur ?"
                        }
                        onConfirm={handleSuspend}
                    >
                        <Button
                            danger={!record?.deleted_at}
                            icon={
                                record?.deleted_at ? (
                                    <CheckCircleOutlined />
                                ) : (
                                    <StopOutlined />
                                )
                            }
                        >
                            {record?.deleted_at ? "Restaurer" : "Suspendre"}
                        </Button>
                    </Popconfirm>
                </Space>
            }
        >
            {record && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    {/* Profile Card */}
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Space size={24} align="start">
                            <UserAvatar src={record.avatar} name={record.name} size={80} />
                            <div>
                                <Space align="center">
                                    <Title level={4} style={{ margin: 0 }}>
                                        {record.name}
                                    </Title>
                                    <TagField
                                        value={USER_ROLE_LABELS[record.role] ?? record.role}
                                        color={
                                            record.role === "agence"
                                                ? "cyan"
                                                : record.role === "hebergeur"
                                                ? "purple"
                                                : record.role === "chauffeur"
                                                ? "blue"
                                                : "default"
                                        }
                                    />
                                    {record.deleted_at && (
                                        <Badge
                                            count="Suspendu"
                                            style={{ backgroundColor: COLORS.error }}
                                        />
                                    )}
                                </Space>
                                <Rate
                                    disabled
                                    value={record.rating}
                                    allowHalf
                                    style={{ fontSize: 14, marginTop: 4 }}
                                />
                            </div>
                        </Space>

                        <Descriptions
                            column={{ xs: 1, sm: 2, md: 3 }}
                            style={{ marginTop: 24 }}
                            size="small"
                            bordered
                        >
                            <Descriptions.Item label="Email">{record.email}</Descriptions.Item>
                            <Descriptions.Item label="Téléphone">
                                {record.phone || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Inscrit le">
                                {dayjs(record.member_since).format("DD/MM/YYYY")}
                            </Descriptions.Item>
                            <Descriptions.Item label="Courses totales">
                                {record.total_trips}
                            </Descriptions.Item>
                            <Descriptions.Item label="Livraisons totales">
                                {record.total_deliveries}
                            </Descriptions.Item>
                            {(record.role === "chauffeur" || record.role === "agence") && (
                                <Descriptions.Item label="Disponible">
                                    <Badge
                                        status={record.disponible ? "success" : "default"}
                                        text={record.disponible ? "Oui" : "Non"}
                                    />
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {/* Notifications status — helps the admin diagnose why
                            a user might not receive a push (no token = OS-level
                            block; preference off = in-app category disabled). */}
                        <div
                            style={{
                                marginTop: 16,
                                padding: 12,
                                background: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                                borderRadius: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{ fontSize: 12, letterSpacing: 1, fontWeight: 700, color: DARK.textSecondary }}>
                                    NOTIFICATIONS
                                </Text>
                                <Badge
                                    status={record.push_token ? "success" : "default"}
                                    text={
                                        record.push_token
                                            ? "Push actif"
                                            : "Pas de token push"
                                    }
                                />
                            </div>
                            <Space wrap size={[6, 6]}>
                                {(
                                    [
                                        ["courses", "Courses"],
                                        ["trajets", "Trajets"],
                                        ["hebergements", "Hébergements"],
                                        ["promotions", "Promos"],
                                        ["messages", "Messages"],
                                    ] as const
                                ).map(([key, label]) => {
                                    const on =
                                        record.notification_preferences?.[key] ?? true;
                                    return (
                                        <Tag
                                            key={key}
                                            color={on ? "green" : "default"}
                                            style={{
                                                borderRadius: 6,
                                                opacity: on ? 1 : 0.55,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {on ? "✓" : "✗"} {label}
                                        </Tag>
                                    );
                                })}
                            </Space>
                        </div>

                        {/* Agency identity block — surfaces the logo + name +
                            "vérifié" mark that mobile users see on every
                            VoyageCard from this account. Admin can spot a
                            mis-branded agency at a glance. */}
                        {record.role === "agence" && (
                            <div
                                style={{
                                    marginTop: 24,
                                    padding: 16,
                                    background: "rgba(13, 148, 136, 0.06)",
                                    border: "1px solid rgba(13, 148, 136, 0.2)",
                                    borderRadius: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                }}
                            >
                                {record.agency_logo_url ? (
                                    <AntImage
                                        src={record.agency_logo_url}
                                        width={72}
                                        height={72}
                                        style={{
                                            borderRadius: 12,
                                            objectFit: "cover",
                                            background: "white",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 12,
                                            background: "rgba(13, 148, 136, 0.15)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#0D9488",
                                            fontSize: 28,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {(record.agency_name ?? "?")[0].toUpperCase()}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: "#0D9488", letterSpacing: 1, fontWeight: 700 }}>
                                        IDENTITÉ AGENCE
                                    </Text>
                                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700 }}>
                                        {record.agency_name ?? "(nom non défini)"}
                                    </div>
                                    <div style={{ marginTop: 4 }}>
                                        <Tag color="cyan" style={{ borderRadius: 6 }}>
                                            Vendeur officiel · Partenaire ZopGo
                                        </Tag>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Tabs */}
                    <Card bordered={false} style={{ borderRadius: 12 }}>
                        <Tabs
                            items={[
                                {
                                    key: "trips",
                                    label: `Courses (${tripsData?.total ?? 0})`,
                                    children: (
                                        <Table
                                            dataSource={tripsData?.data ?? []}
                                            rowKey="id"
                                            size="small"
                                            pagination={false}
                                        >
                                            <Table.Column
                                                title="De"
                                                dataIndex="from_address"
                                                ellipsis
                                            />
                                            <Table.Column
                                                title="À"
                                                dataIndex="to_address"
                                                ellipsis
                                            />
                                            <Table.Column
                                                title="Statut"
                                                dataIndex="status"
                                                render={(s: string) => (
                                                    <StatusTag status={s} type="trip" />
                                                )}
                                            />
                                            <Table.Column
                                                title="Prix"
                                                dataIndex="price"
                                                render={(p: number) => <PriceDisplay amount={p} />}
                                            />
                                            <Table.Column
                                                title="Date"
                                                dataIndex="created_at"
                                                render={(d: string) => dayjs(d).format("DD/MM/YY HH:mm")}
                                            />
                                        </Table>
                                    ),
                                },
                                {
                                    key: "deliveries",
                                    label: `Livraisons (${deliveriesData?.total ?? 0})`,
                                    children: (
                                        <Table
                                            dataSource={deliveriesData?.data ?? []}
                                            rowKey="id"
                                            size="small"
                                            pagination={false}
                                        >
                                            <Table.Column
                                                title="Pickup"
                                                dataIndex="pickup_address"
                                                ellipsis
                                            />
                                            <Table.Column
                                                title="Dropoff"
                                                dataIndex="dropoff_address"
                                                ellipsis
                                            />
                                            <Table.Column
                                                title="Statut"
                                                dataIndex="status"
                                                render={(s: string) => (
                                                    <StatusTag status={s} type="delivery" />
                                                )}
                                            />
                                            <Table.Column
                                                title="Prix"
                                                dataIndex="price"
                                                render={(p: number) => <PriceDisplay amount={p} />}
                                            />
                                            <Table.Column
                                                title="Date"
                                                dataIndex="created_at"
                                                render={(d: string) => dayjs(d).format("DD/MM/YY HH:mm")}
                                            />
                                        </Table>
                                    ),
                                },
                                ...(record.role === "chauffeur" || record.role === "agence"
                                    ? [
                                        {
                                            key: "trajets",
                                            label: `Trajets publiés (${trajetsData?.total ?? 0})`,
                                            children: (
                                                <Table
                                                    dataSource={trajetsData?.data ?? []}
                                                    rowKey="id"
                                                    size="small"
                                                    pagination={false}
                                                >
                                                    <Table.Column
                                                        title="Itinéraire"
                                                        render={(_, r: DbTrajet) => (
                                                            <span>
                                                                {r.ville_depart} → {r.ville_arrivee}
                                                            </span>
                                                        )}
                                                    />
                                                    <Table.Column
                                                        title="Véhicule"
                                                        dataIndex="vehicule"
                                                        render={(v: string) => (
                                                            <Tag color="blue">{v}</Tag>
                                                        )}
                                                    />
                                                    <Table.Column
                                                        title="Places"
                                                        dataIndex="places_disponibles"
                                                        align="center"
                                                    />
                                                    <Table.Column
                                                        title="Prix"
                                                        dataIndex="prix"
                                                        render={(p: number) => <PriceDisplay amount={p} />}
                                                    />
                                                    <Table.Column
                                                        title="Statut"
                                                        dataIndex="status"
                                                        render={(s: string) => (
                                                            <StatusTag status={s} type="trajet" />
                                                        )}
                                                    />
                                                    <Table.Column
                                                        title="Créé le"
                                                        dataIndex="created_at"
                                                        render={(d: string) => dayjs(d).format("DD/MM/YY HH:mm")}
                                                    />
                                                </Table>
                                            ),
                                        },
                                    ]
                                    : []),
                                // Réservations — universal tab (clients see
                                // the ones they made, transporteurs/agences
                                // see the ones they received). Same query
                                // shape, the filter field flips based on role.
                                {
                                    key: "reservations",
                                    label: `Réservations (${reservationsData?.total ?? 0})`,
                                    children: (
                                        <Table
                                            dataSource={reservationsData?.data ?? []}
                                            rowKey="id"
                                            size="small"
                                            pagination={false}
                                        >
                                            <Table.Column
                                                title="Itinéraire"
                                                render={(_, r: DbReservation) =>
                                                    r.trajet ? (
                                                        <span>
                                                            {r.trajet.ville_depart} →{" "}
                                                            {r.trajet.ville_arrivee}
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )
                                                }
                                            />
                                            <Table.Column
                                                title={
                                                    record.role === "client"
                                                        ? "Transporteur"
                                                        : "Client"
                                                }
                                                render={(_, r: DbReservation) => {
                                                    const other =
                                                        record.role === "client"
                                                            ? r.chauffeur
                                                            : r.client;
                                                    const displayName =
                                                        record.role === "client" &&
                                                        r.chauffeur?.role === "agence"
                                                            ? r.chauffeur.agency_name ??
                                                              other?.name ??
                                                              "—"
                                                            : other?.name ?? "—";
                                                    return (
                                                        <span>{displayName}</span>
                                                    );
                                                }}
                                            />
                                            <Table.Column
                                                title="Places"
                                                dataIndex="nombre_places"
                                                align="center"
                                            />
                                            <Table.Column
                                                title="Prix total"
                                                dataIndex="prix_total"
                                                render={(p: number) => (
                                                    <PriceDisplay amount={p} />
                                                )}
                                            />
                                            <Table.Column
                                                title="Statut"
                                                dataIndex="status"
                                                render={(s: string) => (
                                                    <StatusTag
                                                        status={s}
                                                        type="reservation"
                                                    />
                                                )}
                                            />
                                            <Table.Column
                                                title="Date"
                                                dataIndex="created_at"
                                                render={(d: string) =>
                                                    dayjs(d).format("DD/MM/YY HH:mm")
                                                }
                                            />
                                        </Table>
                                    ),
                                },
                                // Hébergements — only for hebergeur role.
                                ...(record.role === "hebergeur"
                                    ? [
                                        {
                                            key: "hebergements",
                                            label: `Hébergements (${hebergementsData?.total ?? 0})`,
                                            children: (
                                                <Table
                                                    dataSource={hebergementsData?.data ?? []}
                                                    rowKey="id"
                                                    size="small"
                                                    pagination={false}
                                                >
                                                    <Table.Column title="Nom" dataIndex="nom" />
                                                    <Table.Column
                                                        title="Type"
                                                        dataIndex="type"
                                                        render={(t: string) => (
                                                            <Tag color="purple">{t}</Tag>
                                                        )}
                                                    />
                                                    <Table.Column
                                                        title="Ville"
                                                        dataIndex="ville"
                                                    />
                                                    <Table.Column
                                                        title="Prix/nuit"
                                                        dataIndex="prix_par_nuit"
                                                        render={(p: number) => (
                                                            <PriceDisplay amount={p} />
                                                        )}
                                                    />
                                                    <Table.Column
                                                        title="Statut"
                                                        dataIndex="status"
                                                        render={(s: string) => (
                                                            <Tag
                                                                color={
                                                                    s === "actif"
                                                                        ? "green"
                                                                        : "default"
                                                                }
                                                            >
                                                                {s}
                                                            </Tag>
                                                        )}
                                                    />
                                                    <Table.Column
                                                        title="Dispo"
                                                        dataIndex="disponibilite"
                                                        align="center"
                                                    />
                                                    <Table.Column
                                                        title="Créé le"
                                                        dataIndex="created_at"
                                                        render={(d: string) =>
                                                            dayjs(d).format("DD/MM/YY HH:mm")
                                                        }
                                                    />
                                                </Table>
                                            ),
                                        },
                                    ]
                                    : []),
                                ...(record.role === "chauffeur"
                                    ? [
                                        {
                                            key: "vehicles",
                                            label: `Véhicules (${vehiclesData?.total ?? 0})`,
                                            children: (
                                                <Table
                                                    dataSource={vehiclesData?.data ?? []}
                                                    rowKey="id"
                                                    size="small"
                                                    pagination={false}
                                                >
                                                    <Table.Column title="Label" dataIndex="label" />
                                                    <Table.Column title="Type" dataIndex="type" />
                                                    <Table.Column
                                                        title="Marque"
                                                        dataIndex="brand"
                                                        render={(b: string) => b || "—"}
                                                    />
                                                    <Table.Column
                                                        title="Modèle"
                                                        dataIndex="model"
                                                        render={(m: string) => m || "—"}
                                                    />
                                                    <Table.Column
                                                        title="Plaque"
                                                        dataIndex="plate_number"
                                                        render={(p: string) => p || "—"}
                                                    />
                                                    <Table.Column
                                                        title="Actif"
                                                        dataIndex="is_active"
                                                        render={(a: boolean) => (
                                                            <Badge
                                                                status={a ? "success" : "default"}
                                                                text={a ? "Oui" : "Non"}
                                                            />
                                                        )}
                                                    />
                                                </Table>
                                            ),
                                        },
                                    ]
                                    : []),
                            ]}
                        />
                    </Card>
                </Space>
            )}
        </Show>
    );
}
