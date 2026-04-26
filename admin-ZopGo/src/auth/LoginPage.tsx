/**
 * ZopGo Admin — Page de connexion
 *
 * Layout : marketing à gauche (titre, pitch, store badges), phone mockup
 * à droite, bouton « Se connecter » top-right qui déroule un panneau de
 * formulaire Clerk. Logo ZopGo en watermark dans un coin du background.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import zopgoLogo from "@/assets/zopgo-logo.png";

// Phone screen image — served from public/ (no bundle hash needed)
const PHONE_IMAGE = "/zopgo_wallpaper_android_20x9_1080x2400.jpg";

// ─── Animation variants (réutilisés) ──────────────────────────
const heroContainer: Variants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const heroItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
};

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
};

const sectionViewport = { once: true, margin: "-80px" } as const;

// Trip card stack — back to front (back cards offset and rotated, fully opaque)
const TRIP_CARD_STACK = [
    { zIndex: 1, opacity: 1, x: 16, y: -18, rotate: -14, scale: 0.92, delay: 0.92 },
    { zIndex: 2, opacity: 1, x: 8, y: -9, rotate: -9, scale: 0.96, delay: 0.82 },
    { zIndex: 3, opacity: 1, x: 0, y: 0, rotate: -5, scale: 1, delay: 0.72 },
] as const;

// Driver mini-card stack — top-left of phone, fanning upward
interface DriverData {
    initials: string; // fallback alt text
    name: string;
    image: string;
}

const DRIVERS: ReadonlyArray<DriverData> = [
    { initials: "JK", name: "Jean K.", image: "/avatars/driver-1.jpg" },
    { initials: "MS", name: "Maria S.", image: "/avatars/driver-2.jpg" },
    { initials: "AT", name: "Aboubakar T.", image: "/avatars/driver-3.jpg" },
    { initials: "PB", name: "Pierre B.", image: "/avatars/driver-4.jpg" },
    { initials: "FE", name: "Fatou E.", image: "/avatars/driver-5.jpg" },
    { initials: "OM", name: "Olivier M.", image: "/avatars/driver-6.jpg" },
    { initials: "SD", name: "Sandrine D.", image: "/avatars/driver-7.jpg" },
    { initials: "RB", name: "Rachid B.", image: "/avatars/driver-8.jpg" },
    { initials: "EK", name: "Emmanuel K.", image: "/avatars/driver-9.jpg" },
    { initials: "CN", name: "Claude N.", image: "/avatars/driver-10.jpg" },
    { initials: "LB", name: "Léa B.", image: "/avatars/driver-11.jpg" },
];

// Stack positions: index 0 = front, 1 = middle, 2 = back
const DRIVER_STACK_POSITIONS = [
    { x: 0, y: 0, rotate: 0, scale: 1, zIndex: 3 },
    { x: -5, y: -7, rotate: -3, scale: 0.95, zIndex: 2 },
    { x: -10, y: -14, rotate: -5, scale: 0.9, zIndex: 1 },
];

const DRIVER_ROTATION_INTERVAL_MS = 4000;
const DRIVER_ENTRANCE_DURATION_MS = 2200;

// Hebergement card stack — back cards offset to the right with different listings
interface HebergementData {
    image: string;
    type: string;
    rating: string;
    name: string;
    location: string;
    price: string;
}

const HEBERGEMENT_CARD_STACK: ReadonlyArray<{
    zIndex: number;
    opacity: number;
    x: number;
    y: number;
    rotate: number;
    scale: number;
    delay: number;
    data: HebergementData;
}> = [
    {
        zIndex: 1, opacity: 1, x: 14, y: -18, rotate: 14, scale: 0.92, delay: 1.05,
        data: {
            image: "/lodging-sample-3.jpg",
            type: "Suite",
            rating: "4.7",
            name: "Suite Executive",
            location: "Libreville · Centre-ville",
            price: "45 000",
        },
    },
    {
        zIndex: 2, opacity: 1, x: 7, y: -9, rotate: 10, scale: 0.96, delay: 0.95,
        data: {
            image: "/lodging-sample-2.jpg",
            type: "Villa",
            rating: "4.8",
            name: "Villa avec piscine",
            location: "Libreville · Akanda",
            price: "95 000",
        },
    },
    {
        zIndex: 3, opacity: 1, x: 0, y: 0, rotate: 6, scale: 1, delay: 0.85,
        data: {
            image: "/lodging-sample.jpg",
            type: "Appartement",
            rating: "4.9",
            name: "Studio Premium vue sur Mer",
            location: "Libreville · Bord de mer",
            price: "65 000",
        },
    },
];

const BRAND_PRIMARY = "#2162FE";
const BRAND_DARK = "#0B1224";
const BRAND_DARKER = "#070C1A";

export function LoginPage() {
    const { isSignedIn, isLoaded: authLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const navigate = useNavigate();
    const [signInOpen, setSignInOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const adminRole = user?.publicMetadata?.role as string | undefined;
    const isAdmin = adminRole === "admin";

    // Driver mini-card stack rotation : the front driver changes every 4s.
    // Only 3 of the 11 drivers are visible at a time (front/middle/back),
    // and each cycle the front card exits while a new back card enters.
    const [driverFront, setDriverFront] = useState(0);
    const [driversEntered, setDriversEntered] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDriversEntered(true), DRIVER_ENTRANCE_DURATION_MS);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!driversEntered) return;
        const id = setInterval(() => {
            setDriverFront((prev) => (prev + 1) % DRIVERS.length);
        }, DRIVER_ROTATION_INTERVAL_MS);
        return () => clearInterval(id);
    }, [driversEntered]);

    const visibleDrivers = useMemo(
        () =>
            DRIVER_STACK_POSITIONS.map((_, slot) => ({
                driver: DRIVERS[(driverFront + slot) % DRIVERS.length],
                slot,
            })),
        [driverFront],
    );

    useEffect(() => {
        if (authLoaded && userLoaded && isSignedIn && isAdmin) {
            navigate("/", { replace: true });
        }
    }, [authLoaded, userLoaded, isSignedIn, isAdmin, navigate]);

    // Click outside or Escape closes the panel
    useEffect(() => {
        if (!signInOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSignInOpen(false);
        };
        const onClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                panelRef.current &&
                !panelRef.current.contains(target) &&
                triggerRef.current &&
                !triggerRef.current.contains(target)
            ) {
                setSignInOpen(false);
            }
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [signInOpen]);

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
            {/* Logo watermark — bottom-left corner, 1/4 of viewport */}
            <div
                aria-hidden
                style={{
                    ...watermarkStyle,
                    backgroundImage: `url(${zopgoLogo})`,
                }}
            />

            {/* Top bar : logo + nav + se connecter trigger */}
            <header className="zopgo-login-topbar" style={topBarStyle}>
                <a href="#hero" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                    <LogoImage size={36} />
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                        ZopGo
                    </span>
                </a>

                <nav className="zopgo-login-nav" style={navStyle}>
                    <NavLink href="#about">À propos</NavLink>
                    <NavLink href="#services">Services</NavLink>
                    <NavLink href="#partners">Partenaires</NavLink>
                </nav>

                <div style={{ position: "relative" }}>
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => setSignInOpen((v) => !v)}
                        className="zopgo-signin-trigger"
                        style={{
                            ...signInTriggerStyle,
                            background: signInOpen ? "#fff" : BRAND_PRIMARY,
                            color: signInOpen ? BRAND_DARK : "#fff",
                        }}
                        aria-expanded={signInOpen}
                        aria-controls="signin-panel"
                    >
                        Se connecter
                        <ChevronIcon open={signInOpen} />
                    </button>

                    <AnimatePresence>
                        {signInOpen && (
                            <motion.div
                                ref={panelRef}
                                id="signin-panel"
                                role="dialog"
                                aria-label="Formulaire de connexion administrateur"
                                className="zopgo-signin-panel"
                                style={signInPanelStyle}
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <div style={panelHeaderStyle}>
                                    <h2 style={panelTitleStyle}>Bienvenue</h2>
                                    <p style={panelSubtitleStyle}>
                                        Connectez-vous à votre compte administrateur ZopGo.
                                    </p>
                                </div>

                                <div style={panelSignInWrapStyle}>
                                    <SignIn
                                        appearance={{
                                            layout: {
                                                logoPlacement: "none",
                                                socialButtonsPlacement: "top",
                                                socialButtonsVariant: "blockButton",
                                            },
                                            variables: {
                                                colorPrimary: BRAND_PRIMARY,
                                                colorText: BRAND_DARK,
                                                colorTextSecondary: "#6B7280",
                                                colorInputBackground: "#fff",
                                                colorInputText: BRAND_DARK,
                                                colorBackground: "#fff",
                                                borderRadius: "10px",
                                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                                                spacingUnit: "0.875rem",
                                            },
                                            elements: {
                                                rootBox: { width: "100%" },
                                                cardBox: {
                                                    boxShadow: "none",
                                                    border: "none",
                                                    width: "100%",
                                                },
                                                card: {
                                                    boxShadow: "none",
                                                    background: "transparent",
                                                    border: "none",
                                                    margin: 0,
                                                    padding: 0,
                                                    width: "100%",
                                                },
                                                header: { display: "none" },
                                                headerTitle: { display: "none" },
                                                headerSubtitle: { display: "none" },
                                                main: { gap: 14 },
                                                footer: { display: "none" },
                                                footerAction: { display: "none" },
                                                socialButtonsBlockButton: {
                                                    height: 42,
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: 10,
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                },
                                                socialButtonsBlockButtonText: { fontSize: 14, fontWeight: 500 },
                                                dividerRow: { margin: "4px 0" },
                                                dividerLine: { background: "#E5E7EB" },
                                                dividerText: { color: "#9CA3AF", fontSize: 12, fontWeight: 500 },
                                                formFieldRow: { gap: 6 },
                                                formFieldLabel: {
                                                    fontWeight: 500,
                                                    fontSize: 13,
                                                    color: BRAND_DARK,
                                                },
                                                formFieldInput: {
                                                    height: 42,
                                                    borderRadius: 10,
                                                    border: "1px solid #E5E7EB",
                                                    fontSize: 14,
                                                    padding: "0 14px",
                                                    width: "100%",
                                                },
                                                formFieldInputShowPasswordButton: { right: 12 },
                                                formFieldAction: { fontSize: 12, fontWeight: 500 },
                                                formButtonPrimary: {
                                                    background: BRAND_PRIMARY,
                                                    borderRadius: 10,
                                                    fontWeight: 600,
                                                    height: 42,
                                                    fontSize: 14,
                                                    textTransform: "none",
                                                    boxShadow: "0 4px 12px rgba(33, 98, 254, 0.25)",
                                                    width: "100%",
                                                },
                                                identityPreview: {
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: 10,
                                                },
                                                identityPreviewText: { fontSize: 14 },
                                                identityPreviewEditButton: { fontSize: 13 },
                                                alert: { borderRadius: 10 },
                                            },
                                        }}
                                        routing="path"
                                        path="/login"
                                        forceRedirectUrl="/"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main content : pitch left, phone right */}
            <main id="hero" className="zopgo-login-main" style={mainStyle}>
                <motion.section
                    style={pitchSectionStyle}
                    variants={heroContainer}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div variants={heroItem} style={tagBadgeStyle}>
                        <span style={tagDotStyle} />
                        Disponible au Gabon · 2026
                    </motion.div>

                    <motion.h1 variants={heroItem} style={heroTitleStyle}>
                        Le quotidien du Gabon,<br />
                        <span style={{ color: BRAND_PRIMARY }}>en un seul geste.</span>
                    </motion.h1>

                    <motion.p variants={heroItem} style={heroLeadStyle}>
                        ZopGo connecte voyageurs, chauffeurs, livreurs et hôteliers à travers
                        tout le pays. Trouvez un trajet inter-villes, faites livrer un colis,
                        réservez une chambre — la même app, sans friction.
                    </motion.p>

                    <motion.p variants={heroItem} style={heroPitchStyle}>
                        Pensé pour bouger, payer et héberger plus simplement.<br />
                        Téléchargez l'app et essayez en moins d'une minute.
                    </motion.p>

                    <motion.div variants={heroItem} style={storeBadgeRowStyle}>
                        <AppStoreBadge />
                        <GooglePlayBadge />
                    </motion.div>

                    <motion.div variants={heroItem} style={metricsRowStyle}>
                        <Metric value="4" label="services" />
                        <Metric value="15+" label="villes du Gabon" />
                        <Metric value="24/7" label="support" />
                    </motion.div>
                </motion.section>

                <section
                    className="zopgo-login-phone-section"
                    style={phoneSectionStyle}
                >
                    <motion.div
                        className="zopgo-map-card"
                        style={mapCardStyle}
                        initial={{ opacity: 0, scale: 0.9, rotateX: 60 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 50 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                        aria-hidden
                    >
                        <iframe
                            src="https://maps.google.com/maps?q=Centre-ville%20Libreville%20Gabon&t=m&z=14&output=embed"
                            style={mapIframeStyle}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Libreville centre-ville"
                        />
                        <div style={mapOverlayStyle} />
                    </motion.div>

                    {/* Soft shadow ellipse projected by the phone onto the map */}
                    <div className="zopgo-map-card" style={phoneShadowStyle} aria-hidden />

                    <div style={phoneClusterStyle}>
                        <motion.div
                            style={{ position: "relative", zIndex: 1 }}
                            initial={{ opacity: 0, x: 120 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <PhoneMockup />
                            </motion.div>
                        </motion.div>
                        <AnimatePresence>
                            {visibleDrivers.map(({ driver, slot }) => {
                                const pos = DRIVER_STACK_POSITIONS[slot];
                                return (
                                    <motion.div
                                        key={driver.initials}
                                        className="zopgo-trip-card-wrap"
                                        style={{ ...driversAvailableWrapStyle, zIndex: pos.zIndex }}
                                        initial={{ opacity: 0, y: -50, scale: 0.85, rotate: -10 }}
                                        animate={{
                                            opacity: 1,
                                            x: pos.x,
                                            y: pos.y,
                                            rotate: pos.rotate,
                                            scale: pos.scale,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: -40,
                                            scale: 0.85,
                                            rotate: -10,
                                            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                                        }}
                                        transition={{
                                            duration: 0.55,
                                            ease: [0.16, 1, 0.3, 1],
                                            delay: driversEntered ? 0 : 1.2 + slot * 0.1,
                                        }}
                                    >
                                        <DriverCardMockup data={driver} />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {TRIP_CARD_STACK.map((s, i) => (
                            <motion.div
                                key={i}
                                className="zopgo-trip-card-wrap"
                                style={{ ...tripCardWrapStyle, zIndex: s.zIndex }}
                                initial={{ opacity: 0, y: 60, rotate: -18, scale: 0.88 }}
                                animate={{
                                    opacity: s.opacity,
                                    x: s.x,
                                    y: s.y,
                                    rotate: s.rotate,
                                    scale: s.scale,
                                }}
                                transition={{ delay: s.delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <TripCardMockup />
                            </motion.div>
                        ))}

                        {HEBERGEMENT_CARD_STACK.map((s, i) => (
                            <motion.div
                                key={`heberg-${i}`}
                                className="zopgo-trip-card-wrap"
                                style={{ ...hebergementCardWrapStyle, zIndex: s.zIndex }}
                                initial={{ opacity: 0, x: 90, rotate: 18, scale: 0.88 }}
                                animate={{
                                    opacity: s.opacity,
                                    x: s.x,
                                    y: s.y,
                                    rotate: s.rotate,
                                    scale: s.scale,
                                }}
                                transition={{ delay: s.delay, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <HebergementCardMockup data={s.data} />
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            <AboutSection />
            <ServicesSection />
            <PartnersSection />
            <SiteFooter />
        </div>
    );
}

// ─── Components ──────────────────────────────────────────────

function LogoImage({ size = 32 }: { size?: number }) {
    return (
        <img
            src={zopgoLogo}
            alt="ZopGo"
            width={size}
            height={size}
            style={{
                width: size,
                height: size,
                borderRadius: size * 0.22,
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 6px 20px rgba(33, 98, 254, 0.25)",
            }}
        />
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a href={href} style={navLinkStyle} className="zopgo-nav-link">
            {children}
        </a>
    );
}

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                transition: "transform 0.2s ease",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function PhoneMockup() {
    return (
        <div data-phone-frame style={phoneFrameStyle}>
            <div style={phoneNotchStyle} />
            <img
                src={PHONE_IMAGE}
                alt="Aperçu de l'app ZopGo"
                style={phoneScreenStyle}
            />
        </div>
    );
}

function TripCardMockup() {
    return (
        <article style={tripCardStyle} aria-label="Aperçu d'un trajet publié">
            <div style={tripCardRouteInlineStyle}>
                <span style={tripCardOriginDotStyle} />
                <span style={tripCardCityStyle}>Libreville</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                </svg>
                <span style={tripCardCityStyle}>Port-Gentil</span>
            </div>

            <div style={tripCardMetaRowStyle}>
                <span style={tripCardStatusDotStyle} />
                Aujourd'hui · 08h00 → 13h30
            </div>

            <div style={tripCardBottomRowStyle}>
                <div style={tripCardDriverInlineStyle}>
                    <div style={tripCardAvatarStyle}>JK</div>
                    <div style={{ minWidth: 0 }}>
                        <div style={tripCardDriverNameStyle}>Jean K.</div>
                        <div style={tripCardDriverMetaStyle}>
                            <StarIcon /> 4.8 · Toyota
                        </div>
                    </div>
                </div>
                <div style={tripCardPriceBlockStyle}>
                    <div style={tripCardPriceStyle}>
                        25&nbsp;000<span style={tripCardCurrencyStyle}>FCFA</span>
                    </div>
                    <div style={tripCardPlacesStyle}>3 places</div>
                </div>
            </div>
        </article>
    );
}

function DriverCardMockup({ data }: { data: DriverData }) {
    return (
        <div style={driversAvailableCardStyle}>
            <img
                src={data.image}
                alt={data.initials}
                style={driverAvatarPhotoStyle}
                draggable={false}
            />
            <span style={driverNameSmallStyle}>{data.name}</span>
            <span style={driversAvailableDotStyle} />
            <span style={driversAvailableLabelStyle}>Disponible</span>
        </div>
    );
}

function HebergementCardMockup({ data }: { data: HebergementData }) {
    return (
        <article style={hebergementCardStyle} aria-label="Aperçu d'un hébergement publié">
            <div style={hebergementPhotoStyle}>
                <img src={data.image} alt="" style={hebergementImgStyle} />
                <span style={hebergementTypePillStyle}>{data.type}</span>
                <span style={hebergementRatingPillStyle}>
                    <StarIcon /> {data.rating}
                </span>
            </div>
            <div style={hebergementInfoStyle}>
                <div style={hebergementNameStyle}>{data.name}</div>
                <div style={hebergementLocStyle}>{data.location}</div>
                <div style={hebergementPriceRowStyle}>
                    <span style={hebergementPriceStyle}>{data.price}</span>
                    <span style={hebergementPriceUnitStyle}>FCFA / nuit</span>
                </div>
            </div>
        </article>
    );
}

function StarIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none" style={{ flexShrink: 0 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

function Metric({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {value}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
            </div>
        </div>
    );
}

function AppStoreBadge() {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="zopgo-store-badge"
            style={storeBadgeStyle}
            aria-label="Télécharger sur l'App Store"
        >
            <svg width="22" height="22" viewBox="0 0 384 512" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            <span style={storeBadgeContentStyle}>
                <span style={storeBadgeSmallStyle}>Télécharger sur</span>
                <span style={storeBadgeBigStyle}>App Store</span>
            </span>
        </a>
    );
}

function GooglePlayBadge() {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="zopgo-store-badge"
            style={storeBadgeStyle}
            aria-label="Disponible sur Google Play"
        >
            <svg width="22" height="22" viewBox="0 0 512 512" style={{ flexShrink: 0 }}>
                <path fill="#00D4FF" d="M325.3 234.3L104.1 13l280.5 161.9-59.3 59.4z" />
                <path fill="#FFD93D" d="M104.1 13L13 104.1V407.9l91.1-91.1z" />
                <path fill="#FF6B6B" d="M104.1 407.9L13 499 384.6 337.1l-59.3-59.4z" />
                <path fill="#6BCF7F" d="M384.6 174.9L13 13l311.6 311.5L384.6 264z" opacity="0" />
                <path fill="#FFFFFF" d="M384.6 174.9L325.3 234.3 13 104.1l372 70.8z" opacity="0" />
                <path fill="#FF6B6B" d="M104.1 13L325.3 234.3l-91.1 91.1L104.1 13z" opacity="0" />
                <path fill="#FFD93D" d="M104.1 13l130.1 312.4-130.1 91.5V13z" />
                <path fill="#00D4FF" d="M325.3 234.3l-91.1 91.1L104.1 13l221.2 221.3z" />
                <path fill="#FF6B6B" d="M325.3 234.3l-91.1 91.1L104.1 416.8 325.3 234.3z" />
                <path fill="#6BCF7F" d="M104.1 13l221.2 221.3 91.1 53.2L104.1 13z" />
            </svg>
            <span style={storeBadgeContentStyle}>
                <span style={storeBadgeSmallStyle}>Disponible sur</span>
                <span style={storeBadgeBigStyle}>Google Play</span>
            </span>
        </a>
    );
}

// ─── Sections de contenu ─────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <span style={sectionLabelStyle}>{children}</span>;
}

function AboutSection() {
    return (
        <motion.section
            id="about"
            style={sectionStyle}
            initial="hidden"
            whileInView="show"
            viewport={sectionViewport}
            variants={fadeInUp}
        >
            <div style={sectionInnerStyle}>
                <SectionLabel>À propos</SectionLabel>
                <h2 style={sectionTitleStyle}>
                    Une seule app, tout le quotidien.
                </h2>

                <div style={aboutGridStyle}>
                    <div>
                        <p style={proseStyle}>
                            ZopGo est née à Libreville en 2026 d'un constat simple : pour
                            voyager, livrer un colis ou trouver une chambre, les Gabonaises
                            et Gabonais jonglaient avec une dizaine d'apps, de groupes
                            WhatsApp et d'appels. Nous avons regroupé l'essentiel en un seul
                            endroit, pensé pour le terrain — mobile-first, avec ou sans
                            connexion stable.
                        </p>
                        <p style={proseStyle}>
                            Notre mission : simplifier la mobilité, la logistique et le
                            séjour dans tout le Gabon, en mettant en relation directe les
                            voyageurs avec des professionnels et des particuliers de
                            confiance.
                        </p>
                    </div>

                    <div style={aboutStatsStyle}>
                        <AboutStat label="Lancement" value="2026" />
                        <AboutStat label="Ville d'origine" value="Libreville" />
                        <AboutStat label="Pays couvert" value="Gabon" />
                        <AboutStat label="Services" value="4 verticales" />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function AboutStat({ label, value }: { label: string; value: string }) {
    return (
        <div style={aboutStatCardStyle}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 6, letterSpacing: "-0.015em" }}>
                {value}
            </div>
        </div>
    );
}

function ServicesSection() {
    const services = [
        {
            icon: <CarIcon />,
            title: "Trajets",
            desc: "Voyages inter-villes avec des chauffeurs vérifiés. Réservez votre place, payez en mobile money, suivez le départ en direct.",
        },
        {
            icon: <BoxIcon />,
            title: "Livraisons",
            desc: "Faites livrer un colis dans la même ville en quelques heures. Suivi temps réel, signature à la livraison, prix fixé à l'avance.",
        },
        {
            icon: <BedIcon />,
            title: "Hébergements",
            desc: "Hôtels, auberges, appartements et chambres chez l'habitant. Photos, avis et tarif par nuit affichés clairement.",
        },
        {
            icon: <KeyIcon />,
            title: "Location de véhicules",
            desc: "Voitures, motos et utilitaires en location courte durée. Avec ou sans chauffeur, selon vos besoins.",
        },
    ];

    return (
        <motion.section
            id="services"
            style={{ ...sectionStyle, background: "rgba(255,255,255,0.02)" }}
            initial="hidden"
            whileInView="show"
            viewport={sectionViewport}
            variants={fadeInUp}
        >
            <div style={sectionInnerStyle}>
                <SectionLabel>Nos services</SectionLabel>
                <h2 style={sectionTitleStyle}>
                    Quatre services, une expérience.
                </h2>
                <p style={{ ...proseStyle, maxWidth: 640, marginBottom: 40 }}>
                    Chaque verticale a été pensée pour ses propres usages, mais partage
                    le même paiement, le même support et le même réseau d'utilisateurs.
                </p>

                <div className="zopgo-services-grid" style={servicesGridStyle}>
                    {services.map((s, i) => (
                        <motion.article
                            key={s.title}
                            style={serviceCardStyle}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div style={serviceIconWrapStyle}>{s.icon}</div>
                            <h3 style={serviceTitleStyle}>{s.title}</h3>
                            <p style={serviceDescStyle}>{s.desc}</p>
                        </motion.article>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}

function PartnersSection() {
    const benefits = [
        "Onboarding en moins de 24h, sans paperasse complexe",
        "Visibilité immédiate auprès de milliers d'utilisateurs au Gabon",
        "Tableau de bord dédié pour gérer vos annonces, prix et disponibilités",
        "Pas de commission cachée — conditions claires et négociables",
        "Support 7j/7 par WhatsApp et téléphone",
    ];

    return (
        <motion.section
            id="partners"
            style={sectionStyle}
            initial="hidden"
            whileInView="show"
            viewport={sectionViewport}
            variants={fadeInUp}
        >
            <div style={sectionInnerStyle}>
                <div style={partnersGridStyle}>
                    <div>
                        <SectionLabel>Partenaires</SectionLabel>
                        <h2 style={sectionTitleStyle}>
                            Vous êtes une agence, un hôtel, un transporteur ?
                        </h2>
                        <p style={proseStyle}>
                            ZopGo accueille les agences de voyage, hôtels, sociétés de
                            location et de transport qui souhaitent toucher une nouvelle
                            audience digitale au Gabon. Nous nous occupons de la
                            distribution, vous gardez la main sur l'offre.
                        </p>
                        <a
                            href="mailto:partenaires@zopgo.com?subject=Devenir%20partenaire%20ZopGo"
                            style={ctaPrimaryStyle}
                            className="zopgo-cta-primary"
                        >
                            Devenir partenaire
                            <ArrowRightIcon />
                        </a>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 12 }}>
                            Réponse de notre équipe sous 24h ouvrées.
                        </p>
                    </div>

                    <ul style={benefitsListStyle}>
                        {benefits.map((b, i) => (
                            <motion.li
                                key={b}
                                style={benefitItemStyle}
                                initial={{ opacity: 0, x: 16 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <span style={benefitCheckStyle}>
                                    <CheckIcon />
                                </span>
                                <span>{b}</span>
                            </motion.li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.section>
    );
}

function SiteFooter() {
    return (
        <footer style={siteFooterStyle}>
            <div style={{ ...sectionInnerStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LogoImage size={26} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>ZopGo</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>
                        © {new Date().getFullYear()} · Libreville, Gabon
                    </span>
                </div>
                <div style={{ display: "flex", gap: 18 }}>
                    <a href="#about" style={footerLinkStyle}>À propos</a>
                    <a href="#services" style={footerLinkStyle}>Services</a>
                    <a href="#partners" style={footerLinkStyle}>Partenaires</a>
                    <a href="mailto:contact@zopgo.com" style={footerLinkStyle}>Contact</a>
                </div>
            </div>
        </footer>
    );
}

// ─── Icons (inline SVG, lucide-style) ────────────────────────

function CarIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
            <circle cx="6.5" cy="16.5" r="2.5" />
            <circle cx="16.5" cy="16.5" r="2.5" />
        </svg>
    );
}

function BoxIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    );
}

function BedIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4v16" />
            <path d="M2 8h18a2 2 0 0 1 2 2v10" />
            <path d="M2 17h20" />
            <path d="M6 8v9" />
        </svg>
    );
}

function KeyIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    );
}

// ─── Forbidden view ──────────────────────────────────────────
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
    position: "relative",
    background: `radial-gradient(circle at 20% 0%, #1A2447 0%, ${BRAND_DARK} 45%, ${BRAND_DARKER} 100%)`,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    scrollBehavior: "smooth",
};

const watermarkStyle: React.CSSProperties = {
    position: "fixed",
    bottom: -120,
    left: -120,
    width: "min(50vw, 700px)",
    height: "min(50vw, 700px)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    opacity: 0.05,
    pointerEvents: "none",
    zIndex: 0,
};

const topBarStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 40px",
    background: "rgba(11, 18, 36, 0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const navStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
};

const navLinkStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(255,255,255,0.72)",
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: 8,
    transition: "color 0.18s ease, background 0.18s ease",
};

const signInTriggerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 18px",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(33, 98, 254, 0.35)",
    fontFamily: "inherit",
};

const signInPanelStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    width: 420,
    background: "#fff",
    color: BRAND_DARK,
    borderRadius: 16,
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.18)",
    zIndex: 20,
    overflow: "hidden",
    transformOrigin: "top right",
};

const panelHeaderStyle: React.CSSProperties = {
    padding: "24px 28px 18px",
    borderBottom: "1px solid #F3F4F6",
};

const panelSignInWrapStyle: React.CSSProperties = {
    padding: "20px 28px 24px",
};

const panelTitleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: BRAND_DARK,
    letterSpacing: "-0.025em",
};

const panelSubtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 0,
    lineHeight: 1.5,
};

const mainStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    flex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
    gap: 48,
    alignItems: "center",
    padding: "32px 64px 64px",
    maxWidth: 1280,
    margin: "0 auto",
    width: "100%",
};

const pitchSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 20,
};

const tagBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.85)",
    background: "rgba(33, 98, 254, 0.14)",
    border: "1px solid rgba(33, 98, 254, 0.32)",
    padding: "6px 12px",
    borderRadius: 999,
    width: "fit-content",
    letterSpacing: "0.02em",
};

const tagDotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22D3EE",
    boxShadow: "0 0 12px rgba(34, 211, 238, 0.6)",
};

const heroTitleStyle: React.CSSProperties = {
    fontSize: "clamp(38px, 5vw, 60px)",
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: "-0.035em",
    margin: 0,
    color: "#fff",
};

const heroLeadStyle: React.CSSProperties = {
    fontSize: 17,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.55,
    margin: 0,
    maxWidth: 540,
};

const heroPitchStyle: React.CSSProperties = {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.55,
    margin: 0,
    maxWidth: 540,
};

const storeBadgeRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
};

const storeBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    background: "#000",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "10px 18px",
    textDecoration: "none",
    transition: "transform 0.2s ease, background 0.2s ease",
    minWidth: 178,
};

const storeBadgeContentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
};

const storeBadgeSmallStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    opacity: 0.75,
    letterSpacing: "0.04em",
};

const storeBadgeBigStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    marginTop: 2,
};

const metricsRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 40,
    marginTop: 24,
    paddingTop: 24,
    borderTop: "1px solid rgba(255,255,255,0.08)",
};

const phoneSectionStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 720,
    perspective: 1400,
};

const mapCardStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "6%",
    left: "-4%",
    right: "-4%",
    height: "62%",
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 0,
    background: "#1A2447",
    transformOrigin: "center bottom",
    boxShadow:
        "0 60px 100px -10px rgba(0, 0, 0, 0.7), 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)",
    pointerEvents: "auto",
};

const mapIframeStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
    filter: "saturate(0.85) brightness(0.92)",
};

const mapOverlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
        "linear-gradient(180deg, rgba(11, 18, 36, 0.25) 0%, rgba(11, 18, 36, 0) 35%, rgba(11, 18, 36, 0) 60%, rgba(11, 18, 36, 0.55) 100%)",
};

const phoneShadowStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "8%",
    left: "50%",
    width: 280,
    height: 50,
    transform: "translateX(-50%)",
    background:
        "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.25) 45%, rgba(0, 0, 0, 0) 70%)",
    filter: "blur(8px)",
    zIndex: 1,
    pointerEvents: "none",
};

const phoneFrameStyle: React.CSSProperties = {
    position: "relative",
    width: "min(280px, 80vw)",
    aspectRatio: "9 / 19.5",
    background: "#0a0a0a",
    borderRadius: 42,
    padding: 9,
    boxShadow:
        "0 80px 120px -10px rgba(0, 0, 0, 0.85), 0 30px 60px -10px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
};

const phoneNotchStyle: React.CSSProperties = {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    width: 96,
    height: 24,
    background: "#000",
    borderRadius: 14,
    zIndex: 2,
};

const phoneScreenStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    borderRadius: 33,
    display: "block",
};

const phoneClusterStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    zIndex: 2,
    marginTop: -80,
};

