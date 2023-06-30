import { PackageOverrides } from "..";
import { AddonJson } from "./AddonView";
import { MixeryConfigJson } from "./MixeryConfigView";

export interface MixeryJson<TType extends string> {
    type: TType;
    overrides?: PackageOverrides;
}

export type MixeryJsonAny = MixeryConfigJson | AddonJson;