import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { applyActivity, vstorage } from "./activity";
import {
    fetchYoutubeOEmbed,
    fetchYoutubePlaylistMeta,
    fetchYoutubePlaylistVideos,
    getPlaylistId,
    isPlaylistOnlyUrl,
    type YoutubePlaylistVideo,
} from "./api";

const { FormRow, FormSection, FormText, FormInput, FormSwitchRow } = Forms;

function applyVideoSelection(video: YoutubePlaylistVideo, fromPlaylist: boolean) {
    vstorage.videoUrl = video.url;
    vstorage.title = video.title;
    vstorage.channel = video.channel;
    vstorage.fromPlaylist = fromPlaylist;
    vstorage.thumbnail = video.thumbnail;
}

export default function Settings() {
    useProxy(vstorage);

    const [urlInput, setUrlInput] = React.useState(vstorage.videoUrl);
    const [loading, setLoading] = React.useState(false);
    const [playlistVideos, setPlaylistVideos] = React.useState<YoutubePlaylistVideo[] | null>(
        vstorage.playlistVideos?.length ? vstorage.playlistVideos : null,
    );

    const fetchInfo = async () => {
        const url = urlInput.trim();
        if (!url) {
            showToast("YouTubeのURLを入力してください", getAssetIDByName("CircleXIcon-primary"));
            return;
        }

        setLoading(true);
        try {
            if (isPlaylistOnlyUrl(url)) {
                const playlistId = getPlaylistId(url);
                try {
                    const videos = await fetchYoutubePlaylistVideos(playlistId!);
                    setPlaylistVideos(videos);
                    vstorage.playlistVideos = videos;
                    // Play the first video in the playlist by default — the
                    // list below lets you switch to any other one.
                    applyVideoSelection(videos[0], true);
                    showToast("プレイリスト内の動画を取得しました", getAssetIDByName("CircleCheckIcon-primary"));
                } catch {
                    // Feed lookup failed for some reason — fall back to just
                    // the playlist's own title/thumbnail instead of a specific video.
                    const meta = await fetchYoutubePlaylistMeta(url);
                    setPlaylistVideos(null);
                    vstorage.playlistVideos = [];
                    vstorage.videoUrl = url;
                    vstorage.title = `プレイリスト: ${meta.title}`;
                    vstorage.channel = "";
                    vstorage.fromPlaylist = true;
                    vstorage.thumbnail = meta.thumbnail ?? "";
                    showToast("プレイリスト情報を取得しました", getAssetIDByName("CircleCheckIcon-primary"));
                }
            } else {
                setPlaylistVideos(null);
                vstorage.playlistVideos = [];
                const info = await fetchYoutubeOEmbed(url);
                vstorage.videoUrl = url;
                vstorage.channel = info.author_name;
                vstorage.fromPlaylist = new URL(url).searchParams.has("list");
                vstorage.title = info.title;
                vstorage.thumbnail = info.thumbnail_url;
                showToast("動画情報を取得しました", getAssetIDByName("CircleCheckIcon-primary"));
            }

            if (vstorage.enabled) await applyActivity();
        } catch {
            showToast("取得に失敗しました。URLを確認してください", getAssetIDByName("CircleXIcon-primary"));
        } finally {
            setLoading(false);
        }
    };

    const selectPlaylistVideo = async (video: YoutubePlaylistVideo) => {
        applyVideoSelection(video, true);
        if (vstorage.enabled) await applyActivity();
    };

    const toggleEnabled = async (value: boolean) => {
        vstorage.enabled = value;
        if (value && !vstorage.title) {
            showToast("先に動画情報を取得してください", getAssetIDByName("CircleXIcon-primary"));
            vstorage.enabled = false;
            return;
        }
        await applyActivity();
        showToast(value ? "ステータスに表示しました" : "ステータスを消しました", getAssetIDByName("CircleCheckIcon-primary"));
    };

    const toggleAfk = async (value: boolean) => {
        vstorage.afkMode = value;
        await applyActivity();
        showToast(value ? "AFKステータスに切り替えました" : "AFKステータスを解除しました", getAssetIDByName("CircleCheckIcon-primary"));
    };

    return (
        <RN.ScrollView style={{ flex: 1 }}>
            <FormSection title="使い方">
                <FormText style={{ padding: 16 }}>
                    見ているYouTube動画のURLを貼ると、タイトル・チャンネル名・サムネイルを自動取得して「視聴中」ステータスとして表示します。プレイリストのURL (youtube.com/playlist?list=...) を貼った場合は、プレイリスト内の動画一覧から表示したい動画を選べるほか、「自動シャッフル」をオンにすると5分ごとに他の動画へランダムに自動で切り替わります。
                </FormText>
                <FormText style={{ paddingHorizontal: 16, paddingBottom: 16, color: semanticColors.TEXT_FEEDBACK_CRITICAL }}>
                    注意: これはAvatar Overrideの他の機能と違い、ローカル表示ではありません。実際にDiscordのステータスとして送信され、フレンドや他のユーザーにも見えます。
                </FormText>
                <FormText style={{ paddingHorizontal: 16, paddingBottom: 16, color: semanticColors.TEXT_MUTED }}>
                    「動画を見る」ボタンは、Discordの仕様上自分の画面には表示されません (他の人から見た時だけ表示されます)。実際のゲームのRich Presenceでも同じ仕様です。
                </FormText>
            </FormSection>

            <FormSection title="YouTube動画・プレイリストのURL">
                <FormInput
                    title="動画URL / プレイリストURL"
                    placeholder="https://youtu.be/... または .../playlist?list=..."
                    value={urlInput}
                    onChange={(text: string) => setUrlInput(text)}
                />
                <FormRow
                    label={loading ? "取得中..." : "情報を取得"}
                    leading={<FormRow.Icon source={getAssetIDByName("DownloadIcon")} />}
                    onPress={fetchInfo}
                    disabled={loading}
                />
            </FormSection>

            {!!playlistVideos && playlistVideos.length > 1 && (
                <FormSection title="自動シャッフル">
                    <FormText style={{ paddingHorizontal: 16, paddingBottom: 8, color: semanticColors.TEXT_MUTED }}>
                        オンにすると、5分ごとにプレイリスト内の他の動画へランダムに切り替わります (直前と同じ動画は選ばれません)。
                    </FormText>
                    <FormSwitchRow
                        label="5分ごとにランダムな他の動画へ切り替える"
                        value={vstorage.autoShuffle}
                        onValueChange={(value: boolean) => { vstorage.autoShuffle = value; }}
                    />
                </FormSection>
            )}

            {!!playlistVideos && (
                <FormSection title={`プレイリスト内の動画を選択 (${playlistVideos.length}件)`}>
                    <FormText style={{ paddingHorizontal: 16, paddingBottom: 8, color: semanticColors.TEXT_MUTED }}>
                        タップすると、その動画を「視聴中」として表示します。
                    </FormText>
                    {playlistVideos.map(video => (
                        <RN.TouchableOpacity
                            key={video.videoId}
                            onPress={() => selectPlaylistVideo(video)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                backgroundColor: vstorage.videoUrl === video.url
                                    ? "rgba(127,127,127,0.2)"
                                    : undefined,
                            }}
                        >
                            {!!video.thumbnail && (
                                <RN.Image
                                    source={{ uri: video.thumbnail }}
                                    style={{ width: 64, height: 36, borderRadius: 4, marginRight: 12 }}
                                    resizeMode="cover"
                                />
                            )}
                            <RN.View style={{ flex: 1 }}>
                                <RN.Text numberOfLines={2}>
                                    {video.title}
                                </RN.Text>
                                {!!video.channel && (
                                    <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontSize: 12 }} numberOfLines={1}>
                                        {video.channel}
                                    </RN.Text>
                                )}
                            </RN.View>
                        </RN.TouchableOpacity>
                    ))}
                </FormSection>
            )}

            {!!vstorage.title && (
                <FormSection title="プレビュー">
                    {!!vstorage.thumbnail && (
                        <RN.Image
                            source={{ uri: vstorage.thumbnail }}
                            style={{ width: "100%", height: 180, borderRadius: 8, marginBottom: 12 }}
                            resizeMode="cover"
                        />
                    )}
                    <FormInput
                        title="タイトル (詳細として表示)"
                        value={vstorage.title}
                        onChange={(text: string) => { vstorage.title = text; }}
                    />
                    <FormInput
                        title="チャンネル名 (「〜を視聴中」に表示)"
                        value={vstorage.channel}
                        onChange={(text: string) => { vstorage.channel = text; }}
                    />
                </FormSection>
            )}

            <FormSection title="ステータス">
                <FormSwitchRow
                    label="ステータスに表示する"
                    subLabel="オンにすると、上のプレビュー内容が実際にDiscordのステータスとして送信されます (フレンドにも見えます)"
                    value={vstorage.enabled}
                    onValueChange={toggleEnabled}
                />
            </FormSection>

            <FormSection title="AFKモード">
                <FormText style={{ paddingHorizontal: 16, paddingBottom: 8, color: semanticColors.TEXT_MUTED }}>
                    寝ている時・離席中など、YouTube視聴中の表示より優先して固定のステータスを表示します。オフにすると、上の「ステータスに表示する」の状態に戻ります。
                </FormText>
                <FormInput
                    title="AFK中に表示する文言"
                    placeholder="😴 寝ています"
                    value={vstorage.afkText}
                    onChange={(text: string) => { vstorage.afkText = text; }}
                />
                <FormSwitchRow
                    label="AFKモードを有効にする"
                    value={vstorage.afkMode}
                    onValueChange={toggleAfk}
                />
            </FormSection>
        </RN.ScrollView>
    );
}
