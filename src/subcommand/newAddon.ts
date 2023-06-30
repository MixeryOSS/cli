import { Logger, targetDir } from "..";
import { AddonView } from "../system/AddonView";

export async function newAddon(options: Record<string, string[]>) {
    Logger.stage(`Creating new Mixery addon in '${targetDir}'...`);
    let addonView = new AddonView(targetDir);
    if (addonView.exists("mixery.json")) {
        process.stderr.write(`Error: 'mixery.json' exists in target directory.\n`);
        process.stderr.write(`Tip: If you want to create an addon in Mixery configuration, use '-target-dir=addons/<Addon Name>' option.\n`);
        process.exit(1);
    }

    await addonView.createNew();
    Logger.stage(`Done.`);
}