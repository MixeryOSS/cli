import * as path from "node:path";
import { Configuration } from "./system/Configuration";
import { new0 } from "./subcommand/new";
import { build } from "./subcommand/build";

export namespace Logger {
    export function stage(message: string) {
        process.stdout.write(`\x1b[90m[\x1b[96m*\x1b[90m]\x1b[0m ${message}\n`);
    }
}

export const args = process.argv.splice(2);
export const configuration = new Configuration(".");
export const subcommands: Record<string, () => any> = {
    "new": new0,
    "build": build
};

if (args.length == 0) {
    process.stdout.write(`This is Mixery command-line tool\n`);
    process.stdout.write(`Usage:\n`);
    process.stdout.write(`    mixerycli Subcommand\n`);
    process.stdout.write(`\n`);
    process.stdout.write(`Available subcommands:\n`);
    process.stdout.write(`    new           Create new Mixery configuration or addon\n`);
    process.stdout.write(`    build         Build whatever that is in current directory (either Mixery or addon)\n`);
    process.exit(1);
}

if (!subcommands[args[0]]) {
    process.stderr.write(`Unknown subcommand: ${args[0]}\n`);
    process.exit(1);
}

subcommands[args[0]]();