/**
 * ZopGo Admin — Liste des hébergements
 */

import { List, useTable, FilterDropdown, ShowButton } from "@refinedev/antd";
import { Table, Space, Select, Tag, Typography, Avatar, Image } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import {
    HEBERGEMENT_TYPE_LABELS,
    HEBERGEMENT_STATUS_LABELS,
    GABON_CITIES,
    DARK,
} from "@/config/constants";
import type { DbHebergement } from "@/types";

const { Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
    hotel: "purple",
    auberge: "geekblue",
    appartement: "blue",
    maison: "cyan",
    chambre: "default",
};

export function HebergementList() {
    const { tableProps } = useTable<DbHebergement>({
        resource: "hebergements",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        meta: { select: "*, hebergeur:hebergeur_id(id, name, avatar)" },
    });

    return (
        <List title="Hébergements">
            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 1100 }}>
                <Table.Column<DbHebergement>
                    title="Hébergement"
                    width={320}
                    render={(_, r) => (
                        <Space>
                            {r.images && r.images[0] ? (
                                <Image
                                    src={r.images[0]}
                                    width={48}
                                    height={48}
                                    style={{ borderRadius: 8, objectFit: "cover" }}
                                    preview={false}
                                />
                            ) : (
                                <div style={{
                                    width: 48, height: 48, borderRadius: 8,
                                    background: "rgba(139, 92, 246, 0.16)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <HomeOutlined style={{ color: "#8B5CF6", fontSize: 18 }} />
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.nom}</div>
                                <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                    {r.ville} · {r.adresse || "—"}
                                </Text>
                            </div>
                        </Space>
                    )}
                />

                <Table.Column<DbHebergement>
                    title="Hébergeur"
                    width={160}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={26} src={r.hebergeur?.avatar}>
                                {r.hebergeur?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.hebergeur?.name ?? "—"}</Text>
                        </Space>
                    )}
                />

                <Table.Column<DbHebergement>
                    title="Type"
                    dataIndex="type"
                    width={120}
                    filterDropdown={(p) => (
                        <FilterDropdown {...p}>
                            <Select
                                placeholder="Type"
                                style={{ width: 160 }}
                                allowClear
                                options={Object.entries(HEBERGEMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                            />
                        </FilterDropdown>
                    )}
                    render={(t: string) => (
                        <Tag color={TYPE_COLORS[t] ?? "default"}>
                            {HEBERGEMENT_TYPE_LABELS[t] ?? t}
                        </Tag>
                    )}
                />

                <Table.Column<DbHebergement>
                    title="Ville"
                    dataIndex="ville"
                    width={130}
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
                />

                <Table.Column<DbHebergement>
                    title="Capacité"
                    dataIndex="capacite"
                    width={90}
                    align="center"
                    sorter
                />

                <Table.Column<DbHebergement>
                    title="Prix / nuit"
                    dataIndex="prix_par_nuit"
                    width={120}
                    sorter
                    render={(p) => <PriceDisplay amount={p} />}
                />

                <Table.Column<DbHebergement>
                    title="Disponibilité"
                    dataIndex="disponibilite"
                    width={110}
                    align="center"
                    sorter
                    render={(d: number) => (
                        <Tag color={d > 0 ? "green" : "default"}>
                            {d > 0 ? `${d} dispo` : "Complet"}
                        </Tag>
                    )}
                />

                <Table.Column<DbHebergement>
                    title="Statut"
                    dataIndex="status"
                    width={100}
                    render={(s: string) => (
                        <Tag color={s === "actif" ? "green" : "default"}>
                            {HEBERGEMENT_STATUS_LABELS[s] ?? s}
                        </Tag>
                    )}
                />

                <Table.Column<DbHebergement>
                    title="Créé le"
                    dataIndex="created_at"
                    width={120}
                    sorter
                    render={(d) => dayjs(d).format("DD/MM/YY")}
                />

                <Table.Column<DbHebergement>
                    title="Actions"
                    key="actions"
                    width={80}
                    fixed="right"
                    render={(_, r) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={r.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}