const tripCardWrapStyle: React.CSSProperties = {
    position: "absolute",
    left: -110,
    bottom: -10,
    zIndex: 3,
    pointerEvents: "none",
};

const tripCardStyle: React.CSSProperties = {
    width: 250,
    background: "#FFFFFF",
    color: "#0B1224",
    borderRadius: 14,
    padding: 12,
    boxShadow:
        "0 24px 48px -8px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.18)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: 8,
};

const tripCardRouteInlineStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
};

const tripCardOriginDotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    border: "2px solid #2162FE",
    background: "#fff",
    flexShrink: 0,
};

const tripCardCityStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: "#0B1224",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
};

const tripCardMetaRowStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 500,
    color: "#475569",
    paddingBottom: 8,
    borderBottom: "1px solid #F1F5F9",
};

const tripCardStatusDotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10B981",
    boxShadow: "0 0 6px rgba(16, 185, 129, 0.55)",
    flexShrink: 0,
};

const tripCardBottomRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
};

const tripCardDriverInlineStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flex: 1,
};

const tripCardAvatarStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2162FE 0%, #4F8DFF 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.03em",
    flexShrink: 0,
};

const tripCardDriverNameStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#0B1224",
    lineHeight: 1.2,
};

const tripCardDriverMetaStyle: React.CSSProperties = {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    lineHeight: 1.3,
};

