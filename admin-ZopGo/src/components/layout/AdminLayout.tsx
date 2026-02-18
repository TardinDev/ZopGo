/**
 * ZopGo Admin — Layout principal avec sidebar et header
 */

import React from "react";
import { Layout, theme } from "antd";
import { AdminSider } from "./AdminSider";
import { AdminHeader } from "./AdminHeader";

const { Content } = Layout;

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <AdminSider />
            <Layout>
                <AdminHeader />
                <Content
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        minHeight: 280,
                        overflow: "auto",
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
