/**
 * ZopGo Admin — Création d'un trajet
 *
 * Permet à l'administration de publier un trajet au nom d'un chauffeur. Le
 * trajet apparaît immédiatement dans l'application mobile : la recherche
 * client lit la même table, filtrée sur `deleted_at IS NULL`.
 *
 * Rendu possible par la migration 042, qui accorde l'insertion à
 * l'administration. Les policies ordinaires exigent que `chauffeur_id`
 * corresponde au compte connecté ; seul le claim `admin_role` y échappe.
 */

import { Create, useForm, useSelect } from "@refinedev/antd";
import {
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Row,
    Col,
    Typography,
} from "antd";
import type { DbTrajet, DbProfile } from "@/types";
import { buildTrajetPayload, type TrajetFormValues } from "./payload";

const { Text } = Typography;

/** Valeurs observées en base, et celles que propose l'application mobile. */
const VEHICULE_OPTIONS = [
    { value: "voiture", label: "Voiture" },
    { value: "taxi", label: "Taxi" },
    { value: "bus", label: "Bus" },
    { value: "camionnette", label: "Camionnette" },
    { value: "moto", label: "Moto" },
];

const ROLE_HINT: Record<string, string> = {
    chauffeur: "chauffeur",
    client: "client",
    hebergeur: "hébergeur",
    agence: "agence",
};

export function TrajetCreate() {
    const { formProps, saveButtonProps, onFinish } = useForm<DbTrajet>({
        resource: "trajets",
        action: "create",
        redirect: "list",
    });

    // Le sélecteur exclut les profils supprimés. Un trajet rattaché à un profil
    // soft-deleté s'affiche sans nom de chauffeur côté mobile : la jointure
    // publique filtre sur `deleted_at IS NULL`, contrairement à la vue admin.
    //
    // Aucun filtre sur le rôle : depuis la migration 024, tout compte détient
    // les trois rôles. Filtrer sur `role = 'chauffeur'` masquerait la majorité
    // des candidats valides — 10 profils sur 14 au moment d'écrire ceci.
    const { selectProps: chauffeurSelectProps } = useSelect<DbProfile>({
        resource: "profiles",
        optionLabel: (item) =>
            `${item.name} — ${ROLE_HINT[item.role] ?? item.role}`,
        optionValue: "id",
        filters: [{ field: "deleted_at", operator: "null", value: true }],
        onSearch: (value) => [
            { field: "name", operator: "contains", value },
        ],
        pagination: { mode: "server", pageSize: 20 },
    });

    const handleFinish = (values: TrajetFormValues) => onFinish(buildTrajetPayload(values));

    return (
        <Create saveButtonProps={saveButtonProps} title="Créer un trajet">
            <Form
                {...formProps}
                layout="vertical"
                style={{ maxWidth: 860 }}
                onFinish={(values) => handleFinish(values as TrajetFormValues)}
            >
                <Form.Item
                    label="Chauffeur"
                    name="chauffeur_id"
                    rules={[{ required: true, message: "Choisissez un chauffeur" }]}
                    extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Le trajet sera publié au nom de ce chauffeur et
                            visible immédiatement dans l'application.
                        </Text>
                    }
                >
                    <Select
                        {...chauffeurSelectProps}
                        showSearch
                        placeholder="Rechercher par nom"
                    />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Ville de départ"
                            name="ville_depart"
                            rules={[{ required: true, message: "Ville de départ requise" }]}
                        >
                            <Input placeholder="Libreville" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Ville d'arrivée"
                            name="ville_arrivee"
                            rules={[{ required: true, message: "Ville d'arrivée requise" }]}
                        >
                            <Input placeholder="Port-Gentil" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            label="Véhicule"
                            name="vehicule"
                            rules={[{ required: true, message: "Type de véhicule requis" }]}
                        >
                            <Select options={VEHICULE_OPTIONS} placeholder="Voiture" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            label="Prix (Fcfa)"
                            name="prix"
                            rules={[{ required: true, message: "Prix requis" }]}
                        >
                            <InputNumber min={0} step={500} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            label="Places disponibles"
                            name="places_disponibles"
                            rules={[{ required: true, message: "Nombre de places requis" }]}
                        >
                            <InputNumber min={1} max={60} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Date et heure du départ" name="date">
                    <DatePicker
                        showTime={{ format: "HH:mm" }}
                        format="DD/MM/YYYY HH:mm"
                        style={{ width: "100%" }}
                        placeholder="Optionnel"
                    />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Immatriculation" name="immatriculation">
                            <Input placeholder="Optionnel" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Modèle" name="modele">
                            <Input placeholder="Optionnel" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Couleur" name="couleur">
                            <Input placeholder="Optionnel" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Create>
    );
}
