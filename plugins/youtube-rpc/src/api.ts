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

// A bare playlist URL (youtube.com/playlist?list=...) isn't a supported
// oEmbed resource — YouTube's oEmbed endpoint only covers individual videos.
// There's no equivalent no-key public API for playlists, so this instead
// reads the playlist page's own og:title/og:image meta tags directly, the
// same public metadata a link-preview/unfurl would read.
export function isPlaylistOnlyUrl(url: string): boolean {
    try {
        const { hostname, pathname, searchParams } = new URL(url);
        return /(^|\.)youtube\.com$/.test(hostname) && pathname === "/playlist" && searchParams.has("list");
    } catch {
        return false;
    }
}

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

export interface YoutubePlaylistMeta {
    title: string;
    thumbnail?: string;
}

export async function fetchYoutubePlaylistMeta(playlistUrl: string): Promise<YoutubePlaylistMeta> {
    const res = await fetch(playlistUrl);
    if (!res.ok) throw new Error(`playlist page fetch failed (${res.status})`);
    const html = await res.text();

    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
    if (!titleMatch) throw new Error("could not find playlist title");

    return {
        title: decodeHtmlEntities(titleMatch[1]),
        thumbnail: imageMatch?.[1],
    };
}
