import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, join } from "path";
import {
    existsSync,
    mkdirSync,
    copyFileSync,
    readdirSync,
    statSync,
    createReadStream,
} from "fs";

const APK_DIR = resolve(__dirname, "apk");
const DOWNLOAD_PATH = "/download/zopgo.apk";

function pickLatestApk(): string | null {
    if (!existsSync(APK_DIR)) return null;
    const apks = readdirSync(APK_DIR)
        .filter((f) => f.toLowerCase().endsWith(".apk"))
        .map((f) => ({ f, mtime: statSync(join(APK_DIR, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
    return apks[0]?.f ?? null;
}

function apkDownloadPlugin(): Plugin {
    return {
        name: "apk-download",
        configureServer(server) {
            server.middlewares.use(DOWNLOAD_PATH, (_req, res) => {
                const file = pickLatestApk();
                if (!file) {
                    res.statusCode = 404;
                    res.end("APK introuvable dans /apk");
                    return;
                }
                res.setHeader("Content-Type", "application/vnd.android.package-archive");
                res.setHeader("Content-Disposition", 'attachment; filename="zopgo.apk"');
                createReadStream(join(APK_DIR, file)).pipe(res);
            });
        },
        closeBundle() {
            const file = pickLatestApk();
            if (!file) return;
            const destDir = resolve(__dirname, "dist", "download");
            mkdirSync(destDir, { recursive: true });
            copyFileSync(join(APK_DIR, file), join(destDir, "zopgo.apk"));
        },
    };
}

export default defineConfig({
    plugins: [react(), apkDownloadPlugin()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
});
