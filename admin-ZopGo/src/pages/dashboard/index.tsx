/**
 * ZopGo Admin — Dashboard
 *
 * Vue temps réel : KPIs (users / chauffeurs en ligne / hébergements actifs /
 * trajets en attente), table des chauffeurs disponibles, derniers inscrits,
 * activité récente (trajets et livraisons).
 */

import { Card, Col, Row, Typography, Space, Tag, Table, Avatar, Empty } from "antd";
import {
    TeamOutlined,
    CarOutlined,
    HomeOutlined,
    GlobalOutlined,
    ArrowUpOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { DARK, COLORS, USER_ROLE_LABELS, formatPrice } from "@/config/constants";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusTag } from "@/components/common/StatusTag";
import type { DbProfile, DbTrajet, DbLivraison, DbHebergement } from "@/types";

const { Text } = Typography;

const REFRESH_INTERVAL_MS = 30_000;

export function DashboardPage() {
    // ── Counts (KPI) ────────────────────────────────────────
    const { data: usersData } = useList<DbProfile>({
        resource: "profiles",
        pagination: { pageSize: 1 },
        liveMode: "off",
    });
    const { data: chauffeurDispoData } = useList<DbProfile>({
        resource: "profiles",
        pagination: { pageSize: 1 },
        filters: [
            { field: "role", operator: "eq", value: "chauffeur" },
            { field: "disponible", operator: "eq", value: true },
        ],
    });
    const { data: hebergementsActifsData } = useList<DbHebergement>({
        resource: "hebergements",
        pagination: { pageSize: 1 },
        filters: [{ field: "status", operator: "eq", value: "actif" }],
    });
    const { data: trajetsAttenteData } = useList<DbTrajet>({
        resource: "trajets",
        pagination: { pageSize: 1 },
        filters: [{ field: "status", operator: "eq", value: "en_attente" }],
    });

    // ── Chauffeurs en ligne (disponible=true) ────────────────
    const { data: onlineDriversData } = useList<DbProfile>({
        resource: "profiles",
        pagination: { pageSize: 8 },
        filters: [
            { field: "role", operator: "eq", value: "chauffeur" },
            { field: "disponible", operator: "eq", value: true },
        ],
        sorters: [{ field: "updated_at", order: "desc" }],
        queryOptions: { refetchInterval: REFRESH_INTERVAL_MS },
    });

    // ── Derniers inscrits ───────────────────────────────────
    const { data: latestUsersData } = useList<DbProfile>({
        resource: "profiles",
        pagination: { pageSize: 6 },
        sorters: [{ field: "created_at", order: "desc" }],
    });

    // ── Activité récente : trajets ──────────────────────────
    const { data: latestTrajetsData } = useList<DbTrajet>({
        resource: "trajets",
        pagination: { pageSize: 6 },
        sorters: [{ field: "created_at", order: "desc" }],
        meta: { select: "*, chauffeur:chauffeur_id(name, avatar)" },
    });

    // ── Activité récente : livraisons ───────────────────────
    const { data: latestLivraisonsData } = useList<DbLivraison>({
        resource: "livraisons",
        pagination: { pageSize: 6 },
        sorters: [{ field: "created_at", order: "desc" }],
        meta: { select: "*, client:client_id(name), livreur:livreur_id(name)" },
    });

    const kpis = [
        {
            label: "Utilisateurs",
            value: usersData?.total ?? 0,
            icon: <TeamOutlined style={{ fontSize: 22, color: COLORS.primary }} />,
            iconBg: "rgba(33, 98, 254, 0.12)",
            link: "/users",
        },
        {
            label: "Chauffeurs en ligne",
            value: chauffeurDispoData?.total ?? 0,
            icon: <CarOutlined style={{ fontSize: 22, color: COLORS.success }} />,
            iconBg: "rgba(16, 185, 129, 0.12)",
            link: "/users",
            highlight: "● live",
        },
        {
            label: "Hébergements actifs",
            value: hebergementsActifsData?.total ?? 0,
            icon: <HomeOutlined style={{ fontSize: 22, color: "#8B5CF6" }} />,
            iconBg: "rgba(139, 92, 246, 0.12)",
            link: "/hebergements",
        },
        {
            label: "Trajets en attente",
            value: trajetsAttenteData?.total ?? 0,
            icon: <GlobalOutlined style={{ fontSize: 22, color: COLORS.orange }} />,
            iconBg: "rgba(245, 158, 11, 0.12)",
            link: "/trajets",
        },
    ];

    return (
        <div className="admin-content-area">
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    {kpis.map((k) => (
                        <Col xs={24} sm={12} lg={6} key={k.label}>
                            <Link to={k.link} style={{ display: "block" }}>
                                <Card
                                    bordered={false}
                                    className="kpi-card admin-card-hover"
                                    style={{ borderRadius: 14, background: DARK.cardBg }}
                                    styles={{ body: { padding: 20 } }}
                                >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: k.iconBg,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            {k.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text style={{ color: DARK.textSecondary, fontSize: 13, fontWeight: 500 }}>
                                                {k.label}
                                            </Text>
                                            <div style={{
                                                fontSize: 28, fontWeight: 700,
                                                color: DARK.textPrimary, lineHeight: 1.1, marginTop: 6,
                                            }}>
                                                {k.value.toLocaleString("fr-FR")}
                                            </div>
                                            {k.highlight && (
                                                <div style={{
                                                    marginTop: 8, fontSize: 11, fontWeight: 600,
                                                    color: COLORS.success, letterSpacing: "0.04em",
                                                }}>
                                                    {k.highlight}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>

                {/* 2-col : online drivers + recent users */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <DashboardCard
                            title="Chauffeurs disponibles maintenant"
                            subtitle={`${onlineDriversData?.total ?? 0} en ligne · refresh auto 30s`}
                            link="/users"
                            linkLabel="Voir tous les utilisateurs"
                        >
                            <Table<DbProfile>
                                dataSource={onlineDriversData?.data ?? []}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                locale={{ emptyText: <Empty description="Aucun chauffeur en ligne" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                            >
                                <Table.Column<DbProfile>
                                    title="Chauffeur"
                                    dataIndex="name"
                                    render={(name, r) => (
                                        <Space>
                                            <UserAvatar src={r.avatar} name={name} size={32} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                                                <div style={{ fontSize: 11, color: DARK.textSecondary }}>
                                                    {r.phone || "—"}
                                                </div>
                                            </div>
                                        </Space>
                                    )}
                                />
                                <Table.Column<DbProfile>
                                    title="Statut"
                                    width={100}
                                    align="center"
                                    render={() => (
                                        <Tag color="success" style={{ borderRadius: 6, margin: 0 }}>
                                            ● Disponible
                                        </Tag>
                                    )}
                                />
                                <Table.Column<DbProfile>
                                    title="Trajets"
                                    dataIndex="total_trips"
                                    width={80}
                                    align="center"
                                    render={(v) => <Text style={{ fontWeight: 600 }}>{v ?? 0}</Text>}
                                />
                                <Table.Column<DbProfile>
                                    title="Note"
                                    dataIndex="rating"
                                    width={80}
                                    align="center"
                                    render={(v) => (
                                        <Text style={{ color: COLORS.warning, fontWeight: 600 }}>★ {v?.toFixed(1) ?? "—"}</Text>
                                    )}
                                />
                            </Table>
                        </DashboardCard>
                    </Col>

                    <Col xs={24} lg={10}>
                        <DashboardCard
                            title="Inscriptions récentes"
                            subtitle="Derniers comptes créés"
                            link="/users"
                            linkLabel="Tout voir"
                        >
                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                {(latestUsersData?.data ?? []).map((u) => (
                                    <div key={u.id} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "8px 4px",
                                    }}>
                                        <UserAvatar src={u.avatar} name={u.name} size={36} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: DARK.textPrimary }}>
                                                {u.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: DARK.textSecondary }}>
                                                {dayjs(u.created_at).format("DD/MM · HH:mm")}
                                            </div>
                                        </div>
                                        <Tag color={u.role === "chauffeur" ? "blue" : u.role === "hebergeur" ? "purple" : "default"} style={{ margin: 0, fontSize: 11 }}>
                                            {USER_ROLE_LABELS[u.role] ?? u.role}
                                        </Tag>
                                    </div>
                                ))}
                                {!latestUsersData?.data?.length && (
                                    <Empty description="Pas encore d'inscriptions" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}
                            </Space>
                        </DashboardCard>
                    </Col>
                </Row>

                {/* 2-col : trajets + livraisons */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <DashboardCard
                            title="Trajets récents"
                            subtitle="Derniers voyages publiés par les chauffeurs"
                            link="/trajets"
                            linkLabel="Tout voir"
                        >
                            <Table<DbTrajet>
                                dataSource={latestTrajetsData?.data ?? []}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                locale={{ emptyText: <Empty description="Aucun trajet" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                            >
                                <Table.Column<DbTrajet>
                                    title="Itinéraire"
                                    render={(_, r) => (
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                                                {r.ville_depart} → {r.ville_arrivee}
                                            </div>
                                            <div style={{ fontSize: 11, color: DARK.textSecondary }}>
                                                {r.chauffeur?.name ?? "—"} · {dayjs(r.created_at).format("DD/MM HH:mm")}
                                            </div>
                                        </div>
                                    )}
                                />
                                <Table.Column<DbTrajet>
                                    title="Prix"
                                    dataIndex="prix"
                                    width={100}
                                    align="right"
                                    render={(v) => <Text style={{ fontWeight: 600 }}>{formatPrice(v)}</Text>}
                                />
                                <Table.Column<DbTrajet>
                                    title="Statut"
                                    dataIndex="status"
                                    width={110}
                                    render={(s) => <StatusTag status={s} type="trajet" />}
                                />
                            </Table>
                        </DashboardCard>
                    </Col>

                    <Col xs={24} lg={12}>
                        <DashboardCard
                            title="Livraisons récentes"
                            subtitle="Dernières demandes de livraison"
                            link="/livraisons"
                            linkLabel="Tout voir"
                        >
                            <Table<DbLivraison>
                                dataSource={latestLivraisonsData?.data ?? []}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                locale={{ emptyText: <Empty description="Aucune livraison" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                            >
                                <Table.Column<DbLivraison>
                                    title="Course"
                                    render={(_, r) => (
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                                                {r.pickup_location} → {r.dropoff_location}
                                            </div>
                                            <div style={{ fontSize: 11, color: DARK.textSecondary }}>
                                                {r.client?.name ?? "Client"} · {dayjs(r.created_at).format("DD/MM HH:mm")}
                                            </div>
                                        </div>
                                    )}
                                />
                                <Table.Column<DbLivraison>
                                    title="Prix"
                                    dataIndex="prix_estime"
                                    width={100}
                                    align="right"
                                    render={(v) => <Text style={{ fontWeight: 600 }}>{formatPrice(v)}</Text>}
                                />
                                <Table.Column<DbLivraison>
                                    title="Statut"
                                    dataIndex="status"
                                    width={110}
                                    render={(s: string) => {
                                        const colorMap: Record<string, string> = {
                                            en_attente: "orange",
                                            acceptee: "blue",
                                            en_cours: "processing",
                                            livree: "green",
                                            refusee: "red",
                                            annulee: "red",
                                            expiree: "default",
                                        };
                                        return <Tag color={colorMap[s] ?? "default"}>{s}</Tag>;
                                    }}
                                />
                            </Table>
                        </DashboardCard>
                    </Col>
                </Row>
            </Space>
        </div>
    );
}

// ─── Local card wrapper ──────────────────────────────────────
function DashboardCard({
    title,
    subtitle,
    link,
    linkLabel,
    children,
}: {
    title: string;
    subtitle?: string;
    link?: string;
    linkLabel?: string;
    children: React.ReactNode;
}) {
    return (
        <Card
            bordered={false}
            style={{
                borderRadius: 14,
                background: DARK.cardBg,
                border: `1px solid ${DARK.border}`,
            }}
            styles={{ body: { padding: 20 } }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <Text style={{ fontSize: 15, fontWeight: 600, color: DARK.textPrimary }}>
                        {title}
                    </Text>
                    {subtitle && (
                        <div style={{ fontSize: 12, color: DARK.textSecondary, marginTop: 2 }}>
                            {subtitle}
                        </div>
                    )}
                </div>
                {link && (
                    <Link to={link} style={{ color: COLORS.primary, fontSize: 12, fontWeight: 500 }}>
                        {linkLabel ?? "Voir tout"} →
                    </Link>
                )}
            </div>
            {children}
        </Card>
    );
}
