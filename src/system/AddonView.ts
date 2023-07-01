import * as fs from "node:fs";
import * as path from "node:path";
import * as esbuild from "esbuild";
import { FileSystemView } from "./FileSystemView";
import { MixeryJson } from "./MixeryJson";
import { Logger, installPackages, links, options } from "..";

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
            ...(Object.keys(links).length > 0? { links: links } : {}),
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
                "@mixery/engine": "^1.0.0",
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
        await installPackages(this.root);
    }

    async build(logging = false) {
        const config: AddonJson = await this.json("mixery.json");
        if (config.links) Object.keys(config.links).forEach(k => links[k] = config.links[k]);

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