import { AddonJson } from "./AddonView";
import { MixeryConfigJson } from "./MixeryConfigView";

export interface MixeryJson<TType extends string> {
    type: TType;
    links?: Record<string, string>;
}

export type MixeryJsonAny = MixeryConfigJson | AddonJson;