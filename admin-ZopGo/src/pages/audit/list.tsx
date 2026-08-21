/**
 * ZopGo Admin — Journal d'audit (lecture seule)
 */

import { useMemo } from "react";
import { List, useTable, FilterDropdown } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Table, Space, Select, Tag, Typography, Tooltip } from "antd";
import dayjs from "dayjs";
import { DARK } from "@/config/constants";
import { describeActor, type ActorKind } from "./actor";
import type { DbAuditLog, DbProfile } from "@/types";

const { Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
    INSERT: "green",
    UPDATE: "blue",
    DELETE: "red",
};

export function AuditLogList() {
    const { tableProps } = useTable<DbAuditLog>({
        resource: "audit_log",
        sorters: { initial: [{ field: "performed_at", order: "desc" }] },
        pagination: { pageSize: 50 },
    });

    // Résout les identifiants de la page courante en noms. Charger tous les
    // profils serait inutile : une page affiche au plus 50 lignes, et les
    // auteurs s'y répètent beaucoup.
    const clerkIds = useMemo(() => {
        const brut = (tableProps.dataSource ?? [])
            .map((l) => l.performed_by)
            .filter((p): p is string => !!p && p !== "system" && p !== "clerk-webhook");
        return Array.from(new Set(brut));
    }, [tableProps.dataSource]);

    const { data: auteursData } = useList<DbProfile>({
        resource: "profiles",
        filters: [{ field: "clerk_id", operator: "in", value: clerkIds }],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: clerkIds.length > 0 },
    });

    const nomsParClerkId = useMemo(() => {
        const m: Record<string, string> = {};
        for (const p of auteursData?.data ?? []) {
            if (p.clerk_id) m[p.clerk_id] = p.name;
        }
        return m;
    }, [auteursData]);

    return (
        <List title="Journal d'audit" canCreate={false}>
            <div style={{
                marginBottom: 16, padding: 12,
                background: DARK.cardBg,
                borderRadius: 8, border: `1px solid ${DARK.border}`,
                fontSize: 12, color: DARK.textSecondary,
            }}>
                <Text style={{ color: DARK.textSecondary, fontSize: 12 }}>
                    Lecture seule. Trace immuable de toutes les modifications sensibles
                    (INSERT / UPDATE / DELETE) sur les tables auditées.
                </Text>
            </div>

            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 900 }}>
                <Table.Column<DbAuditLog>
                    title="Action"
                    dataIndex="action"
                    width={110}
                    filterDropdown={(p) => (
                        <FilterDropdown {...p}>
                            <Select
                                placeholder="Type"
                                style={{ width: 140 }}
                                allowClear
                                options={[
                                    { value: "INSERT", label: "INSERT" },
                                    { value: "UPDATE", label: "UPDATE" },
                                    { value: "DELETE", label: "DELETE" },
                                ]}
                            />
                        </FilterDropdown>
                    )}
                    render={(a: string) => <Tag color={ACTION_COLORS[a] ?? "default"}>{a}</Tag>}
                />

                <Table.Column<DbAuditLog>
                    title="Table"
                    dataIndex="table_name"
                    width={140}
                    render={(t) => (
                        <Text code style={{ fontSize: 12 }}>{t}</Text>
                    )}
                />

                <Table.Column<DbAuditLog>
                    title="Record ID"
                    dataIndex="record_id"
                    render={(id: string) => (
                        <Text style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: DARK.textSecondary }}>
                            {id}
                        </Text>
                    )}
                />

                <Table.Column<DbAuditLog>
                    title="Effectué par"
                    dataIndex="performed_by"
                    width={200}
                    render={(p: string) => {
                        const a = describeActor(p, nomsParClerkId);
                        const couleur: Record<ActorKind, string> = {
                            personne: DARK.textPrimary,
                            systeme: DARK.textMuted,
                            webhook: DARK.textMuted,
                            retire: DARK.textMuted,
                        };
                        return (
                            <Tooltip title={a.raw || "aucun identifiant"}>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: couleur[a.kind],
                                        fontStyle: a.kind === "personne" ? "normal" : "italic",
                                    }}
                                >
                                    {a.label}
                                </Text>
                            </Tooltip>
                        );
                    }}
                />

                <Table.Column<DbAuditLog>
                    title="Date"
                    dataIndex="performed_at"
                    width={170}
                    sorter
                    render={(d) => dayjs(d).format("DD/MM/YY HH:mm:ss")}
                />
            </Table>
        </List>
    );
}
