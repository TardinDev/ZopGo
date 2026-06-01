/**
 * ZopGo Admin — Modération des avis logement
 *
 * Lecture de TOUS les avis (masqués compris, via la policy admin). Masquer
 * un avis le retire de l'app mobile pour tout le monde (soft-delete RLS,
 * réversible). Réutilise hideMessagePayload — même schéma deleted_at +
 * hidden_by_admin que la modération des messages directs.
 */

import { List, useTable } from "@refinedev/antd";
import {
    Table,
    Space,
    Tag,
    Typography,
    Avatar,
    Rate,
    Button,
    Popconfirm,
    message as antdMessage,
} from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useUpdate } from "@refinedev/core";
import dayjs from "dayjs";
import { DARK } from "@/config/constants";
import { hideMessagePayload } from "@/pages/direct-messages/moderation";
import type { DbHebergementReview } from "@/types";

const { Text, Paragraph } = Typography;

export function ReviewList() {
    const { tableProps } = useTable<DbHebergementReview>({
        resource: "hebergement_reviews",
        sorters: { initial: [{ field: "created_at", order: "desc" }] },
        meta: {
            select:
                "*, client:client_id(id, name, avatar), hebergement:hebergement_id(id, nom, ville)",
        },
        pagination: { pageSize: 20 },
    });
    const { mutate: update } = useUpdate();

    const toggleHide = (r: DbHebergementReview) => {
        const hide = !r.deleted_at;
        update(
            {
                resource: "hebergement_reviews",
                id: r.id,
                values: hideMessagePayload(hide, new Date().toISOString()),
            },
            {
                onSuccess: () =>
                    antdMessage.success(hide ? "Avis masqué" : "Avis réaffiché"),
            }
        );
    };

    return (
        <List title="Avis logements (modération)">
            <Table {...tableProps} rowKey="id" size="middle" scroll={{ x: 1000 }}>
                <Table.Column<DbHebergementReview>
                    title="Hébergement"
                    width={200}
                    render={(_, r) => (
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {r.hebergement?.nom ?? "—"}
                            </div>
                            <Text style={{ fontSize: 12, color: DARK.textSecondary }}>
                                {r.hebergement?.ville ?? ""}
                            </Text>
                        </div>
                    )}
                />
                <Table.Column<DbHebergementReview>
                    title="Client"
                    width={180}
                    render={(_, r) => (
                        <Space>
                            <Avatar size={28} src={r.client?.avatar}>
                                {r.client?.name?.[0] ?? "?"}
                            </Avatar>
                            <Text>{r.client?.name ?? "—"}</Text>
                        </Space>
                    )}
                />
                <Table.Column<DbHebergementReview>
                    title="Note"
                    dataIndex="rating"
                    width={130}
                    render={(n: number) => <Rate disabled value={n} style={{ fontSize: 13 }} />}
                />
                <Table.Column<DbHebergementReview>
                    title="Commentaire"
                    dataIndex="comment"
                    render={(c: string, r) => (
                        <Space direction="vertical" size={2}>
                            {r.deleted_at && (
                                <Tag color="red" style={{ margin: 0 }}>
                                    Masqué
                                </Tag>
                            )}
                            <Paragraph
                                ellipsis={{ rows: 2, expandable: true, symbol: "voir" }}
                                style={{
                                    margin: 0,
                                    fontSize: 13,
                                    color: DARK.textPrimary,
                                    opacity: r.deleted_at ? 0.55 : 1,
                                }}>
                                {c || "—"}
                            </Paragraph>
                        </Space>
                    )}
                />
                <Table.Column<DbHebergementReview>
                    title="Date"
                    dataIndex="created_at"
                    width={140}
                    sorter
                    render={(d) => dayjs(d).format("DD/MM/YY HH:mm")}
                />
                <Table.Column<DbHebergementReview>
                    title="Action"
                    key="action"
                    width={140}
                    fixed="right"
                    render={(_, r) => (
                        <Popconfirm
                            title={r.deleted_at ? "Réafficher cet avis ?" : "Masquer cet avis ?"}
                            onConfirm={() => toggleHide(r)}>
                            <Button
                                size="small"
                                danger={!r.deleted_at}
                                icon={r.deleted_at ? <EyeOutlined /> : <EyeInvisibleOutlined />}>
                                {r.deleted_at ? "Réafficher" : "Masquer"}
                            </Button>
                        </Popconfirm>
                    )}
                />
            </Table>
        </List>
    );
}
