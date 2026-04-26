/**
 * ZopGo Admin — Liste des trajets inter-villes
 */

import { List, useTable, FilterDropdown } from "@refinedev/antd";
import { Table, Space, Input, Select, Tag, Typography, Avatar } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StatusTag } from "@/components/common/StatusTag";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { TRAJET_STATUS_LABELS, GABON_CITIES, DARK } from "@/config/constants";
import type { DbTrajet } from "@/types";

const { Text } = Typography;

export function TrajetList() {
    const { tableProps } = useTable<DbTrajet>({
        resource: "trajets",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        meta: { select: "*, chauffeur:chauffeur_id(id, name, avatar)" },
    });

    return (
        <List title="Trajets inter-villes">
            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 900 }}>
                <Table.Column<DbTrajet>
                    title="Itinéraire"
                    width={280}
                    render={(_, r) => (
                        <Space>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: DARK.accentLight,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <GlobalOutlined style={{ color: DARK.accent, fontSize: 16 }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                    {r.ville_depart} → {r.ville_arrivee}
                                </div>
                                <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                    {r.vehicule}
                                </Text>
                            </div>
                        </Space>
                    )}
                />

                <Table.Column<DbTrajet>
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

                <Table.Column<DbTrajet>
                    title="Ville départ"
                    dataIndex="ville_depart"
                    width={140}
                    filterDropdown={(p) => (
                        <FilterDropdown {...p}>
                            <Select
                                placeholder="Filtrer ville"
                                style={{ width: 180 }}
                                allowClear
                                options={GABON_CITIES.map((c) => ({ value: c, label: c }))}
                            />
                        </FilterDropdown>
                    )}
                    render={(v) => <Text style={{ color: DARK.textSecondary }}>{v}</Text>}
                />

                <Table.Column<DbTrajet>
                    title="Date"
                    dataIndex="date"
                    width={130}
                    sorter
                    render={(d) => d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—"}
                />

                <Table.Column<DbTrajet>
                    title="Places"
                    dataIndex="places_disponibles"
                    width={80}
                    align="center"
                    sorter
                />

                <Table.Column<DbTrajet>
                    title="Prix"
                    dataIndex="prix"
                    width={110}
                    sorter
                    render={(p) => <PriceDisplay amount={p} />}
                />

                <Table.Column<DbTrajet>
                    title="Statut"
                    dataIndex="status"
                    width={120}
                    filterDropdown={(p) => (
                        <FilterDropdown {...p}>
                            <Select
                                placeholder="Filtrer"
                                style={{ width: 160 }}
                                allowClear
                                options={Object.entries(TRAJET_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                            />
                        </FilterDropdown>
                    )}
                    render={(s) => <StatusTag status={s} type="trajet" />}
                />

                <Table.Column<DbTrajet>
                    title="Créé le"
                    dataIndex="created_at"
                    width={130}
                    sorter
                    render={(d) => dayjs(d).format("DD/MM/YY HH:mm")}
                />
            </Table>
        </List>
    );
}
