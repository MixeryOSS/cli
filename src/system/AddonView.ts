import * as fs from "node:fs";
import * as path from "node:path";
import * as childProcess from "node:child_process";
import * as esbuild from "esbuild";
import { FileSystemView } from "./FileSystemView";
import { MixeryJson } from "./MixeryJson";
import { Logger, getPackage, options, packageOverrides } from "..";

export class AddonView extends FileSystemView {
    readonly id: string;

    constructor(root: string) {
        super(root);
        this.id = path.basename(path.resolve(root));
    }

    async createNew() {
        if (!fs.existsSync(this.root)) await fs.promises.mkdir(this.root, { recursive: true });

        await this.json("mixery.json", <AddonJson> {
            type: "addon",
            ...(Object.keys(packageOverrides).length > 0? { overrides: packageOverrides } : {}),
            entryPoints: ["src/index.ts"],
            externalModules: [
                "@mixery/engine",
                "@mixery/state-machine",
            ]
        });
        await this.json("package.json", {
            name: this.id,
            displayName: this.id,
            version: "0.0.1",
            description: "Mixery Addon",
            type: "module",
            engines: {
                mixery: ">=1.0.0"
            },
            scripts: {
                build: "mixerycli build"
            },
            dependencies: {
                ...getPackage("@mixery/engine", "^1.0.0", packageOverrides)
            },
        });
        await this.json("tsconfig.json", {
            compilerOptions: {
                module: "NodeNext",
                target: "ESNext",
                noEmit: true,
                incremental: true
            },
            include: ["src"],
            exclude: ["node_modules"]
        });
        await fs.promises.mkdir(this.file("src"));
        await fs.promises.copyFile(path.resolve(__dirname, "../../templates/addons/index.ts"), this.file("src/index.ts"));
        await fs.promises.copyFile(path.resolve(__dirname, "../../templates/addons/mixery-addons.d.ts"), this.file("src/mixery-addons.d.ts"));
        await new Promise((resolve, reject) => {
            let proc = childProcess.exec("npm install", { cwd: this.root });
            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);
            proc.on("error", reject);
            proc.on("exit", (code, signal) => {
                if (code != 0) reject(new Error(`Program exited with code ${code}`));
                else resolve(null);
            });
        });
    }

    async build(logging = false) {
        const config: AddonJson = await this.json("mixery.json");
        const packageJson = await this.json("package.json");
        
        if (fs.existsSync(this.file("build")) && (options["clean"] ?? ["false"])[0] == "true") {
            if (logging) Logger.stage(`--clean=true defined, cleaning old build...`);
            await fs.promises.rm(this.file("build"), { recursive: true });
        }

        await esbuild.build({
            bundle: true,
            outfile: this.file("build/addon.js"),
            entryPoints: config.entryPoints.map(v => this.file(v)),
            external: config.externalModules,
        });

        if (logging) Logger.stage("Writing addon metadata...");
        await this.json("build/addon.metadata.json", {
            id: packageJson.name,
            main: "addon.js",
            ...(packageJson.engines?.mixery? { target: packageJson.engines.mixery } : {}),
            ...(packageJson.displayName? { name: packageJson.displayName } : {}),
            ...(packageJson.author? { authors: (packageJson.author as string).split(",").map(v => v.trim()) } : {}),
            ...(packageJson.description? { description: packageJson.description } : {}),
        });
    }
}

export interface AddonJson extends MixeryJson<"addon"> {
    entryPoints: string[];
    externalModules: string[];
}