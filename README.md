# YouTube Rich Presence (Revenge plugin)

見ているYouTube動画のURLを貼ると、タイトル・チャンネル名・サムネイルを自動取得して、Discordのステータスに「視聴中」として表示するRevengeプラグインです。

**注意:** これは他のローカル表示専用プラグイン (例: Avatar Override) とは違い、実際にDiscordのステータスとして送信されます。フレンドや同じサーバーの人など、あなたのプロフィールを見られる人には表示内容が見えます。

## インストール方法

1. Revengeの `設定 > プラグイン` を開きます。
2. 右上の「+」からリポジトリURLとして次を追加します。
   ```
   https://hihei56.github.io/revenge-youtube-rpc-/youtube-rpc/
   ```
3. 一覧に出てくる `YouTube Rich Presence` をインストールして有効化します。
4. プラグインの設定画面を開きます。
   - **動画URL**: 見ているYouTube動画のURL (`https://youtu.be/...` や `https://www.youtube.com/watch?v=...`) を貼り付け、「情報を取得」をタップします。
   - タイトル・チャンネル名・サムネイルが自動で取得され、プレビューに表示されます。必要ならタイトル・チャンネル名は手動で編集できます。
   - 「ステータスに表示する」をオンにすると、実際にDiscordのステータスとして送信されます。別の動画に切り替えたいときは、新しいURLで「情報を取得」をやり直してください (オンのままなら自動で更新されます)。
   - オフにする、またはプラグインを無効化すると、ステータスは消えます。

> GitHub Pagesの反映には初回のみ数分かかることがあります。上記URLが404になる場合は少し待ってから再度お試しください。

## 仕組み

- タイトル・チャンネル名・サムネイルの取得には、YouTube公式の oEmbed API (`https://www.youtube.com/oembed`) を使用しています。APIキーは不要です。
- ステータスの表示には、DiscordクライアントがローカルのAI活動検出 (ゲームプレイ中表示など) に内部で使っているのと同じ仕組み (`LOCAL_ACTIVITY_UPDATE` というFlux アクション) を直接発行しています。これはVencordの `CustomRPC` や、Revenge/Bunny向けに実際に公開されている `CustomRPC` プラグインと同じ手法です。
- サムネイル画像は、そのままのURLではDiscordのステータス画像として使えないため、Discord公式の外部アセットプロキシ (`applications/0/external-assets`) に一度変換してから使用しています。
- 完全自動でYouTubeアプリの再生中動画を検知することはできません。Revengeのプラグインは Discordアプリ内のJavaScriptとしてのみ動作するため、別アプリ (YouTubeアプリなど) が何を再生しているかを直接知る手段がないためです。動画URLを貼る操作は手動で行う必要があります。

保存データはプラグインのストレージ (`@vendetta/plugin` の `storage`) に保持されます。

## ソースからビルドする場合

```sh
npm install
npm run build
```

`dist/youtube-rpc/` にビルド済みの `manifest.json` と `index.js` が出力されます。
`main` ブランチへのpushで `.github/workflows/deploy.yml` が自動的にビルドし、GitHub Pagesへデプロイします
(pushイベントで自動起動しない場合は、GitHubのActionsタブから手動で "Run workflow" してください)。

## 注意事項

- モバイル版Discord (Revenge) 専用です。
- ステータスは実際にDiscordのサーバーに送信され、他のユーザーに見えます。ローカル表示専用のプラグインではありません。
- Discordのアプリ内部実装の変更で、動作しなくなる可能性があります。
