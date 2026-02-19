/**
 * ZopGo Admin — Dark Dashboard with KPI cards, chart placeholders
 */

import { Card, Col, Row, Typography, Space, Button } from "antd";
import {
    TeamOutlined,
    CarOutlined,
    ShoppingOutlined,
    GlobalOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    BarChartOutlined,
    PieChartOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { DARK, COLORS } from "@/config/constants";

const { Text } = Typography;

export function DashboardPage() {
    const { data: usersData } = useList({ resource: "profiles", pagination: { pageSize: 1 } });
    const { data: tripsData } = useList({ resource: "trips", pagination: { pageSize: 1 } });
    const { data: deliveriesData } = useList({ resource: "deliveries", pagination: { pageSize: 1 } });
    const { data: trajetsData } = useList({ resource: "trajets", pagination: { pageSize: 1 } });

    const stats = [
        {
            title: "Utilisateurs",
            value: usersData?.total ?? 0,
            icon: <TeamOutlined style={{ fontSize: 22, color: DARK.accent }} />,
            trend: "+12%",
            trendUp: true,
            trendLabel: "du dernier trimestre",
        },
        {
            title: "Courses",
            value: tripsData?.total ?? 0,
            icon: <CarOutlined style={{ fontSize: 22, color: COLORS.success }} />,
            trend: "+8%",
            trendUp: true,
            trendLabel: "du dernier trimestre",
        },
        {
            title: "Livraisons",
            value: deliveriesData?.total ?? 0,
            icon: <ShoppingOutlined style={{ fontSize: 22, color: COLORS.orange }} />,
            trend: "-3%",
            trendUp: false,
            trendLabel: "du dernier trimestre",
        },
        {
            title: "Voyages",
            value: trajetsData?.total ?? 0,
            icon: <GlobalOutlined style={{ fontSize: 22, color: DARK.accent }} />,
            trend: "+5%",
            trendUp: true,
            trendLabel: "du dernier trimestre",
        },
    ];

    return (
        <div className="admin-content-area">
            <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    {stats.map((stat) => (
                        <Col xs={24} sm={12} lg={6} key={stat.title}>
                            <Card
                                bordered={false}
                                className="admin-card-hover kpi-card"
                                style={{ borderRadius: 16, background: DARK.cardBg }}
                                styles={{ body: { padding: "24px" } }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                    <div style={{ flex: 1 }}>
                                        <Text style={{ color: DARK.textSecondary, fontSize: 13, fontWeight: 500 }}>
                                            {stat.title}
                                        </Text>
                                        <div style={{
                                            fontSize: 38,
                                            fontWeight: 700,
                                            color: DARK.textPrimary,
                                            lineHeight: 1.2,
                                            marginTop: 8,
                                        }}>
                                            {stat.value.toLocaleString("fr-FR")}
                                        </div>
                                        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                            {stat.trendUp ? (
                                                <ArrowUpOutlined style={{ fontSize: 12, color: DARK.success }} />
                                            ) : (
                                                <ArrowDownOutlined style={{ fontSize: 12, color: DARK.error }} />
                                            )}
                                            <Text style={{
                                                fontSize: 13,
                                                color: stat.trendUp ? DARK.success : DARK.error,
                                                fontWeight: 600,
                                            }}>
                                                {stat.trend}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                                {stat.trendLabel}
                                            </Text>
                                        </div>
                                    </div>
                                    <MoreOutlined
                                        style={{
                                            fontSize: 18,
                                            color: DARK.textMuted,
                                            cursor: "pointer",
                                            padding: 4,
                                        }}
                                    />
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Chart Cards */}
                <Row gutter={[16, 16]}>
                    {/* Performance Chart */}
                    <Col xs={24} md={12}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                background: DARK.cardBg,
                                border: `1px solid ${DARK.border}`,
                            }}
                            styles={{ body: { padding: "24px" } }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <div>
                                    <Text style={{ fontSize: 17, fontWeight: 600, color: DARK.textPrimary }}>
                                        Performance
                                    </Text>
                                    <div style={{ fontSize: 13, color: DARK.textSecondary, marginTop: 2 }}>
                                        Activité par service
                                    </div>
                                </div>
                                <MoreOutlined style={{ fontSize: 18, color: DARK.textMuted, cursor: "pointer" }} />
                            </div>

                            {/* Placeholder bar chart */}
                            <div style={{
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "space-around",
                                height: 180,
                                padding: "0 16px",
                                gap: 12,
                            }}>
                                {[65, 45, 80, 55, 70, 40, 90].map((h, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: "100%",
                                            maxWidth: 32,
                                            height: `${h}%`,
                                            borderRadius: 6,
                                            background: i === 6
                                                ? DARK.accent
                                                : `rgba(124, 92, 252, ${0.15 + (i * 0.08)})`,
                                            transition: "height 0.3s ease",
                                        }}
                                    />
                                ))}
                            </div>

                            <div style={{ textAlign: "center", marginTop: 20 }}>
                                <Button
                                    type="link"
                                    style={{ color: DARK.accent, fontWeight: 500, padding: 0 }}
                                >
                                    Voir tous les détails
                                </Button>
                            </div>
                        </Card>
                    </Col>

                    {/* Attendance / Activity Chart */}
                    <Col xs={24} md={12}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                background: DARK.cardBg,
                                border: `1px solid ${DARK.border}`,
                            }}
                            styles={{ body: { padding: "24px" } }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <div>
                                    <Text style={{ fontSize: 17, fontWeight: 600, color: DARK.textPrimary }}>
                                        Répartition
                                    </Text>
                                    <div style={{ fontSize: 13, color: DARK.textSecondary, marginTop: 2 }}>
                                        Statut des chauffeurs
                                    </div>
                                </div>
                                <MoreOutlined style={{ fontSize: 18, color: DARK.textMuted, cursor: "pointer" }} />
                            </div>

                            {/* Placeholder donut chart */}
                            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                                <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
                                    <svg viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                                        <circle cx="70" cy="70" r="56" fill="none" stroke={DARK.cardBgHover} strokeWidth="20" />
                                        <circle cx="70" cy="70" r="56" fill="none" stroke={DARK.accent} strokeWidth="20"
                                            strokeDasharray="220 352" strokeLinecap="round" />
                                        <circle cx="70" cy="70" r="56" fill="none" stroke={COLORS.success} strokeWidth="20"
                                            strokeDasharray="88 352" strokeDashoffset="-220" strokeLinecap="round" />
                                        <circle cx="70" cy="70" r="56" fill="none" stroke={COLORS.orange} strokeWidth="20"
                                            strokeDasharray="44 352" strokeDashoffset="-308" strokeLinecap="round" />
                                    </svg>
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        display: "flex", flexDirection: "column",
                                        alignItems: "center", justifyContent: "center",
                                    }}>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: DARK.textPrimary }}>
                                            {usersData?.total ?? 0}
                                        </div>
                                        <div style={{ fontSize: 11, color: DARK.textSecondary }}>Total</div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {[
                                        { label: "Actifs", color: DARK.accent, pct: "62%" },
                                        { label: "Disponibles", color: COLORS.success, pct: "25%" },
                                        { label: "Hors ligne", color: COLORS.orange, pct: "13%" },
                                    ].map((item) => (
                                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 10, height: 10, borderRadius: "50%",
                                                background: item.color, flexShrink: 0,
                                            }} />
                                            <div>
                                                <div style={{ fontSize: 13, color: DARK.textSecondary }}>{item.label}</div>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: DARK.textPrimary }}>
                                                    {item.pct}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ textAlign: "center", marginTop: 20 }}>
                                <Button
                                    type="link"
                                    style={{ color: DARK.accent, fontWeight: 500, padding: 0 }}
                                >
                                    Voir tous les détails
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </div>
    );
}
