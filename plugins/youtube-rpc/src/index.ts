import { logger } from "@vendetta";

import { applyActivity, clearActivity, vstorage } from "./activity";
import Settings from "./Settings";

export default {
    onLoad: () => {
        vstorage.enabled ??= false;
        vstorage.videoUrl ??= "";
        vstorage.title ??= "";
        vstorage.channel ??= "";
        vstorage.thumbnail ??= "";

        if (vstorage.enabled) applyActivity();
        logger.log("[YoutubeRPC] loaded");
    },
    onUnload: () => {
        clearActivity();
        logger.log("[YoutubeRPC] unloaded");
    },
    settings: Settings,
};
