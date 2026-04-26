/**
 * ZopGo Admin — Dark header with route-based title, search, notifications, user
 */

import { Layout, Avatar, Dropdown, Space, Badge, Input } from "antd";
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
    MessageOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { useLocation } from "react-router-dom";
import { DARK } from "@/config/constants";

const { Header } = Layout;

interface Identity {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
    role?: string;
}

/** Map route segments to page titles + subtitles */
const routeTitles: Record<string, { title: string; subtitle: string }> = {
    "/": { title: "Dashboard", subtitle: "Vue temps réel de l'activité ZopGo" },
    "/users": { title: "Utilisateurs", subtitle: "Gérez les comptes clients, chauffeurs et hébergeurs" },
    "/trajets": { title: "Trajets", subtitle: "Voyages inter-villes publiés par les chauffeurs" },
    "/livraisons": { title: "Livraisons", subtitle: "Suivi des demandes de livraison" },
    "/hebergements": { title: "Hébergements", subtitle: "Modération des annonces de logement" },
    "/reservations": { title: "Réservations", subtitle: "Réservations de trajets effectuées par les clients" },
    "/direct-messages": { title: "Messages utilisateurs", subtitle: "Modération des messages directs entre utilisateurs" },
    "/admin-messages": { title: "Annonces (broadcast)", subtitle: "Messages envoyés depuis l'admin vers l'app mobile" },
    "/notifications": { title: "Notifications", subtitle: "Historique des notifications push" },
    "/audit": { title: "Journal d'audit", subtitle: "Trace immuable des actions sensibles" },
    "/settings": { title: "Paramètres", subtitle: "Compte admin, JWT, état du système" },
};

function getPageInfo(pathname: string) {
    if (routeTitles[pathname]) return routeTitles[pathname];
    const base = "/" + pathname.split("/").filter(Boolean)[0];
    return routeTitles[base] ?? { title: "Dashboard", subtitle: "" };
}

export function AdminHeader() {
    const { data: identity } = useGetIdentity<Identity>();
    const { mutate: logout } = useLogout();
    const location = useLocation();

    const { title, subtitle } = getPageInfo(location.pathname);

    const menuItems = [
        {
            key: "user-info",
            label: (
                <div style={{ padding: "4px 0" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: DARK.textPrimary }}>{identity?.name ?? "Admin"}</div>
                    <div style={{ fontSize: 12, color: DARK.textSecondary }}>{identity?.email ?? ""}</div>
                </div>
            ),
            disabled: true,
        },
        { type: "divider" as const },
        {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Paramètres",
        },
        { type: "divider" as const },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Déconnexion",
            danger: true,
        },
    ];

    return (
        <Header
            style={{
                background: DARK.cardBg,
                padding: "0 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 64,
                position: "sticky",
                top: 0,
                zIndex: 10,
                borderBottom: `1px solid ${DARK.border}`,
            }}
        >
            {/* Left — Page title + subtitle */}
            <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
                    {title}
                </div>
                {subtitle && (
                    <div style={{ fontSize: 13, color: "#A0A0B8", marginTop: 2 }}>
                        {subtitle}
                    </div>
                )}
            </div>

            {/* Right — Search + icons + user */}
            <Space size={16} align="center">
                {/* Search */}
                <Input
                    prefix={<SearchOutlined style={{ color: DARK.textMuted }} />}
                    placeholder="Rechercher..."
                    style={{
                        width: 220,
                        background: DARK.cardBgHover,
                        borderColor: "transparent",
                        borderRadius: 10,
                    }}
                />

                {/* Notification bell */}
                <div className="notification-bell" style={{ cursor: "pointer" }}>
                    <Badge count={3} size="small" offset={[-2, 2]}>
                        <BellOutlined
                            style={{ fontSize: 20, color: "#A0A0B8", transition: "color 0.2s" }}
                            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = DARK.accent; }}
                            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#A0A0B8"; }}
                        />
                    </Badge>
                </div>

                {/* Messages */}
                <MessageOutlined
                    style={{ fontSize: 20, color: "#A0A0B8", cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = DARK.accent; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#A0A0B8"; }}
                />

                {/* Settings */}
                <SettingOutlined
                    style={{ fontSize: 20, color: "#A0A0B8", cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = DARK.accent; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#A0A0B8"; }}
                />

                {/* User dropdown */}
                <Dropdown
                    menu={{
                        items: menuItems,
                        onClick: ({ key }) => {
                            if (key === "logout") logout();
                        },
                    }}
                    placement="bottomRight"
                    trigger={["click"]}
                >
                    <Space
                        style={{
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: 10,
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = DARK.cardBgHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <Avatar
                            src={identity?.avatar}
                            icon={!identity?.avatar && <UserOutlined />}
                            style={{ backgroundColor: DARK.accent }}
                            size={36}
                        />
                        <div style={{ lineHeight: 1.3 }}>
                            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
                                {identity?.name ?? "Admin"}
                            </span>
                            <span
                                style={{ display: "block", fontSize: 11, color: "#A0A0B8", textTransform: "capitalize" }}
                            >
                                {identity?.role?.replace("_", " ") ?? "admin"}
                            </span>
                        </div>
                    </Space>
                </Dropdown>
            </Space>
        </Header>
    );
}
