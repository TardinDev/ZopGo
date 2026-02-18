/**
 * ZopGo Admin — Header bar avec avatar utilisateur et logout
 */

import { Layout, Avatar, Dropdown, Space, Typography, theme } from "antd";
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";

const { Header } = Layout;
const { Text } = Typography;

interface Identity {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
    role?: string;
}

export function AdminHeader() {
    const { data: identity } = useGetIdentity<Identity>();
    const { mutate: logout } = useLogout();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const menuItems = [
        {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Paramètres",
        },
        {
            type: "divider" as const,
        },
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
                background: colorBgContainer,
                padding: "0 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                borderBottom: "1px solid #f0f0f0",
                height: 64,
                position: "sticky",
                top: 0,
                zIndex: 10,
            }}
        >
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
                <Space style={{ cursor: "pointer" }}>
                    <Avatar
                        src={identity?.avatar}
                        icon={!identity?.avatar && <UserOutlined />}
                        style={{ backgroundColor: "#2162FE" }}
                    />
                    <div style={{ lineHeight: 1.3 }}>
                        <Text strong style={{ display: "block", fontSize: 13 }}>
                            {identity?.name ?? "Admin"}
                        </Text>
                        <Text
                            type="secondary"
                            style={{ display: "block", fontSize: 11, textTransform: "capitalize" }}
                        >
                            {identity?.role?.replace("_", " ") ?? "admin"}
                        </Text>
                    </div>
                </Space>
            </Dropdown>
        </Header>
    );
}
