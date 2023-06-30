import { Logger, targetDir } from "..";
import { MixeryConfigView } from "../system/MixeryConfigView";

export async function newConfiguration(options: Record<string, string[]>) {
    Logger.stage(`Creating new Mixery configuration in '${targetDir}'...`);
    let configView = new MixeryConfigView(targetDir);
    if (configView.exists("mixery.json")) {
        process.stderr.write(`Error: 'mixery.json' exists in target directory.\n`);
        process.exit(1);
    }

    await configView.createNew();
    Logger.stage(`Done.`);
}