import { Logger, targetDir } from "..";
import { AddonView } from "../system/AddonView";
import { FileSystemView } from "../system/FileSystemView";
import { MixeryConfigView } from "../system/MixeryConfigView";
import { MixeryJsonAny } from "../system/MixeryJson";

export async function build() {
    let fsView = new FileSystemView(targetDir);
    if (!fsView.exists("mixery.json")) {
        process.stderr.write(`Error: 'mixery.json' doesn't exists in current directory.`);
        process.exit(1);
    }

    const mixeryJson = (await fsView.json("mixery.json")) as MixeryJsonAny;

    if (mixeryJson.type == "configuration") {
        Logger.stage("Detected Mixery configuration");
        const configView = new MixeryConfigView(targetDir);
        Logger.stage("Building Mixery DAW...");
        await configView.build(true);
        Logger.stage("Done.");
    } else if (mixeryJson.type == "addon") {
        Logger.stage("Detected Mixery addon");
        const addonView = new AddonView(targetDir);
        const packageJson = await addonView.json("package.json");
        Logger.stage(`Building addon: ${packageJson.name} v${packageJson.version}...`);
        await addonView.build(true);
        Logger.stage("Done.");
    }
}