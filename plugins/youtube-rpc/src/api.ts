import { findByProps } from "@vendetta/metro";

const { getToken } = findByProps("getToken");

// Discord's Rich Presence images must be either a real uploaded Application
// asset, or go through this "external asset" proxy — a raw https:// URL does
// not work directly. This is the same technique (and endpoint) used by
// nexpid's published CustomRPC plugin (applications/0 is the wildcard app id
// for presences with no real registered Discord Application).
const proxyAssetCache: Record<string, string> = {};
export async function getExternalAsset(url: string): Promise<string> {
    if (proxyAssetCache[url]) return proxyAssetCache[url];

    const res = await fetch("https://discord.com/api/v9/applications/0/external-assets", {
        method: "POST",
        headers: {
            authorization: getToken(),
            "content-type": "application/json",
        },
        body: JSON.stringify({ urls: [url] }),
    });
    const [{ external_asset_path }] = await res.json();

    let link: string = external_asset_path;
    if (link.startsWith("https://media.discordapp.net")) {
        link = link.split("/").slice(3).join("/");
    }

    proxyAssetCache[url] = link;
    return link;
}

export interface YoutubeOEmbed {
    title: string;
    author_name: string;
    thumbnail_url: string;
}

// YouTube's own public oEmbed endpoint — no API key needed, works for any
// youtube.com/youtu.be video URL. Used to auto-fill the video title, channel
// name, and thumbnail from just a pasted link.
export async function fetchYoutubeOEmbed(videoUrl: string): Promise<YoutubeOEmbed> {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
    if (!res.ok) throw new Error(`oEmbed lookup failed (${res.status})`);
    return res.json();
}
