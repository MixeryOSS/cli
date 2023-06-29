import * as engine from "@mixery/engine";

// Minimals Addons Global API
// TODO: Create this as npm package

declare global {
    /**
     * Addon id, which is defined in ``addon.metadata.json``.
     */
    const id: string;

    /**
     * Metadata, which is defined in ``addon.metadata.json``.
     */
    const metadata: engine.AddonInfo & { id: string; };

    /**
     * The current addon instance.
     */
    const addon: engine.Addon;
}