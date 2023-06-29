import { Logger, configuration } from "..";
import * as fs from "node:fs";
import * as esbuild from "esbuild";
import * as path from "node:path";
import { Configuration } from "../system/Configuration";

export async function build() {
    const packageJson = JSON.parse(await fs.promises.readFile(configuration.file("package.json"), "utf-8"));
    if (packageJson.name == "@mixery/daw") return await buildMixery(configuration);
    if (packageJson.engines?.mixery) return await buildAddon(configuration.root, packageJson);

    process.stderr.write("Error: Can't identify project type to build");
    process.exit(1);
}

export async function buildMixery(configuration: Configuration) {
    Logger.stage("Detected: Mixery configuration");
    await configuration.build();
    Logger.stage("Done.");
}

export async function buildAddon(root: string, packageJson: any) {
    function file(f: string) { return path.resolve(root, f); }

    Logger.stage(`Detected: Mixery addon: ${packageJson.name} v${packageJson.version}`);
    await esbuild.build({
        bundle: true,
        outfile: file("build/script.js"),
        entryPoints: [file(packageJson.main)],
        external: [
            "@mixery/engine",
            "@mixery/state-machine",
            "@mixery/uikit",
            // TODO: Add Mixery components here...
        ]
    });
    await fs.promises.writeFile(file("build/addon.metadata.json"), JSON.stringify({
        // TODO: TypeScript build support for npm package format
        // Basically you can use "npm pack" and drop it to Mixery DAW to import addon
        id: packageJson.name,
        name: packageJson.displayName ?? packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        authors: [packageJson.author ?? "n/a"],
        main: "script.js"
    }, null, 4), "utf-8");

    Logger.stage("Skipped stage: Build to tarball");
    
    Logger.stage("Done.");
}