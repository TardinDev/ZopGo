/**
 * Tag coloré par statut (courses, livraisons, trajets)
 */

import { Tag } from "antd";
import { STATUS_COLORS, TRIP_STATUS_LABELS, DELIVERY_STATUS_LABELS, TRAJET_STATUS_LABELS } from "@/config/constants";

type StatusType = "trip" | "delivery" | "trajet";

interface StatusTagProps {
    status: string;
    type?: StatusType;
}

const LABELS_MAP: Record<StatusType, Record<string, string>> = {
    trip: TRIP_STATUS_LABELS,
    delivery: DELIVERY_STATUS_LABELS,
    trajet: TRAJET_STATUS_LABELS,
};

export function StatusTag({ status, type = "trip" }: StatusTagProps) {
    const color = STATUS_COLORS[status] ?? "default";
    const label = LABELS_MAP[type]?.[status] ?? status;

    return <Tag color={color}>{label}</Tag>;
}
