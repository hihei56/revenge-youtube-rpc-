import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

import { applyActivity, vstorage } from "./activity";
import { fetchYoutubeOEmbed, fetchYoutubePlaylistMeta, isPlaylistOnlyUrl } from "./api";

const { FormRow, FormSection, FormText, FormInput, FormSwitchRow } = Forms;

export default function Settings() {
    useProxy(vstorage);

    const [urlInput, setUrlInput] = React.useState(vstorage.videoUrl);
    const [loading, setLoading] = React.useState(false);

    const fetchInfo = async () => {
        const url = urlInput.trim();
        if (!url) {
            showToast("YouTubeのURLを入力してください", getAssetIDByName("CircleXIcon-primary"));
            return;
        }

        setLoading(true);
        try {
            if (isPlaylistOnlyUrl(url)) {
                const meta = await fetchYoutubePlaylistMeta(url);
                vstorage.videoUrl = url;
                vstorage.title = `プレイリスト: ${meta.title}`;
                vstorage.channel = "";
                vstorage.thumbnail = meta.thumbnail ?? "";
                showToast("プレイリスト情報を取得しました", getAssetIDByName("CircleCheckIcon-primary"));
            } else {
                const info = await fetchYoutubeOEmbed(url);
                vstorage.videoUrl = url;
                vstorage.title = info.title;
                vstorage.channel = new URL(url).searchParams.has("list")
                    ? `${info.author_name} • プレイリスト再生中`
                    : info.author_name;
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

    return (
        <RN.ScrollView style={{ flex: 1 }}>
            <FormSection title="使い方">
                <FormText style={{ padding: 16 }}>
                    見ているYouTube動画のURLを貼ると、タイトル・チャンネル名・サムネイルを自動取得して「視聴中」ステータスとして表示します。プレイリストのURL (youtube.com/playlist?list=...) にも対応しています。
                </FormText>
                <FormText style={{ paddingHorizontal: 16, paddingBottom: 16, color: semanticColors.TEXT_FEEDBACK_CRITICAL }}>
                    注意: これはAvatar Overrideの他の機能と違い、ローカル表示ではありません。実際にDiscordのステータスとして送信され、フレンドや他のユーザーにも見えます。
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
                        title="チャンネル名 (状態として表示)"
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
        </RN.ScrollView>
    );
}
