/**
 * ZopGo Admin — Édition d'un hébergement
 *
 * Lets an admin correct a mis-listed property (wrong city, price, type)
 * or deactivate it (status → inactif) without going through the mobile
 * hébergeur flow. Mirrors the field set of the mobile publish form.
 */

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, InputNumber } from "antd";
import {
    HEBERGEMENT_TYPE_LABELS,
    HEBERGEMENT_STATUS_LABELS,
    GABON_CITIES,
} from "@/config/constants";
import type { DbHebergement } from "@/types";

const { TextArea } = Input;

export function HebergementEdit() {
    const { formProps, saveButtonProps } = useForm<DbHebergement>({
        resource: "hebergements",
    });

    return (
        <Edit saveButtonProps={saveButtonProps} title="Modifier hébergement">
            <Form {...formProps} layout="vertical" style={{ maxWidth: 600 }}>
                <Form.Item
                    label="Nom"
                    name="nom"
                    rules={[{ required: true, message: "Le nom est requis" }]}
                >
                    <Input />
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
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Prix par nuit (FCFA)"
                    name="prix_par_nuit"
                    rules={[{ required: true, message: "Le prix est requis" }]}
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Capacité" name="capacite">
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Disponibilité (nombre de places)"
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
                    <TextArea rows={4} />
                </Form.Item>
            </Form>
        </Edit>
    );
}
