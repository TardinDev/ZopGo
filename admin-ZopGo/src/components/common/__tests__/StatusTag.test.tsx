/**
 * StatusTag is used in every list page (trajets, livraisons, reservations,
 * UserShow tabs) to render a status string with the correct French label
 * + color. The mapping lives in src/config/constants.ts; this test pins
 * down the 4 supported `type` values and confirms the rendered text.
 *
 * Regression we're guarding against: adding a new resource (e.g.
 * 'reservation' added when the UserShow reservations tab landed) without
 * extending the StatusType union, which would silently fall back to the
 * raw status string in the UI.
 */

import { render, screen } from "@testing-library/react";
import { StatusTag } from "@/components/common/StatusTag";

describe("StatusTag", () => {
    it("maps trip statuses to their French label", () => {
        render(<StatusTag status="completed" type="trip" />);
        expect(screen.getByText("Terminé")).toBeInTheDocument();
    });

    it("maps delivery statuses to their French label", () => {
        render(<StatusTag status="in_transit" type="delivery" />);
        expect(screen.getByText(/En transit/i)).toBeInTheDocument();
    });

    it("maps trajet statuses to their French label", () => {
        render(<StatusTag status="en_attente" type="trajet" />);
        expect(screen.getByText(/En attente/i)).toBeInTheDocument();
    });

    it("maps reservation statuses (the universal Réservations tab depends on this)", () => {
        render(<StatusTag status="acceptee" type="reservation" />);
        expect(screen.getByText(/Acceptée/i)).toBeInTheDocument();
    });

    it("falls back to the raw status string when label is missing", () => {
        // Unknown status — should render the raw key instead of throwing,
        // so the admin can still see something instead of a blank cell.
        render(<StatusTag status="some_new_status" type="trip" />);
        expect(screen.getByText("some_new_status")).toBeInTheDocument();
    });

    it("defaults to type='trip' when type prop is omitted", () => {
        render(<StatusTag status="pending" />);
        expect(screen.getByText(/En attente/i)).toBeInTheDocument();
    });
});