const tripCardPriceBlockStyle: React.CSSProperties = {
    textAlign: "right",
    flexShrink: 0,
};

const tripCardPriceStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: "#0B1224",
    letterSpacing: "-0.02em",
    lineHeight: 1,
};

const tripCardCurrencyStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    color: "#6B7280",
    marginLeft: 3,
    letterSpacing: "0.02em",
};

const tripCardPlacesStyle: React.CSSProperties = {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
};

// ─── Drivers available pill (top-left of phone) ──────────────

const driversAvailableWrapStyle: React.CSSProperties = {
    position: "absolute",
    top: 30,
    left: -70,
    zIndex: 4,
    pointerEvents: "none",
};

const driversAvailableCardStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "#FFFFFF",
    borderRadius: 999,
    padding: "5px 12px 5px 5px",
    boxShadow:
        "0 16px 32px -6px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.18)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    whiteSpace: "nowrap",
};

const driverAvatarPhotoStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: "50%",
    objectFit: "cover",
    objectPosition: "center",
    flexShrink: 0,
    border: "1.5px solid #fff",
    boxShadow: "0 0 0 1.5px rgba(33, 98, 254, 0.5)",
    background: "#E5E7EB",
};

const driverNameSmallStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#0B1224",
    letterSpacing: "-0.01em",
};

const driversAvailableDotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10B981",
    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.18), 0 0 6px rgba(16, 185, 129, 0.6)",
    flexShrink: 0,
    marginLeft: 2,
};

const driversAvailableLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "#10B981",
};

// ─── Hebergement card (right side of phone) ──────────────────

const hebergementCardWrapStyle: React.CSSProperties = {
    position: "absolute",
    right: -140,
    top: "50%",
    marginTop: -100,
    zIndex: 3,
    pointerEvents: "none",
};

const hebergementCardStyle: React.CSSProperties = {
    width: 180,
    background: "#FFFFFF",
    color: "#0B1224",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow:
        "0 24px 48px -8px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.18)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    flexDirection: "column",
};

const hebergementPhotoStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: 120,
    overflow: "hidden",
    background: "#0B1224",
};

const hebergementImgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
};

const hebergementTypePillStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 10,
    fontWeight: 600,
    color: "#0B1224",
    background: "rgba(255, 255, 255, 0.92)",
    padding: "3px 8px",
    borderRadius: 6,
    backdropFilter: "blur(6px)",
};

const hebergementRatingPillStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    right: 8,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 10,
    fontWeight: 700,
    color: "#0B1224",
    background: "rgba(255, 255, 255, 0.92)",
    padding: "3px 7px",
    borderRadius: 6,
    backdropFilter: "blur(6px)",
};

