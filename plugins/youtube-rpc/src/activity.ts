import { FluxDispatcher } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

import { getExternalAsset } from "./api";

export const vstorage = storage as {
    enabled: boolean;
    videoUrl: string;
    title: string;
    channel: string; // plain channel name only, no decoration
    fromPlaylist: boolean;
    thumbnail: string; // original https:// thumbnail URL from oEmbed
    afkMode: boolean;
    afkText: string;
};

// The same client-side trick every "Custom Rich Presence" plugin uses
// (verified against Vencord's customRPC plugin and nexpid's published
// Revenge/Bunny port): dispatching this Flux action directly is what Discord
// itself does internally for local game-activity detection, Spotify, etc.
// Unlike everything else in Avatar Override, this is NOT local-only — it
// gets sent up to Discord's gateway and is visible to anyone viewing your
// profile/status.
const SOCKET_ID = "YoutubeRPC@AvatarOverride";

async function buildYoutubeActivity() {
    if (!vstorage.title) return undefined;

    const assetPath = vstorage.thumbnail ? await getExternalAsset(vstorage.thumbnail) : undefined;

    return {
        // The channel name goes in `name` so the activity reads
        // "<チャンネル名>を視聴中" instead of a generic "YouTubeを視聴中".
        name: vstorage.channel || "YouTube",
        application_id: "0",
        type: 3, // Watching
        flags: 1, // Instance
        details: vstorage.title,
        state: vstorage.fromPlaylist ? "プレイリスト再生中" : undefined,
        timestamps: { start: Date.now() },
        assets: assetPath
            ? { large_image: `mp:${assetPath}`, large_text: vstorage.channel || "YouTube" }
            : undefined,
        // Discord never renders your own activity's buttons back to you —
        // only other people viewing your profile see them. This isn't a bug;
        // it's the same for every Rich Presence, including real games.
        buttons: vstorage.videoUrl ? ["動画を見る"] : undefined,
        metadata: vstorage.videoUrl ? { button_urls: [vstorage.videoUrl] } : undefined,
    };
}

function buildAfkActivity() {
    return {
        name: vstorage.afkText || "😴 寝ています",
        application_id: "0",
        type: 0, // Playing — Discord has no "verb-less" activity type outside the separate custom-status system
        flags: 1,
    };
}

export async function applyActivity() {
    // AFK mode always wins over the YouTube status when both are configured.
    const activity = vstorage.afkMode
        ? buildAfkActivity()
        : vstorage.enabled
            ? await buildYoutubeActivity()
            : undefined;

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
