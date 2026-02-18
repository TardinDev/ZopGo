/**
 * ZopGo Admin — Refine root component
 * Routing, resources, providers, theme Ant Design
 */

import { useEffect, useMemo } from "react";
import { Refine, Authenticated } from "@refinedev/core";
import { ThemedLayoutV2, ErrorComponent, useNotificationProvider } from "@refinedev/antd";
import routerProvider, {
    CatchAllNavigate,
    NavigateToResource,
    DocumentTitleHandler,
    UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ConfigProvider, App as AntdApp, theme } from "antd";
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
import { COLORS } from "@/config/constants";

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

// Import Ant Design + Refine styles
import "@refinedev/antd/dist/reset.css";

function AppContent() {
    const auth = useAuth();
    const userHook = useUser();

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
                {/* Auth: Login */}
                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                {/* Protected routes */}
                <Route
                    element={
                        <Authenticated
                            key="auth"
                            fallback={<CatchAllNavigate to="/login" />}
                        >
                            <ThemedLayoutV2
                                Sider={() => <AdminSider />}
                                Header={() => <AdminHeader />}
                                Title={() => (
                                    <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary }}>
                                        ZopGo
                                    </span>
                                )}
                            >
                                <Outlet />
                            </ThemedLayoutV2>
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
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                color: COLORS.gray[400],
            }}
        >
            <h2 style={{ color: COLORS.gray[700] }}>{title}</h2>
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
                    },
                    algorithm: theme.defaultAlgorithm,
                }}
            >
                <AntdApp>
                    <AppContent />
                </AntdApp>
            </ConfigProvider>
        </BrowserRouter>
    );
}
