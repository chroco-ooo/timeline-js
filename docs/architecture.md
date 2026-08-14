# Architecture

## 全体構成

本プロジェクトはブラウザだけで動く静的構成です。`index.html` がデモデータと操作UIを持ち、`timeline.js` の `TimelineGenerator` がDOMを生成し、`css/timeline.css` が表示を担当します。GitHub Actions は `main` ブランチのリポジトリ全体をビルドせず GitHub Pages へ配置します。

Controller / Service / Repository / Entity / DTO の各レイヤー、サーバー、DB、外部API連携は存在しません。対応する責務を推測して導入しないでください。

## 主要コンポーネント

| ファイル / クラス | 責務 |
|---|---|
| `timeline.js` / `TimelineGenerator` | オプション保持、日付列生成、DOM描画、レイアウト切り替え、クリック処理、仮想スクロール |
| `css/timeline.css` | 横型・縦型コンポーネント、モバイル表示、フォーカス表示 |
| `index.html` | デモ画面、サンプルデータ、レイアウト切り替え、選択結果表示 |
| `README.md` | 利用者向けセットアップ、公開オプション、データ形式 |
| `.github/workflows/static.yml` | `main` pushまたは手動実行によるGitHub Pages公開 |

## データの流れ

1. 呼び出し元が設定、`projects`、`links` をコンストラクターへ渡します。
2. `render()` が `targetId` のDOMを取得し、`layout` に応じて横型または縦型を選びます。
3. 横型は日付列を生成し、必要なら表示範囲を仮想化して、ヘッダー、グリッド、イベント、SVG接続線、今日マーカーを描画します。
4. 縦型は `eventAt`、`start`、`end` の優先順で日付を解釈し、新しい順にカードを描画します。
5. 操作時は `onProjectClick` を呼ぶか、`clickMode: "link"` なら指定URLへ遷移します。

ライブラリ自身はネットワーク通信、永続化、グローバルな状態管理を行いません。

## エラー処理とログ

- 対象DOMがない場合は `console.error` を出して描画を終了します。
- 横型で日付が範囲外のイベント、または接続先DOMがないリンクは `console.warn` を出して該当項目をスキップします。
- 空の `links` は正常として扱います。
- 構造化ログ、遠隔監視、ユーザー向けエラー画面、例外の共通処理はありません。

## 設計上の注意点

- `TimelineGenerator` は状態と描画を一つのクラスに保持し、既存DOMを描画時に置換します。
- CSSとJavaScriptはDOM ID、`timeline-*` class、固定列幅120px、レーン高80pxにより密接に結合しています。
- 仮想スクロールは180列超で既定有効になり、最寄りの `.timeline-scroll` または親要素をスクロールコンテナとします。
- 画像URLの扱いはレイアウトで異なります。縦型は `http(s)` または `/` 始まりだけを受け入れ、横型は値をCSS背景画像へ設定します。
- 公開オプションやデータ形式を変更するときは後方互換性を維持し、README、API仕様、デモを同時に更新してください。
- 横型・縦型、通常描画・仮想描画、デスクトップ・640px以下の組み合わせを考慮してください。
