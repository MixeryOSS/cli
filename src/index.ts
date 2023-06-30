import * as path from "node:path";
import { MixeryConfigView } from "./system/MixeryConfigView";
import { FileSystemView } from "./system/FileSystemView";
import { newConfiguration } from "./subcommand/newConfiguration";
import { build } from "./subcommand/build";
import { newAddon } from "./subcommand/newAddon";

export namespace Logger {
    export function stage(message: string) {
        process.stdout.write(`\x1b[90m[\x1b[96m*\x1b[90m]\x1b[0m ${message}\n`);
    }
}

export type SubcommandEnd = (options: Record<string, string[]>) => any;
export interface Subcommand {
    [k: string]: SubcommandEnd | Subcommand;
}

export const programArgs = process.argv.splice(2);
export const args: string[] = [];
export const options: Record<string, string[]> = {};
for (let i = 0; i < programArgs.length; i++) {
    const arg = programArgs[i];

    if (arg.startsWith("-")) {
        const key = arg.substring(arg.startsWith("--")? 2 : 1).split("=", 2)[0];
        let value: string;

        if (arg.includes("=")) {
            value = arg.split("=", 2)[1];
        } else {
            value = programArgs[++i];
        }

        options[key] = options[key] ?? [];
        options[key].push(value);
    } else {
        args.push(arg);
    }
}

export type PackageOverrides = Record<string, string>;
export const packageOverrides: PackageOverrides = {};
if (options["package-override"]) options["package-override"].forEach(v => {
    const [key, value] = v.split("=", 2);
    packageOverrides[key] = value;
});
export function getPackage(id: string, version: string, external?: PackageOverrides, pathPrefix = ""): object {
    const result: object = {};
    let specifier = (external? external[id] : undefined) ?? packageOverrides[id] ?? version;

    if (specifier.startsWith("file:")) specifier = `file:${pathPrefix}${specifier.substring(5)}`;

    result[id] = specifier;
    return result;
}

export const targetDir = path.resolve((options["target-dir"] ?? ["."])[0]);

export const subcommands: Subcommand = {
    "new": {
        "configuration": newConfiguration,
        "addon": newAddon,
    },
    "build": build,
};

let currentSubcommand: Subcommand | SubcommandEnd = subcommands;
for (let i = 0; i < args.length; i++) {
    if (typeof currentSubcommand == "function") {
        process.stderr.write(`Unknown subcommand: ${args.join(" ")}`);
        process.exit(1);
    }

    currentSubcommand = currentSubcommand[args[i]];

    if (currentSubcommand == null) {
        process.stderr.write(`Unknown subcommand: ${args.join(" ")}`);
        process.exit(1);
    }
}

if (typeof currentSubcommand == "object") {
    process.stdout.write(`This is Mixery command-line tool v1.0.0\n`);
    process.stdout.write(`Usage: ${["mixerycli", ...args].join(" ")} [-Options...] <Subcommand>\n`);
    process.stdout.write(`Available subcommands:\n`);
    Object.keys(currentSubcommand).forEach(sc => process.stdout.write(`    ${sc}\n`));
    process.exit(1);
} else if (typeof currentSubcommand == "function") {
    (currentSubcommand as SubcommandEnd)(options);
}