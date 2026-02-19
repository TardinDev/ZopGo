/**
 * ZopGo Admin — Page de connexion avec Clerk <SignIn />
 * Gère 3 états : pas connecté → SignIn, connecté admin → redirect, connecté non-admin → accès refusé
 */

import { useEffect } from "react";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { COLORS } from "@/config/constants";

export function LoginPage() {
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const navigate = useNavigate();

    const adminRole = user?.publicMetadata?.role as string | undefined;
    const isAdmin = adminRole === "admin" || adminRole === "super_admin";

    // If signed in as admin, redirect to dashboard
    useEffect(() => {
        if (authLoaded && userLoaded && isSignedIn && isAdmin) {
            navigate("/", { replace: true });
        }
    }, [authLoaded, userLoaded, isSignedIn, isAdmin, navigate]);

    // Still loading Clerk
    if (!authLoaded || !userLoaded) {
        return (
            <div style={containerStyle}>
                <Spin size="large" />
            </div>
        );
    }

    // Signed in but NOT admin → show forbidden message
    if (isSignedIn && !isAdmin) {
        return <ForbiddenView />;
    }

    // Not signed in → show Clerk SignIn
    return (
        <div style={containerStyle}>
            <LogoHeader />
            <SignIn
                appearance={{
                    variables: {
                        colorPrimary: COLORS.primary,
                        fontFamily: "'Inter', sans-serif",
                    },
                    elements: {
                        card: {
                            borderRadius: "16px",
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                        },
                    },
                }}
                routing="path"
                path="/login"
                forceRedirectUrl="/"
            />
        </div>
    );
}

function LogoHeader() {
    return (
        <div style={{ textAlign: "center", marginBottom: 32, color: "#fff" }}>
            <h1
                style={{
                    fontSize: 40,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: "-0.02em",
                }}
            >
                Zop<span style={{ color: COLORS.yellow }}>Go</span>
            </h1>
            <p style={{ fontSize: 16, opacity: 0.85, marginTop: 8, fontWeight: 400 }}>
                Dashboard Administration
            </p>
        </div>
    );
}

function ForbiddenView() {
    const { signOut } = useAuth();

    return (
        <div style={containerStyle}>
            <LogoHeader />
            <div
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: "48px 40px",
                    textAlign: "center",
                    maxWidth: 420,
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                }}
            >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
                <h2 style={{ margin: "0 0 8px", fontSize: 22, color: COLORS.gray[800] }}>
                    Accès refusé
                </h2>
                <p style={{ color: COLORS.gray[500], fontSize: 14, marginBottom: 24 }}>
                    Votre compte n'a pas les droits administrateur pour accéder à ce dashboard.
                    Contactez un super administrateur.
                </p>
                <button
                    onClick={() => signOut()}
                    style={{
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 24px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}

const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    padding: 24,
};
