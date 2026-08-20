/**
 * ZopGo Admin — Création d'un hébergement
 *
 * Publie un logement au nom d'un hébergeur. Il apparaît immédiatement dans
 * l'application : la découverte client lit la même table, filtrée sur
 * `deleted_at IS NULL`.
 *
 * Rendu possible par la migration 042. Les champs reprennent ceux de l'écran
 * d'édition, augmentés du sélecteur d'hébergeur — absent à l'édition puisque
 * le propriétaire d'un logement ne change pas.
 */

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Typography } from "antd";
import {
    HEBERGEMENT_TYPE_LABELS,
    HEBERGEMENT_STATUS_LABELS,
    GABON_CITIES,
} from "@/config/constants";
import type { DbHebergement, DbProfile } from "@/types";
import {
    buildHebergementPayload,
    type HebergementFormValues,
} from "./payload";

const { TextArea } = Input;
const { Text } = Typography;

const ROLE_HINT: Record<string, string> = {
    hebergeur: "hébergeur",
    client: "client",
    chauffeur: "chauffeur",
    agence: "agence",
};

export function HebergementCreate() {
    const { formProps, saveButtonProps, onFinish } = useForm<DbHebergement>({
        resource: "hebergements",
        action: "create",
        redirect: "list",
    });

    // Exclut les profils supprimés : un logement rattaché à un profil
    // soft-deleté s'afficherait sans nom d'hôte côté mobile, la jointure
    // publique les écartant. Aucun filtre sur le rôle — depuis la migration
    // 024 tout compte détient les trois.
    const { selectProps: hebergeurSelectProps } = useSelect<DbProfile>({
        resource: "profiles",
        optionLabel: (item) =>
            `${item.name} — ${ROLE_HINT[item.role] ?? item.role}`,
        optionValue: "id",
        filters: [{ field: "deleted_at", operator: "null", value: true }],
        onSearch: (value) => [{ field: "name", operator: "contains", value }],
        pagination: { mode: "server", pageSize: 20 },
    });

    const handleFinish = (values: HebergementFormValues) =>
        onFinish(buildHebergementPayload(values));

    return (
        <Create saveButtonProps={saveButtonProps} title="Créer un hébergement">
            <Form
                {...formProps}
                layout="vertical"
                style={{ maxWidth: 600 }}
                initialValues={{ status: "actif", capacite: 1, disponibilite: 0 }}
                onFinish={(values) =>
                    handleFinish(values as HebergementFormValues)
                }
            >
                <Form.Item
                    label="Hébergeur"
                    name="hebergeur_id"
                    rules={[{ required: true, message: "Choisissez un hébergeur" }]}
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Le logement sera publié au nom de cet hébergeur et
                            visible immédiatement dans l'application.
                        </Text>
                    }
                >
                    <Select
                        {...hebergeurSelectProps}
                        showSearch
                        placeholder="Rechercher par nom"
                    />
                </Form.Item>

                <Form.Item
                    label="Nom"
                    name="nom"
                    rules={[{ required: true, message: "Le nom est requis" }]}
                >
                    <Input placeholder="Villa des Palmiers" />
                </Form.Item>

                <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                    <Select
                        options={Object.entries(HEBERGEMENT_TYPE_LABELS).map(
                            ([value, label]) => ({ value, label })
                        )}
                    />
                </Form.Item>

                <Form.Item label="Ville" name="ville" rules={[{ required: true }]}>
                    <Select
                        showSearch
                        options={GABON_CITIES.map((c) => ({ value: c, label: c }))}
                    />
                </Form.Item>

                <Form.Item label="Adresse" name="adresse">
                    <Input placeholder="Optionnel" />
                </Form.Item>

                <Form.Item
                    label="Prix par nuit (FCFA)"
                    name="prix_par_nuit"
                    rules={[{ required: true, message: "Le prix est requis" }]}
                >
                    <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Capacité" name="capacite">
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Disponibilité (nombre de places ouvertes)"
                    name="disponibilite"
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Statut" name="status" rules={[{ required: true }]}>
                    <Select
                        options={Object.entries(HEBERGEMENT_STATUS_LABELS).map(
                            ([value, label]) => ({ value, label })
                        )}
                    />
                </Form.Item>

                <Form.Item label="Description" name="description">
                    <TextArea rows={4} placeholder="Optionnel" />
                </Form.Item>
            </Form>
        </Create>
    );
}
