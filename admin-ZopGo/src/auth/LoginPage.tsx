/**
 * ZopGo Admin — Page de connexion
 * Layout split-screen avec phone mockup montrant le splash de l'app mobile à gauche,
 * formulaire Clerk SignIn à droite. Pas de couleur jaune — bleu primaire ZopGo.
 */

import { useEffect } from "react";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import splashMobile from "@/assets/splash-mobile.png";
import librevilleBg from "@/assets/libreville-bg.jpg";

const BRAND_PRIMARY = "#2162FE";
const BRAND_DARK = "#0B1224";
const BRAND_DARKER = "#070C1A";

export function LoginPage() {
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const navigate = useNavigate();

    const adminRole = user?.publicMetadata?.role as string | undefined;
    const isAdmin = adminRole === "admin";

    useEffect(() => {
        if (authLoaded && userLoaded && isSignedIn && isAdmin) {
            navigate("/", { replace: true });
        }
    }, [authLoaded, userLoaded, isSignedIn, isAdmin, navigate]);

    if (!authLoaded || !userLoaded) {
        return (
            <div style={fullPageCenterStyle}>
                <Spin size="large" />
            </div>
        );
    }

    if (isSignedIn && !isAdmin) {
        return <ForbiddenView />;
    }

    return (
        <div style={pageStyle}>
            <BrandPanel />
            <FormPanel />
        </div>
    );
}

// ─── Brand panel (gauche) — phone mockup + features ──────────
function BrandPanel() {
    return (
        <aside style={brandPanelStyle} className="zopgo-brand-panel">
            <div style={brandOverlayStyle} />

            <div style={brandContentStyle}>
                <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <LogoMark size={36} />
                    <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                        ZopGo
                    </span>
                </header>

                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
                    <PhoneMockup />
                </div>

                <div>
                    <h2 style={brandHeadlineStyle}>
                        L'admin ZopGo, propre et concentré.
                    </h2>
                    <p style={brandSubheadlineStyle}>
                        Pilote utilisateurs, trajets, livraisons et hébergements depuis un seul endroit.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
                        <FeaturePill>Modération users</FeaturePill>
                        <FeaturePill>Annonces broadcast</FeaturePill>
                        <FeaturePill>Audit log</FeaturePill>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function PhoneMockup() {
    return (
        <div style={phoneFrameStyle}>
            <div style={phoneNotchStyle} />
            <img
                src={splashMobile}
                alt="ZopGo app splash screen"
                style={phoneScreenStyle}
            />
        </div>
    );
}

function FeaturePill({ children }: { children: React.ReactNode }) {
    return (
        <span style={featurePillStyle}>{children}</span>
    );
}

function LogoMark({ size = 32 }: { size?: number }) {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: size * 0.25,
                background: BRAND_PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: size * 0.5,
                letterSpacing: "-0.05em",
                boxShadow: `0 6px 20px rgba(33, 98, 254, 0.45)`,
            }}
        >
            Z
        </div>
    );
}

// ─── Form panel (droite) — Clerk SignIn ──────────────────────
function FormPanel() {
    return (
        <main style={formPanelStyle}>
            <header
                className="zopgo-mobile-only-logo"
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}
            >
                <LogoMark size={30} />
                <span style={{ fontSize: 17, fontWeight: 700, color: BRAND_DARK, letterSpacing: "-0.02em" }}>
                    ZopGo
                </span>
            </header>

            <div style={formCenterStyle}>
                <div style={formInnerStyle}>
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={titleStyle}>Bienvenue</h1>
                        <p style={subtitleStyle}>
                            Connectez-vous à votre compte administrateur ZopGo.
                        </p>
                    </div>

                    <SignIn
                        appearance={{
                            variables: {
                                colorPrimary: BRAND_PRIMARY,
                                colorText: BRAND_DARK,
                                colorTextSecondary: "#6B7280",
                                colorInputBackground: "#fff",
                                colorInputText: BRAND_DARK,
                                colorBackground: "transparent",
                                borderRadius: "10px",
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                                spacingUnit: "1rem",
                            },
                            elements: {
                                rootBox: { width: "100%" },
                                card: {
                                    boxShadow: "none",
                                    background: "transparent",
                                    padding: 0,
                                    border: "none",
                                    margin: 0,
                                    width: "100%",
                                },
                                header: { display: "none" },
                                headerTitle: { display: "none" },
                                headerSubtitle: { display: "none" },
                                footer: { display: "none" },
                                socialButtonsBlockButton: {
                                    borderRadius: 10,
                                    border: "1px solid #E5E7EB",
                                    height: 44,
                                    fontSize: 14,
                                    fontWeight: 500,
                                },
                                socialButtonsBlockButtonText: { fontSize: 14, fontWeight: 500 },
                                dividerLine: { background: "#E5E7EB" },
                                dividerText: { color: "#9CA3AF", fontSize: 12, fontWeight: 500 },
                                formFieldRow: { marginBottom: 14 },
                                formFieldLabel: {
                                    fontWeight: 500,
                                    fontSize: 13,
                                    color: BRAND_DARK,
                                    marginBottom: 6,
                                },
                                formFieldInput: {
                                    borderRadius: 10,
                                    border: "1px solid #E5E7EB",
                                    height: 44,
                                    fontSize: 14,
                                    padding: "0 14px",
                                },
                                formFieldAction: { fontSize: 12, fontWeight: 500 },
                                formButtonPrimary: {
                                    background: BRAND_PRIMARY,
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    height: 44,
                                    fontSize: 14,
                                    textTransform: "none",
                                    boxShadow: "0 4px 12px rgba(33, 98, 254, 0.25)",
                                    marginTop: 4,
                                },
                                identityPreviewText: { fontSize: 14 },
                                identityPreviewEditButton: { fontSize: 13 },
                            },
                        }}
                        routing="path"
                        path="/login"
                        forceRedirectUrl="/"
                    />
                </div>
            </div>

            <footer style={formFooterStyle}>
                © {new Date().getFullYear()} ZopGo · Tous droits réservés
            </footer>
        </main>
    );
}

