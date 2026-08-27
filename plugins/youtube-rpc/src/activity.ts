import { FluxDispatcher } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

import { getExternalAsset } from "./api";

export const vstorage = storage as {
    enabled: boolean;
    videoUrl: string;
    title: string;
    channel: string;
    thumbnail: string; // original https:// thumbnail URL from oEmbed
};

// The same client-side trick every "Custom Rich Presence" plugin uses
// (verified against Vencord's customRPC plugin and nexpid's published
// Revenge/Bunny port): dispatching this Flux action directly is what Discord
// itself does internally for local game-activity detection, Spotify, etc.
// Unlike everything else in Avatar Override, this is NOT local-only — it
// gets sent up to Discord's gateway and is visible to anyone viewing your
// profile/status.
const SOCKET_ID = "YoutubeRPC@AvatarOverride";

async function buildActivity() {
    if (!vstorage.title) return undefined;

    const assetPath = vstorage.thumbnail ? await getExternalAsset(vstorage.thumbnail) : undefined;

    return {
        name: "YouTube",
        application_id: "0",
        type: 3, // Watching
        flags: 1, // Instance
        details: vstorage.title,
        state: vstorage.channel ? `by ${vstorage.channel}` : undefined,
        timestamps: { start: Date.now() },
        assets: assetPath
            ? { large_image: `mp:${assetPath}`, large_text: vstorage.channel || "YouTube" }
            : undefined,
        buttons: vstorage.videoUrl ? ["動画を見る"] : undefined,
        metadata: vstorage.videoUrl ? { button_urls: [vstorage.videoUrl] } : undefined,
    };
}

export async function applyActivity() {
    const activity = vstorage.enabled ? await buildActivity() : undefined;
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: activity ?? {},
        socketId: SOCKET_ID,
    });
}

export function clearActivity() {
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: {},
        socketId: SOCKET_ID,
    });
}
