/**
 * ZopGo Admin — Paramètres
 *
 * Page d'informations sur l'admin connecté + status système.
 * (Pas de paramètres modifiables côté MVP — futurs : préférences,
 * thème, alertes email, etc.)
 */

import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Space, Tag, Descriptions, Avatar, Divider, Alert } from "antd";
import {
    UserOutlined,
    SafetyCertificateOutlined,
    DatabaseOutlined,
    ApiOutlined,
} from "@ant-design/icons";
import { useGetIdentity } from "@refinedev/core";
import { useAuth } from "@clerk/clerk-react";
import { DARK, COLORS } from "@/config/constants";
import { supabase } from "@/config/supabase";

const { Text, Title } = Typography;

interface AdminIdentity {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
    role?: string | null;
}

interface JwtPayload {
    sub?: string;
    admin_role?: string;
    role?: string;
    email?: string;
    exp?: number;
    iat?: number;
}

export function SettingsPage() {
    const { data: identity } = useGetIdentity<AdminIdentity>();
    const { getToken } = useAuth();
    const [jwt, setJwt] = useState<JwtPayload | null>(null);
    const [dbHealthy, setDbHealthy] = useState<"checking" | "ok" | "error">("checking");

    useEffect(() => {
        getToken({ template: "supabase" })
            .then((tok) => {
                if (!tok) return;
                try {
                    const payload = JSON.parse(atob(tok.split(".")[1])) as JwtPayload;
                    setJwt(payload);
                } catch {
                    /* ignore */
                }
            })
            .catch(() => undefined);
    }, [getToken]);

    useEffect(() => {
        let cancelled = false;
        supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .then(({ error }) => {
                if (cancelled) return;
                setDbHealthy(error ? "error" : "ok");
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="admin-content-area">
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
                <Row gutter={[16, 16]}>
                    {/* Profil admin */}
                    <Col xs={24} lg={12}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: 14, background: DARK.cardBg, height: "100%" }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <Space size={16} align="center" style={{ marginBottom: 20 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: "rgba(33, 98, 254, 0.16)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <UserOutlined style={{ color: COLORS.primary, fontSize: 20 }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ margin: 0 }}>Compte administrateur</Title>
                                    <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                        Profil Clerk de l'admin connecté
                                    </Text>
                                </div>
                            </Space>

                            <Space size={16} align="center" style={{ marginBottom: 20 }}>
                                <Avatar size={64} src={identity?.avatar}>
                                    {identity?.name?.[0] ?? "A"}
                                </Avatar>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: DARK.textPrimary }}>
                                        {identity?.name ?? "—"}
                                    </div>
                                    <Text style={{ color: DARK.textSecondary, fontSize: 13 }}>
                                        {identity?.email ?? "—"}
                                    </Text>
                                    <div style={{ marginTop: 6 }}>
                                        <Tag color="blue" style={{ borderRadius: 6 }}>
                                            {identity?.role ?? "?"}
                                        </Tag>
                                    </div>
                                </div>
                            </Space>

                            <Descriptions column={1} size="small" bordered>
                                <Descriptions.Item label="Clerk user ID">
                                    <Text code style={{ fontSize: 11 }}>{identity?.id ?? "—"}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Email">
                                    {identity?.email ?? "—"}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>

                    {/* JWT info */}
                    <Col xs={24} lg={12}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: 14, background: DARK.cardBg, height: "100%" }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <Space size={16} align="center" style={{ marginBottom: 20 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: "rgba(16, 185, 129, 0.16)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <SafetyCertificateOutlined style={{ color: COLORS.success, fontSize: 20 }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ margin: 0 }}>JWT Supabase</Title>
                                    <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                        Claims du token utilisé pour les requêtes RLS
                                    </Text>
                                </div>
                            </Space>

                            {jwt ? (
                                <>
                                    {jwt.admin_role !== "admin" && (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            style={{ marginBottom: 12 }}
                                            message="Claim 'admin_role' manquant"
                                            description={
                                                <span style={{ fontSize: 12 }}>
                                                    Le template JWT « supabase » de Clerk doit inclure
                                                    {" "}<Text code>admin_role: {"{{ user.public_metadata.role }}"}</Text>{" "}
                                                    sinon les RLS Supabase rejetteront les requêtes.
                                                </span>
                                            }
                                        />
                                    )}
                                    <Descriptions column={1} size="small" bordered>
                                        <Descriptions.Item label="sub (Clerk ID)">
                                            <Text code style={{ fontSize: 11 }}>{jwt.sub ?? "—"}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="admin_role">
                                            <Tag color={jwt.admin_role === "admin" ? "green" : "red"}>
                                                {jwt.admin_role ?? "(absent)"}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="role (Postgres)">
                                            <Text code style={{ fontSize: 11 }}>{jwt.role ?? "—"}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Expire le">
                                            {jwt.exp
                                                ? new Date(jwt.exp * 1000).toLocaleString("fr-FR")
                                                : "—"}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </>
                            ) : (
                                <Text style={{ color: DARK.textSecondary, fontSize: 13 }}>
                                    Chargement du token…
                                </Text>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* System status */}
                <Card
                    bordered={false}
                    style={{ borderRadius: 14, background: DARK.cardBg }}
                    styles={{ body: { padding: 24 } }}
                >
                    <Space size={16} align="center" style={{ marginBottom: 20 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "rgba(139, 92, 246, 0.16)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <DatabaseOutlined style={{ color: "#8B5CF6", fontSize: 20 }} />
                        </div>
                        <div>
                            <Title level={5} style={{ margin: 0 }}>État du système</Title>
                            <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                Connectivité aux services externes
                            </Text>
                        </div>
                    </Space>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <StatusRow
                                icon={<DatabaseOutlined />}
                                label="Supabase (PostgreSQL + RLS)"
                                value={
                                    dbHealthy === "checking"
                                        ? <Tag>Vérification…</Tag>
                                        : dbHealthy === "ok"
                                            ? <Tag color="green">● Connecté</Tag>
                                            : <Tag color="red">● Erreur</Tag>
                                }
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <StatusRow
                                icon={<SafetyCertificateOutlined />}
                                label="Clerk (Authentification)"
                                value={<Tag color="green">● OK</Tag>}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <StatusRow
                                icon={<ApiOutlined />}
                                label="Expo Push API"
                                value={<Tag color="green">● Disponible</Tag>}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <StatusRow
                                icon={<ApiOutlined />}
                                label="Refine v4"
                                value={<Tag color="blue">v4.x</Tag>}
                            />
                        </Col>
                    </Row>

                    <Divider style={{ borderColor: DARK.border, margin: "20px 0" }} />

                    <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                        Pour modifier les rôles, JWT templates ou secrets, utilise les
                        dashboards Clerk et Supabase respectifs. Les paramètres
                        avancés modifiables depuis cette page seront ajoutés dans une
                        version ultérieure.
                    </Text>
                </Card>
            </Space>
        </div>
    );
}

function StatusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: 8,
            border: `1px solid ${DARK.border}`,
        }}>
            <Space size={10}>
                <span style={{ color: DARK.textSecondary, fontSize: 16 }}>{icon}</span>
                <Text style={{ fontSize: 13, color: DARK.textPrimary }}>{label}</Text>
            </Space>
            {value}
        </div>
    );
}