// ─── Forbidden view (utilisateur connecté mais non admin) ───
function ForbiddenView() {
    const { signOut } = useAuth();

    return (
        <div style={fullPageCenterStyle}>
            <div style={forbiddenCardStyle}>
                <div style={forbiddenIconStyle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: 20, color: BRAND_DARK, fontWeight: 700 }}>
                    Accès refusé
                </h2>
                <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.55, marginBottom: 24 }}>
                    Votre compte ne possède pas le rôle administrateur. Contactez un super
                    administrateur pour qu'il vous accorde l'accès.
                </p>
                <button
                    onClick={() => signOut()}
                    style={{
                        background: BRAND_PRIMARY,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        width: "100%",
                        height: 44,
                        boxShadow: "0 4px 12px rgba(33, 98, 254, 0.25)",
                    }}
                >
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    background: "#fff",
};

const brandPanelStyle: React.CSSProperties = {
    flex: 1,
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: `linear-gradient(160deg, ${BRAND_DARKER} 0%, ${BRAND_DARK} 60%, #131C3D 100%)`,
    color: "#fff",
};

const brandOverlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${librevilleBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.18,
    mixBlendMode: "luminosity",
};

const brandContentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: "40px 56px",
    maxWidth: 640,
    margin: "0 auto",
};

const brandHeadlineStyle: React.CSSProperties = {
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: "-0.025em",
    margin: 0,
    color: "#fff",
};

const brandSubheadlineStyle: React.CSSProperties = {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 12,
    marginBottom: 0,
    lineHeight: 1.5,
};

const featurePillStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.85)",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    padding: "6px 12px",
    borderRadius: 999,
    backdropFilter: "blur(8px)",
};

const phoneFrameStyle: React.CSSProperties = {
    position: "relative",
    width: 260,
    aspectRatio: "9 / 19.5",
    background: "#0a0a0a",
    borderRadius: 38,
    padding: 8,
    boxShadow:
        "0 50px 80px -20px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
};

const phoneNotchStyle: React.CSSProperties = {
    position: "absolute",
    top: 14,
    left: "50%",
    transform: "translateX(-50%)",
    width: 92,
    height: 22,
    background: "#000",
    borderRadius: 12,
    zIndex: 2,
};

const phoneScreenStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 30,
    display: "block",
};

const formPanelStyle: React.CSSProperties = {
    flex: 1,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "32px 32px 24px",
    background: "#fff",
};

const formCenterStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
};

const formInnerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
};

const titleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    color: BRAND_DARK,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
};

const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 0,
    lineHeight: 1.5,
};

const formFooterStyle: React.CSSProperties = {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    paddingTop: 16,
};

const fullPageCenterStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(160deg, ${BRAND_DARKER}, ${BRAND_DARK})`,
    padding: 24,
};

const forbiddenCardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    textAlign: "center",
    maxWidth: 380,
    width: "100%",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
    border: "1px solid #F3F4F6",
};

const forbiddenIconStyle: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: "#FEF2F2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
};
