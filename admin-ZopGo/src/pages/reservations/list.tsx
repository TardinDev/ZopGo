/**
 * ZopGo Admin — Liste des réservations de trajets
 */

import { List, useTable, FilterDropdown } from "@refinedev/antd";
import { Table, Space, Select, Tag, Typography, Avatar } from "antd";
import dayjs from "dayjs";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { RESERVATION_STATUS_LABELS, DARK } from "@/config/constants";
import type { DbReservation } from "@/types";

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
    en_attente: "orange",
    acceptee: "green",
    refusee: "red",
    annulee: "default",
};

export function ReservationList() {
    const { tableProps } = useTable<DbReservation>({
        resource: "reservations",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        meta: {
            select: `*, trajet:trajet_id(id, ville_depart, ville_arrivee), client:client_id(id, name, avatar), chauffeur:chauffeur_id(id, name, avatar)`,
        },
    });

    return (
        <List title="Réservations">
            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 1000 }}>
                <Table.Column<DbReservation>
                    title="Trajet"
                    width={240}
                    render={(_, r) => (
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {r.trajet?.ville_depart ?? "—"} → {r.trajet?.ville_arrivee ?? "—"}
                            </div>
                            <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                {r.nombre_places} place(s)
                            </Text>
                        </div>
                    )}
                />

                <Table.Column<DbReservation>
                    title="Client"
                    width={180}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={28} src={r.client?.avatar}>
                                {r.client?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.client?.name ?? "—"}</Text>
                        </Space>
                    )}
                />

                <Table.Column<DbReservation>
                    title="Chauffeur"
                    width={180}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={28} src={r.chauffeur?.avatar}>
                                {r.chauffeur?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.chauffeur?.name ?? "—"}</Text>
                        </Space>
                    )}
                />

                <Table.Column<DbReservation>
                    title="Total"
                    dataIndex="prix_total"
                    width={120}
                    sorter
                    render={(p) => <PriceDisplay amount={p} />}
                />

                <Table.Column<DbReservation>
                    title="Statut"
                    dataIndex="status"
                    width={120}
                    filterDropdown={(p) => (
                        <FilterDropdown {...p}>
                            <Select
                                placeholder="Filtrer"
                                style={{ width: 160 }}
                                allowClear
                                options={Object.entries(RESERVATION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                            />
                        </FilterDropdown>
                    )}
                    render={(s: string) => (
                        <Tag color={STATUS_COLORS[s] ?? "default"}>
                            {RESERVATION_STATUS_LABELS[s] ?? s}
                        </Tag>
                    )}
                />

                <Table.Column<DbReservation>
                    title="Créée le"
                    dataIndex="created_at"
                    width={140}
                    sorter
                    render={(d) => dayjs(d).format("DD/MM/YY HH:mm")}
                />
            </Table>
        </List>
    );
}
