/**
 * ZopGo Admin — Page de connexion avec Clerk <SignIn />
 */

import { SignIn } from "@clerk/clerk-react";
import { COLORS } from "@/config/constants";

export function LoginPage() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                padding: 24,
            }}
        >
            {/* Logo / Titre */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: 32,
                    color: "#fff",
                }}
            >
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
                <p
                    style={{
                        fontSize: 16,
                        opacity: 0.85,
                        marginTop: 8,
                        fontWeight: 400,
                    }}
                >
                    Dashboard Administration
                </p>
            </div>

            {/* Composant Clerk SignIn */}
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
                signUpUrl="/login"
                afterSignInUrl="/"
            />
        </div>
    );
}
