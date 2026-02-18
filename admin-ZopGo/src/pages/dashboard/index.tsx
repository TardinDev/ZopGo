/**
 * ZopGo Admin — Dashboard (placeholder Phase 1)
 * Sera complété en Phase 3 avec KPIs et graphiques
 */

import { Card, Col, Row, Statistic, Typography, Space } from "antd";
import {
    TeamOutlined,
    CarOutlined,
    ShoppingOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { COLORS } from "@/config/constants";

const { Title, Text } = Typography;

export function DashboardPage() {
    // Fetch basic counts
    const { data: usersData } = useList({
        resource: "profiles",
        pagination: { pageSize: 1 },
    });

    const { data: tripsData } = useList({
        resource: "trips",
        pagination: { pageSize: 1 },
    });

    const { data: deliveriesData } = useList({
        resource: "deliveries",
        pagination: { pageSize: 1 },
    });

    const { data: trajetsData } = useList({
        resource: "trajets",
        pagination: { pageSize: 1 },
    });

    const stats = [
        {
            title: "Utilisateurs",
            value: usersData?.total ?? 0,
            icon: <TeamOutlined style={{ fontSize: 28, color: COLORS.primary }} />,
            color: COLORS.primaryLight,
        },
        {
            title: "Courses",
            value: tripsData?.total ?? 0,
            icon: <CarOutlined style={{ fontSize: 28, color: COLORS.success }} />,
            color: "#E6F7ED",
        },
        {
            title: "Livraisons",
            value: deliveriesData?.total ?? 0,
            icon: <ShoppingOutlined style={{ fontSize: 28, color: COLORS.orange }} />,
            color: "#FFF7E6",
        },
        {
            title: "Voyages",
            value: trajetsData?.total ?? 0,
            icon: <GlobalOutlined style={{ fontSize: 28, color: "#8B5CF6" }} />,
            color: "#F3E8FF",
        },
    ];

    return (
        <div>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        Tableau de bord
                    </Title>
                    <Text type="secondary">
                        Bienvenue sur le dashboard admin ZopGo
                    </Text>
                </div>

                <Row gutter={[16, 16]}>
                    {stats.map((stat) => (
                        <Col xs={24} sm={12} lg={6} key={stat.title}>
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 12,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 12,
                                            background: stat.color,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {stat.icon}
                                    </div>
                                    <Statistic
                                        title={stat.title}
                                        value={stat.value}
                                        valueStyle={{ fontWeight: 700, fontSize: 28 }}
                                    />
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Phase 3 : Charts + Activity feed ici */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 12,
                        textAlign: "center",
                        padding: "40px 0",
                        background: COLORS.gray[50],
                    }}
                >
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        📊 Graphiques et activité en temps réel — Phase 3
                    </Text>
                </Card>
            </Space>
        </div>
    );
}
