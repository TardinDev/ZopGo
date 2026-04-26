/**
 * ZopGo Admin — Liste des livraisons
 */

import { List, useTable, FilterDropdown } from "@refinedev/antd";
import { Table, Space, Select, Tag, Typography, Avatar } from "antd";
import { ShoppingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { LIVRAISON_STATUS_LABELS, DARK } from "@/config/constants";
import type { DbLivraison } from "@/types";

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
    en_attente: "orange",
    acceptee: "blue",
    refusee: "red",
    en_cours: "processing",
    livree: "green",
    annulee: "red",
    expiree: "default",
};

export function LivraisonList() {
    const { tableProps } = useTable<DbLivraison>({
        resource: "livraisons",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        meta: { select: "*, client:client_id(id, name, avatar), livreur:livreur_id(id, name, avatar)" },
    });

    return (
        <List title="Livraisons">
            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 1000 }}>
                <Table.Column<DbLivraison>
                    title="Course"
                    width={300}
                    render={(_, r) => (
                        <Space>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: "rgba(245, 158, 11, 0.16)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <ShoppingOutlined style={{ color: "#F59E0B", fontSize: 16 }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                    {r.pickup_location}
                                </div>
                                <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                    → {r.dropoff_location}
                                </Text>
                            </div>
                        </Space>
                    )}
                />

                <Table.Column<DbLivraison>
                    title="Client"
                    width={160}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={26} src={r.client?.avatar}>
                                {r.client?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.client?.name ?? "—"}</Text>
                        </Space>
                    )}
                />

                <Table.Column<DbLivraison>
                    title="Livreur"
                    width={160}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={26} src={r.livreur?.avatar}>
                                {r.livreur?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.livreur?.name ?? "—"}</Text>
                        </Space>
                    )}
                />

                <Table.Column<DbLivraison>
                    title="Prix estimé"
                    dataIndex="prix_estime"
                    width={120}
                    sorter
                    render={(p) => <PriceDisplay amount={p} />}
                />

                <Table.Column<DbLivraison>
                    title="Statut"
                    dataIndex="status"
                    width={130}
                    filterDropdown={(p) => (
                        <FilterDropdown {...p}>
                            <Select
                                placeholder="Filtrer"
                                style={{ width: 160 }}
                                allowClear
                                options={Object.entries(LIVRAISON_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                            />
                        </FilterDropdown>
                    )}
                    render={(s: string) => (
                        <Tag color={STATUS_COLORS[s] ?? "default"}>
                            {LIVRAISON_STATUS_LABELS[s] ?? s}
                        </Tag>
                    )}
                />

                <Table.Column<DbLivraison>
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
