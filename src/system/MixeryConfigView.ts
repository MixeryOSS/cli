import * as fs from "node:fs";
import * as childProcess from "node:child_process";
import * as esbuild from "esbuild";
import { FileSystemView } from "./FileSystemView";
import { MixeryJson } from "./MixeryJson";
import { Logger, getPackage, options, packageOverrides } from "..";
import { AddonView } from "./AddonView";

export class MixeryConfigView extends FileSystemView {
    constructor(root: string) {
        super(root);
    }

    async createNew() {
        if (!fs.existsSync(this.root)) await fs.promises.mkdir(this.root, { recursive: true });

        await this.json("mixery.json", <MixeryConfigJson> {
            type: "configuration",
            ...(Object.keys(packageOverrides).length > 0? { overrides: packageOverrides } : {})
        });
        await fs.promises.mkdir(this.file("addons"));
    }

    async build(logging = false) {
        let addons: string[] = [];
        const config: MixeryConfigJson = await this.json("mixery.json");

        if (fs.existsSync(this.file("addons"))) {
            addons = await fs.promises.readdir(this.file("addons"));
            if (addons.length > 0) {
                if (logging) Logger.stage(`This configuration contains ${addons.length} addon(s). Building all addons...`);
                Promise.all(addons.map(async addon => {
                    const addonRoot = this.file(`addons/${addon}`);
                    const addonView = new AddonView(addonRoot);
                    if (logging) Logger.stage(`Building addon: ${addon}`);
                    await addonView.build();
                }));
            }
        }

        if (addons.length > 0 && logging) Logger.stage(`Building Mixery DAW...`);
        if (fs.existsSync(this.file("build")) && (options["clean"] ?? ["false"])[0] == "true") {
            if (logging) Logger.stage(`--clean=true defined, cleaning old build...`);
            await fs.promises.rm(this.file("build"), { recursive: true });
        }
        
        if (!fs.existsSync(this.file("build"))) await fs.promises.mkdir(this.file("build"));
        await this.json("build/package.json", {
            name: "@mixery/daw",
            description: "Mixery Digital Audio Workspace",
            author: "The Mixery Contributors",
            type: "module",
            version: "0.0.1",
            dependencies: {
                ...getPackage("@mixery/engine", "^1.0.0", config.overrides, "../")
            },
        });
        if (addons.length > 0) {
            if (logging) Logger.stage("Copying addons to build directory...");
            await Promise.all(addons.map(v => fs.promises.cp(this.file(`addons/${v}/build`), this.file(`build/addons/${v}`), { recursive: true })));
        }
        await fs.promises.writeFile(this.file("build/index.ts"), [
            `import * as engine from "@mixery/engine";`,
            ``,
            `/*`,
            ` * Welcome to Mixery Digital Audio Workspace!`,
            ` *`,
            ` * This source file was generated using 'mixerycli build'. To configure this build,`,
            ` * please use 'mixerycli' or edit 'mixery.json' in your Mixery configuration directory`,
            ` * and build with 'mixerycli build'.`,
            ` *`,
            ` * Note that you don't need to configure using CLI to use Mixery.`,
            ` */`,
            ``,
            `namespace Mixery {`,
            `    export const workspace = new engine.Workspace(new AudioContext({`,
            `        latencyHint: "interactive",`,
            `        sampleRate: 48000`,
            `    }));`,
            `}`,
            ``,
            `globalThis.Mixery = Mixery;`,
            ``,
            `// Async main`,
            `(async function() {`,
            ...addons.map(v => `    await Mixery.workspace.loadAddonFromUrl("addons/${v}");`),
            `})();`,
        ].join("\n"), "utf-8");
        await this.json("build/tsconfig.json", {
            compilerOptions: {
                module: "NodeNext",
                target: "ESNext",
                noEmit: true,
            },
            include: ["index.ts"]
        });
        await fs.promises.writeFile(this.file("build/index.html"), [
            `<!DOCTYPE html>`,
            `<html>`,
            `<head>`,
            `    <meta charset='utf-8'>`,
            `    <meta http-equiv='X-UA-Compatible' content='IE=edge'>`,
            `    <title>Mixery</title>`,
            `    <meta name='viewport' content='width=device-width, initial-scale=1'>`,
            `    <script src='bundle.js' defer></script>`,
            `</head>`,
            `<body></body>`,
            `</html>`,
        ].join("\n"), "utf-8");

        if ((options["partial-build"] ?? ["false"])[0] == "true") {
            if (logging) Logger.stage("--partial-build=true defined, finishing build here.");
            return;
        }

        if (logging) Logger.stage("Running 'npm install'...");
        await new Promise((resolve, reject) => {
            let proc = childProcess.exec("npm install", { cwd: this.file("build") });
            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);
            proc.on("error", reject);
            proc.on("exit", (code, signal) => {
                if (code != 0) reject(new Error(`Program exited with code ${code}`));
                else resolve(null);
            });
        });
        
        if (logging) Logger.stage("Running esbuild...");
        await esbuild.build({
            bundle: true,
            outfile: this.file("build/bundle.js"),
            entryPoints: [this.file("build/index.ts")],
        });
    }
}

export interface MixeryConfigJson extends MixeryJson<"configuration"> {
}