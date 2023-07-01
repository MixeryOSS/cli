import { Logger, targetDir } from "..";
import { FileSystemView } from "../system/FileSystemView"
import { MixeryJsonAny } from "../system/MixeryJson";

export async function configureLink(options: Record<string, string[]>) {
    const fsv = new FileSystemView(targetDir);
    const config: MixeryJsonAny = await fsv.json("mixery.json");
    if (!config.links) config.links = {};

    if (options["add"]) options["add"].forEach(e => {
        const [k, v] = e.split(":", 2);
        config.links[k] = v;
        Logger.stage(`Added ${k} => ${v}`);
    });
    if (options["remove"]) options["remove"].forEach(k => {
        delete config.links[k];
        Logger.stage(`Removed ${k}`);
    });

    await fsv.json("mixery.json", config);

    if (Object.keys(config.links).length > 0) {
        Logger.stage("List of all local package links:");
        for (let k in config.links) Logger.stage(`  ${k} => ${config.links[k]}`);
    } else {
        Logger.stage("No local package links.");
    }
}