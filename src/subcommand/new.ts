import * as fs from "node:fs";
import * as path from "node:path";
import * as childProcess from "node:child_process";
import { Logger, args, configuration } from "..";
import { ConfigurationOverrides } from "../system/Configuration";

export async function new0() {
    if (args.length == 1) {
        process.stdout.write(`Usage:\n`);
        process.stdout.write(`    mixerycli new Type\n`);
        process.stdout.write(`\n`);
        process.stdout.write(`Available types:\n`);
        process.stdout.write(`    configuration Create new Mixery configuration\n`);
        process.stdout.write(`    addon         Create new Mixery addon\n`);
        process.exit(1);
    }

    if (args[1] == "configuration") return await newConfiguration();
    if (args[1] == "addon") return await newAddon(".");
}

async function newConfiguration() {
    if (fs.existsSync("mixery.json")) {
        process.stderr.write("Error: Can't use current directory: Mixery already exists in current directory\n");
        process.exit(1);
    }

    Logger.stage("Creating new Mixery configuration in current directory for you, hold tight...");
    const [_, changelog] = await Promise.all([
        configuration.create(),
        fs.promises.readFile(path.resolve(__dirname, "../../changelog.daw.txt"))
    ]);
    Logger.stage("Done.");

    process.stdout.write(changelog);
}

async function newAddon(root: string) {
    function file(f: string) { return path.resolve(root, f); }
    const addonId = path.basename(path.resolve(root));
    const overrides = fs.existsSync(file("overrides.json"))? JSON.parse(await fs.promises.readFile(file("overrides.json"), "utf-8")) : {};
    function useDependency(id: string, version: string) {
        let packages = overrides.packages ?? {};
        let obj = {};
        obj[id] = packages[id] ?? version;
        return obj;
    }

    if (fs.existsSync("package.json")) {
        process.stderr.write("Error: Can't use current directory: package.json already existed\n");
        process.exit(1);
    }

    Logger.stage("Creating new empty Mixery addon...");
    const [_, changelog] = await Promise.all([
        fs.promises.writeFile(file("package.json"), JSON.stringify({
            name: addonId,
            displayName: addonId,
            version: "0.0.1",
            description: "Description of your addon here...",
            engines: {
                mixery: ">=1.0.0"
            },
            main: "index.ts",
            dependencies: {
                ...useDependency("@mixery/engine", "1.0.0")
            }
        }, null, 2), "utf-8"),
        fs.promises.readFile(path.resolve(__dirname, "../../changelog.api.txt")),
        fs.promises.copyFile(path.resolve(__dirname, "../../templates/addons/mixery-addons.d.ts"), file("mixery-addons.d.ts")),
        fs.promises.copyFile(path.resolve(__dirname, "../../templates/addons/index.ts"), file("index.ts")),
        fs.promises.writeFile(file("tsconfig.json"), JSON.stringify({
            compilerOptions: {
                module: "CommonJS",
                target: "ESNext",
                noEmit: true
            },
            include: ["*.ts"],
            exclude: ["node_modules"]
        }, null, 4), "utf-8")
    ]);
    await new Promise((resolve, reject) => {
        childProcess.exec("npm install", { cwd: root }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            process.stdout.write(stdout);
            process.stderr.write(stderr);
            resolve(null);
        });
    })
    Logger.stage("Done.");
    
    process.stdout.write(changelog);
}