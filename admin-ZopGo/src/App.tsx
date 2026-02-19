/**
 * ZopGo Admin — Refine root component
 * Full dark theme with Ant Design darkAlgorithm
 */

import { useEffect, useMemo } from "react";
import { Refine, Authenticated } from "@refinedev/core";
import { ErrorComponent, useNotificationProvider } from "@refinedev/antd";
import routerProvider, {
    CatchAllNavigate,
    DocumentTitleHandler,
    UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ConfigProvider, App as AntdApp, Layout, theme, Spin } from "antd";
import frFR from "antd/locale/fr_FR";
import {
    TeamOutlined,
    CarOutlined,
    ShoppingOutlined,
    GlobalOutlined,
    BellOutlined,
    AuditOutlined,
    DashboardOutlined,
} from "@ant-design/icons";
import { useAuth, useUser } from "@clerk/clerk-react";

// Config
import { setClerkTokenProvider } from "@/config/supabase";
import { COLORS, DARK } from "@/config/constants";

// Auth & Providers
import { createAuthProvider } from "@/auth/authProvider";
import { LoginPage } from "@/auth/LoginPage";
import { dataProvider } from "@/providers/dataProvider";
import { accessControlProvider } from "@/providers/accessControlProvider";

// Layout
import { AdminSider } from "@/components/layout/AdminSider";
import { AdminHeader } from "@/components/layout/AdminHeader";

// Pages
import { DashboardPage } from "@/pages/dashboard";
import { UserList } from "@/pages/users/list";
import { UserShow } from "@/pages/users/show";
import { UserEdit } from "@/pages/users/edit";

// Styles
import "@refinedev/antd/dist/reset.css";
import "@/styles/admin.css";

const { Content } = Layout;

function AppContent() {
    const auth = useAuth();
    const userHook = useUser();

    // Reload Clerk user on mount to get fresh publicMetadata
    useEffect(() => {
        if (userHook.isLoaded && userHook.user) {
            userHook.user.reload();
        }
        // Only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userHook.isLoaded]);

    // Inject Clerk JWT into Supabase client
    useEffect(() => {
        if (auth.isSignedIn) {
            setClerkTokenProvider(() =>
                auth.getToken({ template: "supabase" })
            );
        } else {
            setClerkTokenProvider(null);
        }
    }, [auth.isSignedIn, auth.getToken]);

    const authProvider = useMemo(
        () => createAuthProvider(auth, userHook),
        [auth.isSignedIn, auth.isLoaded, userHook.user, userHook.isLoaded]
    );

    return (
        <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider}
            authProvider={authProvider}
            accessControlProvider={accessControlProvider}
            notificationProvider={useNotificationProvider()}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
            }}
            resources={[
                {
                    name: "dashboard",
                    list: "/",
                    meta: {
                        label: "Tableau de bord",
                        icon: <DashboardOutlined />,
                    },
                },
                {
                    name: "profiles",
                    list: "/users",
                    show: "/users/show/:id",
                    edit: "/users/edit/:id",
                    meta: {
                        label: "Utilisateurs",
                        icon: <TeamOutlined />,
                    },
                },
                {
                    name: "trips",
                    list: "/trips",
                    show: "/trips/show/:id",
                    meta: {
                        label: "Courses",
                        icon: <CarOutlined />,
                    },
                },
                {
                    name: "deliveries",
                    list: "/deliveries",
                    show: "/deliveries/show/:id",
                    meta: {
                        label: "Livraisons",
                        icon: <ShoppingOutlined />,
                    },
                },
                {
                    name: "trajets",
                    list: "/trajets",
                    show: "/trajets/show/:id",
                    meta: {
                        label: "Voyages",
                        icon: <GlobalOutlined />,
                    },
                },
                {
                    name: "notifications",
                    list: "/notifications",
                    meta: {
                        label: "Notifications",
                        icon: <BellOutlined />,
                    },
                },
                {
                    name: "audit_log",
                    list: "/audit",
                    meta: {
                        label: "Journal d'audit",
                        icon: <AuditOutlined />,
                    },
                },
            ]}
        >
            <Routes>
                {/* Auth: Login + Forbidden — wildcard * pour les sous-routes Clerk */}
                <Route path="/login/*" element={<LoginPage />} />
                <Route path="/forbidden" element={<LoginPage />} />

                {/* Protected routes */}
                <Route
                    element={
                        <Authenticated
                            key="auth"
                            fallback={<CatchAllNavigate to="/login" />}
                            loading={
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: "100vh",
                                        background: DARK.pageBg,
                                    }}
                                >
                                    <Spin size="large" />
                                </div>
                            }
                        >
                            <Layout style={{ minHeight: "100vh" }}>
                                <AdminSider />
                                <Layout>
                                    <AdminHeader />
                                    <Content
                                        style={{
                                            margin: 0,
                                            padding: 24,
                                            background: DARK.pageBg,
                                            minHeight: 280,
                                            overflow: "auto",
                                        }}
                                    >
                                        <Outlet />
                                    </Content>
                                </Layout>
                            </Layout>
                        </Authenticated>
                    }
                >
                    {/* Dashboard */}
                    <Route index element={<DashboardPage />} />

                    {/* Users */}
                    <Route path="/users">
                        <Route index element={<UserList />} />
                        <Route path="show/:id" element={<UserShow />} />
                        <Route path="edit/:id" element={<UserEdit />} />
                    </Route>

                    {/* Placeholder routes for Phase 2 resources */}
                    <Route path="/trips" element={<PlaceholderPage title="Courses — ZopRide" />} />
                    <Route path="/deliveries" element={<PlaceholderPage title="Livraisons — ZopDelivery" />} />
                    <Route path="/trajets" element={<PlaceholderPage title="Voyages — ZopTravel" />} />
                    <Route path="/vehicles" element={<PlaceholderPage title="Véhicules" />} />
                    <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
                    <Route path="/audit" element={<PlaceholderPage title="Journal d'audit" />} />
                    <Route path="/settings" element={<PlaceholderPage title="Paramètres" />} />

                    {/* Catch-all */}
                    <Route path="*" element={<ErrorComponent />} />
                </Route>
            </Routes>

            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
        </Refine>
    );
}

/**
 * Placeholder for Phase 2+ pages
 */
function PlaceholderPage({ title }: { title: string }) {
    return (
        <div
            className="admin-content-area"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                color: DARK.textSecondary,
            }}
        >
            <h2 style={{ color: DARK.textPrimary }}>{title}</h2>
            <p>Cette section sera implémentée dans une prochaine phase.</p>
        </div>
    );
}

export function App() {
    return (
        <BrowserRouter>
            <ConfigProvider
                locale={frFR}
                theme={{
                    token: {
                        colorPrimary: COLORS.primary,
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                        borderRadius: 8,
                        colorBgContainer: DARK.cardBg,
                        colorBgLayout: DARK.pageBg,
                        colorBgBase: DARK.pageBg,
                        colorText: DARK.textPrimary,
                        colorTextSecondary: DARK.textSecondary,
                        colorBorder: "rgba(255, 255, 255, 0.06)",
                        colorBorderSecondary: "rgba(255, 255, 255, 0.04)",
                        controlHeight: 36,
                        fontSize: 14,
                    },
                    algorithm: theme.darkAlgorithm,
                }}
            >
                <AntdApp>
                    <AppContent />
                </AntdApp>
            </ConfigProvider>
        </BrowserRouter>
    );
}
