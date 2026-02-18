/**
 * ZopGo Admin — Entry point
 * Wraps the app with ClerkProvider
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { frFR } from "@clerk/localizations";
import { App } from "./App";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ClerkProvider
            publishableKey={clerkPubKey}
            localization={frFR}
            afterSignOutUrl="/login"
        >
            <App />
        </ClerkProvider>
    </React.StrictMode>
);
