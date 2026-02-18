/**
 * ZopGo Admin — Liste des utilisateurs
 * Table avec filtres, pagination serveur, et badges
 */

import {
    List,
    useTable,
    FilterDropdown,
    ShowButton,
    EditButton,
    TagField,
} from "@refinedev/antd";
import { Table, Space, Input, Select, Rate, Badge, DatePicker } from "antd";
import dayjs from "dayjs";
import { UserAvatar } from "@/components/common/UserAvatar";
import { USER_ROLE_LABELS, COLORS } from "@/config/constants";
import type { DbProfile } from "@/types";

const { RangePicker } = DatePicker;

export function UserList() {
    const { tableProps, filters } = useTable<DbProfile>({
        resource: "profiles",
        sorters: {
            initial: [{ field: "created_at", order: "desc" }],
        },
        filters: {
            initial: [],
        },
    });

    return (
        <List title="Utilisateurs">
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
                                <div style={{ fontWeight: 500 }}>{name}</div>
                                <div style={{ fontSize: 12, color: COLORS.gray[400] }}>
                                    {record.email}
                                </div>
                            </div>
                            {record.deleted_at && (
                                <Badge
                                    count="Suspendu"
                                    style={{
                                        backgroundColor: COLORS.error,
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
                    render={(phone) => phone || "—"}
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
                        <TagField
                            value={USER_ROLE_LABELS[role] ?? role}
                            color={role === "chauffeur" ? "blue" : "default"}
                        />
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
                        if (record.role !== "chauffeur") return "—";
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
                    render={(date: string) => dayjs(date).format("DD/MM/YYYY")}
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
