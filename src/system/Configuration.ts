import * as fs from "node:fs";
import * as childProcess from "node:child_process";
import * as esbuild from "esbuild";
import * as path from "node:path";
import { Logger } from "..";
import { buildAddon } from "../subcommand/build";

export interface ConfigurationOverrides {
    packages?: Record<string, string>;
}

export interface ConfigurationFile {
}

export class Configuration {
    readonly buildDir: string;
    readonly addonsDir: string;
    configFile: ConfigurationFile;
    overrides: ConfigurationOverrides;

    constructor(
        public readonly root: string
    ) {
        this.buildDir = `${root}/build`;
        this.addonsDir = `${root}/addons`;
    }

    file(f: string) {
        return path.resolve(this.root, f);
    }

    async getOverrides(): Promise<ConfigurationOverrides> {
        if (this.overrides != null) return this.overrides;
        return this.overrides = JSON.parse(await fs.promises.readFile(this.file("overrides.json"), "utf-8"));
    }

    async getConfigFile(): Promise<ConfigurationFile> {
        if (this.configFile != null) return this.configFile;
        return this.configFile = JSON.parse(await fs.promises.readFile(this.file("mixery.json"), "utf-8"));
    }

    async useDependency(id: string, version: string) {
        let packages = (await this.getOverrides()).packages ?? {};
        let obj = {};
        obj[id] = packages[id] ?? version;
        return obj;
    }

    async create() {
        await Promise.all([
            fs.promises.mkdir(this.root, { recursive: true }),
            fs.promises.mkdir(this.buildDir, { recursive: true }),
            fs.promises.mkdir(this.addonsDir, { recursive: true })
        ]);
        await fs.promises.writeFile(this.file("tsconfig.json"), JSON.stringify({
            compilerOptions: {
                module: "NodeNext",
                target: "ESNext",
                noEmit: true
            },
            include: ["index.ts"]
        }, null, 4), "utf-8");
        await fs.promises.writeFile(this.file("mixery.json"), JSON.stringify(<ConfigurationFile> {
        }, null, 4), "utf-8");
        await this.updatePackageIndex();
    }

    async updatePackageIndex() {
        await fs.promises.writeFile(this.file("package.json"), JSON.stringify({
            name: "@mixery/daw",
            description: "Mixery Digital Audio Workspace. Please don't edit package.json. Use mixerycli instead: @mixery/cli.",
            version: "0.0.1",
            dependencies: {
                ...await this.useDependency("@mixery/engine", "^1.0.0")
            }
        }, null, 2), "utf-8");
        await new Promise((resolve, reject) => {
            childProcess.exec("npm install", { cwd: this.root }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                process.stdout.write(stdout);
                process.stderr.write(stderr);
                resolve(null);
            });
        })
    }

    async build() {
        const defaultAddons = await fs.promises.readdir(this.file("addons"));
        Logger.stage(`Configuration details:`);
        Logger.stage(` - Using ${defaultAddons.length} default addon(s):`);
        defaultAddons.forEach(v => Logger.stage(`   + ${v}`));

        // Build addons
        Logger.stage(`Building all addons...`);
        await fs.promises.mkdir(this.file("build/addons"), { recursive: true });
        await Promise.all(defaultAddons.map(async addon => {
            const addonRoot = this.file(`addons/${addon}`);
            await buildAddon(addonRoot, JSON.parse(await fs.promises.readFile(`${addonRoot}/package.json`, "utf-8")));

            // Copy build result
            await fs.promises.cp(this.file(`addons/${addon}/build`), this.file(`build/addons/${addon}`), { recursive: true });
        }));

        // Step 1: Generate index.js and index.html
        Logger.stage(`Building Mixery...`);
        await fs.promises.writeFile(this.file("index.ts"), [
            "// Please don't edit this file.",
            "// Use mixerycli to configure instead: @mixery/cli",
            `import * as engine from "@mixery/engine";`,
            ``,
            `export namespace Mixery {`,
            `    export const workspace = new engine.Workspace(new AudioContext({`,
            `        latencyHint: "interactive",`,
            `        sampleRate: 48000`,
            `    }));`,
            `}`,
            ``,
            ...defaultAddons.map(addon => `Mixery.workspace.loadAddonFromUrl("addons/${addon}");`),
            ``,
            `globalThis.Mixery = Mixery;`,
        ].join("\n"), "utf-8");
        await fs.promises.writeFile(this.file("build/index.html"), [
            `<!DOCTYPE html>`,
            `<html>`,
            `<head>`,
            `    <meta charset='utf-8'>`,
            `    <meta http-equiv='X-UA-Compatible' content='IE=edge'>`,
            `    <title>Mixery</title>`,
            `    <meta name='viewport' content='width=device-width, initial-scale=1'>`,
            `    <script src='mixery.bundle.js' type='module' defer></script>`,
            `</head>`,
            `<body></body>`,
            `</html>`
        ].join("\n"), "utf-8");

        // Step 2: Build
        await esbuild.build({
            bundle: true,
            outfile: this.file("build/mixery.bundle.js"),
            format: "iife",
            entryPoints: [`${this.root}/index.ts`]
        });
    }
}