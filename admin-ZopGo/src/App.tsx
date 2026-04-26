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
    ShoppingOutlined,
    GlobalOutlined,
    BellOutlined,
    AuditOutlined,
    DashboardOutlined,
    HomeOutlined,
    CalendarOutlined,
    MessageOutlined,
    NotificationOutlined,
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
import { AdminMessageList } from "@/pages/admin-messages/list";
import { AdminMessageCreate } from "@/pages/admin-messages/create";
import { AdminMessageShow } from "@/pages/admin-messages/show";
import { TrajetList } from "@/pages/trajets/list";
import { LivraisonList } from "@/pages/livraisons/list";
import { HebergementList } from "@/pages/hebergements/list";
import { ReservationList } from "@/pages/reservations/list";
import { DirectMessageList } from "@/pages/direct-messages/list";
import { NotificationList } from "@/pages/notifications/list";
import { AuditLogList } from "@/pages/audit/list";
import { SettingsPage } from "@/pages/settings";

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
                    name: "trajets",
                    list: "/trajets",
                    show: "/trajets/show/:id",
                    meta: {
                        label: "Trajets",
                        icon: <GlobalOutlined />,
                    },
                },
                {
                    name: "livraisons",
                    list: "/livraisons",
                    show: "/livraisons/show/:id",
                    meta: {
                        label: "Livraisons",
                        icon: <ShoppingOutlined />,
                    },
                },
                {
                    name: "hebergements",
                    list: "/hebergements",
                    show: "/hebergements/show/:id",
                    edit: "/hebergements/edit/:id",
                    meta: {
                        label: "Hébergements",
                        icon: <HomeOutlined />,
                    },
                },
                {
                    name: "reservations",
                    list: "/reservations",
                    show: "/reservations/show/:id",
                    meta: {
                        label: "Réservations",
                        icon: <CalendarOutlined />,
                    },
                },
                {
                    name: "direct_messages",
                    list: "/direct-messages",
                    show: "/direct-messages/show/:id",
                    meta: {
                        label: "Messages users",
                        icon: <MessageOutlined />,
                    },
                },
                {
                    name: "admin_messages",
                    list: "/admin-messages",
                    create: "/admin-messages/create",
                    show: "/admin-messages/show/:id",
                    meta: {
                        label: "Annonces (broadcast)",
                        icon: <NotificationOutlined />,
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

                    {/* Trajets */}
                    <Route path="/trajets">
                        <Route index element={<TrajetList />} />
                        <Route path="show/:id" element={<PlaceholderPage title="Détail trajet" />} />
                    </Route>

                    {/* Livraisons */}
                    <Route path="/livraisons">
                        <Route index element={<LivraisonList />} />
                        <Route path="show/:id" element={<PlaceholderPage title="Détail livraison" />} />
                    </Route>

                    {/* Hébergements */}
                    <Route path="/hebergements">
                        <Route index element={<HebergementList />} />
                        <Route path="show/:id" element={<PlaceholderPage title="Détail hébergement" />} />
                        <Route path="edit/:id" element={<PlaceholderPage title="Édition hébergement" />} />
                    </Route>

                    {/* Réservations */}
                    <Route path="/reservations">
                        <Route index element={<ReservationList />} />
                        <Route path="show/:id" element={<PlaceholderPage title="Détail réservation" />} />
                    </Route>

                    {/* Direct messages (modération) */}
                    <Route path="/direct-messages">
                        <Route index element={<DirectMessageList />} />
                        <Route path="show/:id" element={<PlaceholderPage title="Détail message" />} />
                    </Route>

                    {/* Admin messages (broadcast) */}
                    <Route path="/admin-messages">
                        <Route index element={<AdminMessageList />} />
                        <Route path="create" element={<AdminMessageCreate />} />
                        <Route path="show/:id" element={<AdminMessageShow />} />
                    </Route>

                    {/* Système */}
                    <Route path="/notifications" element={<NotificationList />} />
                    <Route path="/audit" element={<AuditLogList />} />
                    <Route path="/settings" element={<SettingsPage />} />

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
