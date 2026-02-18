/**
 * Avatar utilisateur avec fallback (initiales ou icône)
 */

import { Avatar, type AvatarProps } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { COLORS } from "@/config/constants";

interface UserAvatarProps extends Omit<AvatarProps, "src" | "icon"> {
    src?: string | null;
    name?: string | null;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function UserAvatar({ src, name, size = 40, ...rest }: UserAvatarProps) {
    if (src) {
        return <Avatar src={src} size={size} {...rest} />;
    }

    if (name) {
        return (
            <Avatar
                size={size}
                style={{ backgroundColor: COLORS.primary, fontWeight: 600 }}
                {...rest}
            >
                {getInitials(name)}
            </Avatar>
        );
    }

    return (
        <Avatar
            size={size}
            icon={<UserOutlined />}
            style={{ backgroundColor: COLORS.gray[300] }}
            {...rest}
        />
    );
}
