/**
 * UserAvatar has 3 rendering paths — image src, initials fallback, generic
 * person icon fallback — each appears in different parts of the admin
 * (table rows have an avatar URL, UserShow header strips to initials when
 * no photo, system-generated rows show the icon). The 3 branches drift
 * easily when refactoring, so we pin each one down.
 */

import { render, screen, within } from "@testing-library/react";
import { UserAvatar } from "@/components/common/UserAvatar";

describe("UserAvatar", () => {
    it("renders the user photo when src is provided", () => {
        const { container } = render(
            <UserAvatar src="https://cdn/avatar.png" name="Alice" />
        );
        const img = container.querySelector("img");
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "https://cdn/avatar.png");
    });

    it("falls back to 2-char uppercase initials when src missing but name present", () => {
        render(<UserAvatar name="alice martin" />);
        expect(screen.getByText("AM")).toBeInTheDocument();
    });

    it("truncates initials to 2 characters for long names", () => {
        render(<UserAvatar name="Alice Bob Charlie David" />);
        expect(screen.getByText("AB")).toBeInTheDocument();
    });

    it("renders only one initial for single-word names", () => {
        render(<UserAvatar name="Solo" />);
        expect(screen.getByText("S")).toBeInTheDocument();
    });

    it("renders the generic UserOutlined icon when neither src nor name provided", () => {
        const { container } = render(<UserAvatar />);
        // Ant Design's icon component renders an <span class="anticon"> wrapping
        // an SVG — assert via aria-label="user" set by UserOutlined.
        const icon = container.querySelector('[aria-label="user"]');
        expect(icon).toBeInTheDocument();
    });

    it("forwards the size prop", () => {
        const { container } = render(<UserAvatar name="X" size={80} />);
        const span = container.querySelector(".ant-avatar");
        expect(span).toHaveStyle({ width: "80px", height: "80px" });
    });
});
