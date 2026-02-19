/**
 * ZopGo Admin — Dark sidebar navigation (Dribbble-inspired)
 */

import { useState } from "react";
import { Layout, Menu, type MenuProps, Tooltip } from "antd";
import {
    DashboardOutlined,
    TeamOutlined,
    CarOutlined,
    ShoppingOutlined,
    GlobalOutlined,
    BellOutlined,
    AuditOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { SIDEBAR, DARK } from "@/config/constants";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const buildMenuItems = (collapsed: boolean): MenuItem[] => [
    {
        key: "section-principal",
        type: "group",
        label: collapsed ? null : (
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: DARK.textMuted }}>
                Menu Principal
            </span>
        ),
        children: [
            {
                key: "/",
                icon: <DashboardOutlined />,
                label: "Tableau de bord",
            },
            {
                key: "/users",
                icon: <TeamOutlined />,
                label: "Utilisateurs",
            },
        ],
    },
    {
        key: "section-services",
        type: "group",
        label: collapsed ? null : (
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: DARK.textMuted }}>
                Services
            </span>
        ),
        children: [
            {
                key: "/trips",
                icon: <CarOutlined />,
                label: "Courses — ZopRide",
            },
            {
                key: "/deliveries",
                icon: <ShoppingOutlined />,
                label: "Livraisons — ZopDelivery",
            },
            {
                key: "/trajets",
                icon: <GlobalOutlined />,
                label: "Voyages — ZopTravel",
            },
        ],
    },
    {
        key: "section-systeme",
        type: "group",
        label: collapsed ? null : (
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: DARK.textMuted }}>
                Système
            </span>
        ),
        children: [
            {
                key: "/notifications",
                icon: <BellOutlined />,
                label: "Notifications",
            },
            {
                key: "/audit",
                icon: <AuditOutlined />,
                label: "Journal d'audit",
            },
            {
                key: "/settings",
                icon: <SettingOutlined />,
                label: "Paramètres",
            },
        ],
    },
];

export function AdminSider() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = buildMenuItems(collapsed);

    const allItems = menuItems.flatMap((group) => {
        if (group && "children" in group && group.children) {
            return group.children;
        }
        return [];
    });

    const selectedKey =
        allItems.find(
            (item) =>
                item &&
                "key" in item &&
                item.key !== "/" &&
                location.pathname.startsWith(item.key as string)
        )?.key as string ?? (location.pathname === "/" ? "/" : "");

    return (
        <Sider
            className="admin-sider"
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            style={{
                overflow: "auto",
                height: "100vh",
                position: "sticky",
                top: 0,
                left: 0,
                background: SIDEBAR.bg,
                borderRight: `1px solid ${DARK.border}`,
            }}
            width={SIDEBAR.width}
            collapsedWidth={SIDEBAR.collapsedWidth}
        >
            {/* Logo */}
            <div
                style={{
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? 0 : "0 24px",
                    borderBottom: `1px solid ${DARK.border}`,
                    cursor: "pointer",
                }}
                onClick={() => navigate("/")}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: DARK.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <span style={{ color: "#13112B", fontWeight: 800, fontSize: 16 }}>Z</span>
                </div>
                {!collapsed && (
                    <span
                        style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: DARK.textPrimary,
                            marginLeft: 12,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        ZopGo
                    </span>
                )}
            </div>

            {/* Menu */}
            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                style={{
                    background: "transparent",
                    borderRight: 0,
                    paddingTop: 8,
                    color: SIDEBAR.text,
                }}
                onClick={({ key }) => navigate(key)}
            />

            {/* Footer: collapse toggle */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderTop: `1px solid ${DARK.border}`,
                    padding: collapsed ? "12px 0" : "12px 16px",
                    display: "flex",
                    alignItems: collapsed ? "center" : "stretch",
                    justifyContent: collapsed ? "center" : "flex-start",
                }}
            >
                <div
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: 10,
                        padding: "8px 8px",
                        borderRadius: 10,
                        cursor: "pointer",
                        color: DARK.textSecondary,
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = DARK.cardBgHover;
                        e.currentTarget.style.color = DARK.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = DARK.textSecondary;
                    }}
                >
                    {collapsed ? (
                        <Tooltip title="Déplier" placement="right">
                            <MenuUnfoldOutlined style={{ fontSize: 16 }} />
                        </Tooltip>
                    ) : (
                        <>
                            <MenuFoldOutlined style={{ fontSize: 16 }} />
                            <span style={{ fontSize: 13 }}>Réduire</span>
                        </>
                    )}
                </div>
            </div>
        </Sider>
    );
}