const hebergementInfoStyle: React.CSSProperties = {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 3,
};

const hebergementNameStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: "#0B1224",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
};

const hebergementLocStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 1.3,
};

const hebergementPriceRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
    marginTop: 4,
};

const hebergementPriceStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: "#0B1224",
    letterSpacing: "-0.02em",
};

const hebergementPriceUnitStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    color: "#6B7280",
};

// ─── Sections styles ─────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    padding: "96px 64px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
};

const sectionInnerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
};

const sectionLabelStyle: React.CSSProperties = {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    color: BRAND_PRIMARY,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: 14,
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: 700,
    margin: "0 0 24px",
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
    color: "#fff",
    maxWidth: 720,
};

const proseStyle: React.CSSProperties = {
    fontSize: 15.5,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.7,
    margin: "0 0 16px",
    maxWidth: 600,
};

const aboutGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
    gap: 56,
    marginTop: 8,
};

const aboutStatsStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    alignContent: "start",
};

const aboutStatCardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "18px 20px",
};

const servicesGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
};

const serviceCardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
};

const serviceIconWrapStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: "rgba(33, 98, 254, 0.16)",
    color: BRAND_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const serviceTitleStyle: React.CSSProperties = {
    fontSize: 17,
    fontWeight: 600,
    margin: 0,
    color: "#fff",
    letterSpacing: "-0.015em",
};

const serviceDescStyle: React.CSSProperties = {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.55,
    margin: 0,
};

const partnersGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
    gap: 56,
    alignItems: "start",
};

const benefitsListStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
};

const benefitItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    fontSize: 14.5,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.55,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "14px 16px",
    borderRadius: 10,
};

const benefitCheckStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: "rgba(33, 98, 254, 0.18)",
    color: BRAND_PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
};

const ctaPrimaryStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: BRAND_PRIMARY,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    padding: "12px 22px",
    borderRadius: 10,
    textDecoration: "none",
    marginTop: 20,
    boxShadow: "0 6px 20px rgba(33, 98, 254, 0.35)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
};

const siteFooterStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    padding: "28px 64px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(7, 12, 26, 0.6)",
};

const footerLinkStyle: React.CSSProperties = {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
    transition: "color 0.18s ease",
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
