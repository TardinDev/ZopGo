/**
 * ZopGo Admin — Liste des utilisateurs (dark theme)
 */

import {
    List,
    useTable,
    FilterDropdown,
    ShowButton,
    EditButton,
} from "@refinedev/antd";
import { Table, Space, Input, Select, Rate, Badge, DatePicker, Row, Col, Tag } from "antd";
import { TeamOutlined, CarOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { UserAvatar } from "@/components/common/UserAvatar";
import { USER_ROLE_LABELS, DARK } from "@/config/constants";
import type { DbProfile } from "@/types";

const { RangePicker } = DatePicker;

export function UserList() {
    const { tableProps } = useTable<DbProfile>({
        resource: "profiles",
        sorters: {
            initial: [{ field: "created_at", order: "desc" }],
        },
        filters: {
            initial: [],
        },
    });

    const total = tableProps.pagination && typeof tableProps.pagination === "object"
        ? (tableProps.pagination as { total?: number }).total ?? 0
        : 0;

    const statCards = [
        {
            label: "Total utilisateurs",
            value: total,
            icon: <TeamOutlined style={{ fontSize: 20, color: DARK.accent }} />,
            iconBg: "rgba(124, 92, 252, 0.15)",
        },
        {
            label: "Chauffeurs actifs",
            value: "—",
            icon: <CarOutlined style={{ fontSize: 20, color: DARK.success }} />,
            iconBg: "rgba(16, 185, 129, 0.15)",
        },
        {
            label: "Nouveaux ce mois",
            value: "—",
            icon: <CalendarOutlined style={{ fontSize: 20, color: DARK.accent }} />,
            iconBg: "rgba(124, 92, 252, 0.15)",
        },
    ];

    return (
        <List title="Utilisateurs">
            {/* Stats bar */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                {statCards.map((stat) => (
                    <Col xs={24} sm={8} key={stat.label}>
                        <div className="stat-mini-card">
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: stat.iconBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: DARK.textSecondary, fontWeight: 500 }}>
                                    {stat.label}
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: DARK.textPrimary, lineHeight: 1.2 }}>
                                    {stat.value}
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            <Table
                {...tableProps}
                rowKey="id"
                scroll={{ x: 1000 }}
                size="middle"
            >
                {/* Avatar + Nom */}
                <Table.Column<DbProfile>
                    title="Utilisateur"
                    dataIndex="name"
                    key="name"
                    width={250}
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Input placeholder="Rechercher un nom…" />
                        </FilterDropdown>
                    )}
                    render={(name, record) => (
                        <Space>
                            <UserAvatar src={record.avatar} name={record.name} size={36} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14, color: DARK.textPrimary }}>{name}</div>
                                <div style={{ fontSize: 12, color: DARK.textSecondary }}>
                                    {record.email}
                                </div>
                            </div>
                            {record.deleted_at && (
                                <Badge
                                    count="Suspendu"
                                    style={{
                                        backgroundColor: DARK.error,
                                        fontSize: 10,
                                    }}
                                />
                            )}
                        </Space>
                    )}
                />

                {/* Téléphone */}
                <Table.Column<DbProfile>
                    title="Téléphone"
                    dataIndex="phone"
                    key="phone"
                    width={140}
                    render={(phone) => (
                        <span style={{ color: DARK.textSecondary }}>{phone || "—"}</span>
                    )}
                />

                {/* Rôle */}
                <Table.Column<DbProfile>
                    title="Rôle"
                    dataIndex="role"
                    key="role"
                    width={120}
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Select
                                placeholder="Filtrer par rôle"
                                style={{ width: 160 }}
                                allowClear
                                options={[
                                    { value: "client", label: "Client" },
                                    { value: "chauffeur", label: "Chauffeur" },
                                ]}
                            />
                        </FilterDropdown>
                    )}
                    render={(role: string) => (
                        <Tag
                            color={role === "chauffeur" ? "blue" : "green"}
                            style={{ borderRadius: 6, fontWeight: 500 }}
                        >
                            {USER_ROLE_LABELS[role] ?? role}
                        </Tag>
                    )}
                />

                {/* Rating */}
                <Table.Column<DbProfile>
                    title="Note"
                    dataIndex="rating"
                    key="rating"
                    width={160}
                    sorter
                    render={(rating: number) => (
                        <Rate disabled defaultValue={rating} allowHalf style={{ fontSize: 14 }} />
                    )}
                />

                {/* Courses totales */}
                <Table.Column<DbProfile>
                    title="Courses"
                    dataIndex="total_trips"
                    key="total_trips"
                    width={90}
                    sorter
                    align="center"
                />

                {/* Disponible */}
                <Table.Column<DbProfile>
                    title="Dispo"
                    dataIndex="disponible"
                    key="disponible"
                    width={80}
                    align="center"
                    render={(disponible: boolean, record) => {
                        if (record.role !== "chauffeur") return <span style={{ color: DARK.textMuted }}>—</span>;
                        return (
                            <Badge
                                status={disponible ? "success" : "default"}
                                text={disponible ? "Oui" : "Non"}
                            />
                        );
                    }}
                />

                {/* Date d'inscription */}
                <Table.Column<DbProfile>
                    title="Inscrit le"
                    dataIndex="member_since"
                    key="member_since"
                    width={130}
                    sorter
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <RangePicker />
                        </FilterDropdown>
                    )}
                    render={(date: string) => (
                        <span style={{ color: DARK.textSecondary }}>
                            {dayjs(date).format("DD/MM/YYYY")}
                        </span>
                    )}
                />

                {/* Actions */}
                <Table.Column<DbProfile>
                    title="Actions"
                    key="actions"
                    width={130}
                    fixed="right"
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={record.id} />
                            <EditButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}
