/**
 * ZopGo Admin — Sidebar navigation
 */

import { useState } from "react";
import { Layout, Menu, type MenuProps } from "antd";
import {
    DashboardOutlined,
    TeamOutlined,
    CarOutlined,
    ShoppingOutlined,
    GlobalOutlined,
    BellOutlined,
    AuditOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS } from "@/config/constants";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
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
    {
        type: "divider",
    },
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
    {
        key: "/vehicles",
        icon: <CarOutlined />,
        label: "Véhicules",
    },
    {
        type: "divider",
    },
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
];

export function AdminSider() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Determine selected key from current path
    const selectedKey =
        menuItems.find(
            (item) =>
                item &&
                "key" in item &&
                item.key !== "/" &&
                location.pathname.startsWith(item.key as string)
        )?.key as string ?? (location.pathname === "/" ? "/" : "");

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            style={{
                overflow: "auto",
                height: "100vh",
                position: "sticky",
                top: 0,
                left: 0,
                background: "#fff",
                borderRight: "1px solid #f0f0f0",
            }}
            theme="light"
            width={260}
        >
            {/* Logo */}
            <div
                style={{
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                }}
                onClick={() => navigate("/")}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: collapsed ? 20 : 24,
                        fontWeight: 700,
                        color: COLORS.primary,
                        letterSpacing: "-0.02em",
                        transition: "font-size 0.2s",
                    }}
                >
                    {collapsed ? "Z" : "ZopGo"}
                </h2>
                {!collapsed && (
                    <span
                        style={{
                            fontSize: 12,
                            color: COLORS.gray[400],
                            marginLeft: 8,
                            fontWeight: 500,
                        }}
                    >
                        Admin
                    </span>
                )}
            </div>

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                style={{ borderRight: 0, paddingTop: 8 }}
                onClick={({ key }) => navigate(key)}
            />
        </Sider>
    );
}
