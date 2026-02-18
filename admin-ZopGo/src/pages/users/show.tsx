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
} from "antd";
import {
    EditOutlined,
    StopOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { useShow, useNavigation, useUpdate, useList } from "@refinedev/core";
import dayjs from "dayjs";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusTag } from "@/components/common/StatusTag";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { USER_ROLE_LABELS, COLORS } from "@/config/constants";
import type { DbProfile, DbTrip, DbDelivery, DbVehicle } from "@/types";

const { Title, Text } = Typography;

export function UserShow() {
    const { queryResult } = useShow<DbProfile>({ resource: "profiles" });
    const { data, isLoading } = queryResult;
    const record = data?.data;
    const { edit } = useNavigation();
    const { mutate: updateProfile } = useUpdate();

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
                                        color={record.role === "chauffeur" ? "blue" : "default"}
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
                            {record.role === "chauffeur" && (
                                <Descriptions.Item label="Disponible">
                                    <Badge
                                        status={record.disponible ? "success" : "default"}
                                        text={record.disponible ? "Oui" : "Non"}
                                    />
                                </Descriptions.Item>
                            )}
                        </Descriptions>
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
