import { logger } from "@vendetta";

import { applyActivity, clearActivity, startAutoShuffle, stopAutoShuffle, vstorage } from "./activity";
import Settings from "./Settings";

export default {
    onLoad: () => {
        vstorage.enabled ??= false;
        vstorage.videoUrl ??= "";
        vstorage.title ??= "";
        vstorage.channel ??= "";
        vstorage.fromPlaylist ??= false;
        vstorage.thumbnail ??= "";
        vstorage.afkMode ??= false;
        vstorage.afkText ??= "";
        vstorage.autoShuffle ??= false;
        vstorage.playlistVideos ??= [];

        if (vstorage.enabled || vstorage.afkMode) applyActivity();
        startAutoShuffle();
        logger.log("[YoutubeRPC] loaded");
    },
    onUnload: () => {
        stopAutoShuffle();
        clearActivity();
        logger.log("[YoutubeRPC] unloaded");
    },
    settings: Settings,
};
