# AGENTS.md

## Project Overview

- Timeline Generator は、プロジェクトやイベントを横型グリッドまたは縦型カードで可視化する、ブラウザ向けの軽量 JavaScript ライブラリです。
- ビルド工程や実行時依存はなく、`index.html`、`timeline.js`、`css/timeline.css` からなる静的サイトです。
- `timeline.js` はグローバルな `TimelineGenerator` クラスを提供し、`index.html` は利用例兼デモ、`css/timeline.css` は両レイアウトのスタイルです。
- このファイルはリポジトリ全体に適用します。将来、配下に別の `AGENTS.md` が置かれた場合は、変更対象に最も近いファイルの指示を優先してください。

## Commands

```powershell
# 依存関係のインストール: 不要（package.json と lockfile はありません）

# ローカル表示（リポジトリルートで実行後、http://localhost:8000/ を開く）
python -m http.server 8000

# JavaScript の構文確認
node --check timeline.js
```

- lint、format、typecheck、test、build、DB migration のコマンドは設定されていません。未確認のコマンドを推測で追加・実行しないでください。
- GitHub Actions はテストやビルドをせず、`main` の内容をそのまま GitHub Pages に公開します。

## Code Style

- 既存コードに合わせ、JavaScript は 2 スペース、ダブルクォート、セミコロンを使用し、DOM 操作は `TimelineGenerator` の小さなメソッドへ分けます。
- 公開オプションや `projects` / `links` のデータ形式を変える場合は、後方互換性を保ち、同じ変更で `README.md` と `index.html` の例も更新してください。
- 横型は日付列、レーン、接続線を扱い、縦型は新しい順のカード表示を扱います。一方だけの変更で他方を壊さないよう、`layout` ごとの分岐を維持してください。
- CSS は `#timeline-container` 配下と `timeline-*` クラスを基本にし、既存の 640px モバイル表示とアクセシビリティ用 focus 表示を維持してください。
- 新しいフレームワーク、依存関係、ビルド工程は、明示的な合意なしに導入しないでください。

## Testing

- 自動テストとテスト用 fixture / mock はありません。変更後は最低限 `node --check timeline.js` を実行してください。
- `python -m http.server 8000` でデモを開き、横型・縦型の切り替え、スクロール、接続線、クリックまたは外部リンク、今日表示、640px 以下のレイアウトを変更範囲に応じて手動確認してください。
- 日付処理を変更した場合は、対象 scale（`hour`、`day`、`month`、`quarter`、`year`）と範囲外データを確認してください。

## Git Workflow

- 既定ブランチは `main`、通常開発用として `dev` が存在しますが、ブランチ命名規則とコミット形式は文書化されていません。対象 Issue または保守者の指示に従ってください。
- コミットは変更目的を短く表し、無関係な整形やリファクタリングを混ぜないでください。
- PR 前に構文確認と必要な手動確認を行い、公開 API や表示例が変わる場合は README も更新してください。
- `main` への push は GitHub Pages の公開処理を開始するため、人間の承認なしに push、merge、workflow の手動実行をしないでください。

## Boundaries

- `.github/workflows/static.yml` は本番公開設定です。依頼範囲外で変更しないでください。
- `.env*`、Secrets、API キー、認証情報、個人情報を追加・表示・コミットしないでください。現在、環境変数、外部 API、DB、migration、DDL、SQL は使用していません。
- 生成済み依存物を置く仕組みはありません。大規模リファクタリング、依存追加、公開 API の破壊的変更、デプロイ設定変更は、事前に人間へ確認してください。
- `thumbnail.png` は README のデモ画像です。表示変更に伴う更新が必要でも、依頼範囲を確認してから差し替えてください。

## Workflow

1. 作業前に `README.md`、`timeline.js`、`index.html`、`css/timeline.css` と、変更対象に近い `AGENTS.md` を読んでください。
2. 公開オプション、DOM ID / class、横型・縦型の双方への影響を調べ、必要最小限の変更に絞ってください。
3. 実装後は上記の構文確認と変更範囲に対応する手動確認を行い、未実施項目を報告してください。
4. 仕様、互換性、公開運用、Secrets の扱いが不明な場合は推測で確定せず、人間へ確認してください。

文書の役割は次のように分けます。`README.md` は利用者向けの導入と使用例、`docs/` は現在の全体仕様、`AGENTS.md` はAIエージェント共通の作業規則です。リポジトリ横断の Steering が導入された場合は反復利用する組織ルールを置き、`docs/specs/{issue-number}/ai-instructions.md` はそのIssueだけの変更範囲・禁止事項・確認方法に限定してください。
