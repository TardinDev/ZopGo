/**
 * Affichage formaté d'un prix en FCFA
 */

import { Typography } from "antd";
import { formatPrice } from "@/config/constants";

const { Text } = Typography;

interface PriceDisplayProps {
    amount: number | null | undefined;
    style?: React.CSSProperties;
}

export function PriceDisplay({ amount, style }: PriceDisplayProps) {
    return (
        <Text strong style={{ whiteSpace: "nowrap", ...style }}>
            {formatPrice(amount)}
        </Text>
    );
}
