# Issue #3 タイムラインのデザイン向上 — Design

## 位置付け

- 対象Issue: [#3 タイムラインのデザイン向上](https://github.com/chroco-ooo/timeline-js/issues/3)
- 要件: [`requirements.md`](requirements.md)
- 本書は実装前の推奨設計を示す。本Issueでは、既存ライブラリの組み込み先へ影響を与えないため、コンストラクターオプションと `projects` / `links` のパラメータを追加・変更しない。
- 本書に記載した値と配置ルールを実装基準とする。
- 完成イメージは、同一データ・同一viewportで撮影したbefore / after画像を基準にする。

## 現在の実装上の前提

- `TimelineGenerator` が状態、日付処理、横型・縦型のDOM生成を担う。
- 縦型は `renderVertical()` が `projects` を新しい順に描画する。
- 横型は `renderRange()` が列、event、SVG接続線、Today表示を描画する。
- `getProjectDate()` は縦型の日付解釈、`sortProjectsByDate()` は同日時の入力順維持を担う。
- CSSは既存の `timeline-*` classとDOM階層に依存する。既存classは削除・改名しない。
- 依存管理、ビルド、テストフレームワークは存在しない。

## 推奨案の概要

既存の `TimelineGenerator`、公開メソッド、すべての入力パラメータを維持する。縦型DOMには必要最小限のclassだけを追加し、デザイン変更の大部分を `css/timeline.css` に閉じ込める。NOWは新しい基準日時オプションを設けず、既存の横型Today表示と同様にシステム日時から生成する。

この案を推奨する理由は以下のとおり。

- 既存データの描画結果とクリック動作を維持できる。
- 組み込み側にデータ移行や呼び出し変更を要求しない。
- 既存classを保持したまま追加classでCSSを適用できる。
- フレームワークや外部依存を必要としない。

カテゴリーとmilestoneは入力元となる既存データがないため、本Issueでは表示しない。基準日時の外部指定も追加しない。これらは必要に応じて後続Issueで公開API設計から検討する。

## データ・API設計

### カテゴリーとmilestone

既存projectにはカテゴリーまたは重要度を示すフィールドがない。`name`、`title`、`color` 等から意味を推測すると既存データの解釈を変えるため行わない。本Issueでは対象外とし、パラメータ変更を許容する後続Issueへ延期する。

### NOWの基準日時

- `new Date()` によるシステム日時を使用する。
- 新しいコンストラクターオプションは追加しない。
- 再現確認では、表示期間またはデモデータが実行日のシステム日時を含む状態で確認する。

### 既存API

- `new TimelineGenerator(options)`、`render()`、`setLayout()` の意味と戻り値を変えない。
- 既存projectフィールドの意味を変えない。
- `onProjectClick` の引数と、event / linkモードの動作を変えない。
- 新しいオプションやproject / linkフィールドを追加しない。
- 横型との共通化は色・線・focus・現在位置のデザイン言語に限定する。

## 縦型DOM設計

### 年区切り

`renderVertical()` が現在生成する `.timeline-vertical-chapter > span` は維持する。JavaScript構造を変えず、CSS Grid上で章見出しを全幅に配置し、年文字と横線を表現する。

推奨:

- `.timeline-vertical-chapter` を全幅の見出しとして扱う。
- `span` の背景、枠線、角丸、影を削除する。
- 横線はchapterの疑似要素で描画する。
- `aria-label="{year}年"` は維持する。

sticky表示は採用しない。年の把握には有効だが、狭い画面でカードを覆う可能性と追加の重なり制御が生じるため、第一段階の「年変更地点を把握できる」は明確な章見出しで満たす。

### 時間軸とeventマーカー

- `.timeline-vertical::before` の破線を1〜2pxの実線へ変更する。
- 時間軸はニュートラルな境界線色を使い、`project.color` を適用しない。
- 通常markerは既存の円形を維持する。
- itemと時間軸を結ぶ横線は時間軸と同系色にする。event固有色はmarkerなど小面積に限定する。

### カードと画像

サムネイルをカード上部へ全幅表示するため、既存classを残して `.timeline-vertical-content` を追加する。

```text
.timeline-vertical-card
├── .timeline-vertical-image（画像がある場合だけ）
└── .timeline-vertical-content
    ├── .timeline-vertical-heading
    └── .timeline-vertical-body
```

現状の `.timeline-vertical-card-action` は見出しを囲む非操作の `div` であり、名称と役割が一致していない。ただし互換性のため削除・改名せず、`.timeline-vertical-content` の内部で既存classを維持する。

CSS:

- 画像あり: card上部に画像を全幅表示し、その下にcontentを配置する。
- 画像なしPC: contentを全幅にする。
- 画像は `object-fit: cover`、固定aspect-ratioまたは高さ上限を用いる。
- カードの影は削除または極小、枠線は1pxの低コントラスト、角丸は現状より小さくする。
- hoverは位置移動を原則なくし、境界線または背景色の小さな変化にする。
- `:focus-within` と `.timeline-vertical-footer-action:focus-visible` は維持する。

画像ありcardは画面幅にかかわらず画像、contentの順に縦積みする。画像領域は4:3を基本に `object-fit: cover` を使用する。画像なしcardはcontentを全幅にする。

長いタイトルと説明は省略せず、折り返して全文表示する。JavaScriptによる省略・展開機能は追加しない。

### 説明とfooter

- `.timeline-vertical-description::before` / `::after` の大きな引用符を削除する。
- 説明は常に通常本文として表示し、現行どおりJavaScriptによる省略・展開を追加しない。
- `.timeline-vertical-footer` は弱い境界線と十分な操作間隔を維持する。
- 「詳しく見る」のbutton / linkとイベント発火範囲を変えない。

`index.html` の「説明の省略表示を切り替えられる」という未実装文言は、実装時に現在仕様へ合わせて修正する。

## NOW設計

### 表示判定

推奨する処理順は以下のとおり。

1. システム日時を `new Date()` で取得する。
2. `startDate` と `endDate` を現在の `scale` に従って範囲境界へ正規化する。
3. 現在日時が閉区間内の場合だけNOWを描画する。
4. 縦型eventを現在と比較し、新しい順の中で未来側と過去側の間へNOWを挿入する。
5. 同時刻eventがある場合は、そのevent群を入力順のまま先に表示し、直後へNOWを置く。

範囲終端はscaleの単位全体を含む必要がある。例えば `endDate: "2026-08"` は2026年8月末までを範囲内と扱う。既存の横型列生成用paddingはNOWの表示範囲判定へ流用しない。

同時刻event群をNOWより先に置くことで、既存の入力順を維持し、event群をNOWで分断しない。

### DOM

NOWをeventカードとして扱わず、縦型list内の区切り要素として生成する。

推奨class:

- `.timeline-vertical-now`
- `.timeline-vertical-now-label`
- `.timeline-vertical-now-line`

NOWは操作要素ではなく、視覚的な補助情報とする。`role="separator"` と `aria-label="現在"` を付与し、重複する可視ラベルは読み上げ対象から除外する。

NOWの年にeventがなくても新しい年chapterは生成しない。eventの年chapter構造を変えず、NOWだけを正しい時系列位置へ置く。

### 横型Todayとの統一

- 既存の `.timeline-today-marker`、`.timeline-today-line`、`.timeline-today-badge` は維持する。
- 縦型NOWと横型Todayで、アクセント色、ラベル文字サイズ、線の太さをCSS変数から共有する。
- 横型は既存の「今日」、縦型は「NOW」を維持する。

## CSS設計

### デザイントークン

外部依存を追加せず、`#timeline-container` または各レイアウトルートのCSS custom propertiesとして限定的なトークンを定義する。

候補:

```css
--timeline-bg
--timeline-surface
--timeline-text
--timeline-text-muted
--timeline-border
--timeline-axis
--timeline-accent
--timeline-focus
```

初期値は次のとおりとする。実装後のコントラスト確認でWCAG 2.2 AAを満たさない場合は、意味を変えない範囲で調整する。既存の `--timeline-event-accent` はevent固有色として維持し、広い面の背景には用いない。

```css
--timeline-bg: #f8fafc;
--timeline-surface: #ffffff;
--timeline-text: #172033;
--timeline-text-muted: #64748b;
--timeline-border: #dbe3ec;
--timeline-axis: #a8b3c2;
--timeline-accent: #2563eb;
--timeline-focus: #1d4ed8;
```

時間軸は `1px solid var(--timeline-axis)`、card枠は `1px solid var(--timeline-border)`、card角丸は6pxを基本とする。通常時の影とhover時の位置移動は使用しない。focusは2px以上のoutlineで表示する。

### レスポンシブ

- 現在の `@media (max-width: 640px)` を維持し、同じ境界でカードを1列へ戻す案を第一候補とする。
- 既存の中央軸・左右交互配置はPCで維持する。
- モバイルでは現在どおり左軸・右カードへ集約する。
- breakpoint追加は必要性がモックで確認できた場合だけ行う。

### CSS class互換性

- 既存classは削除・改名しない。
- modifierと構造補助classだけを追加する。
- 既存classの見た目は変更されるため、外部サイトのCSS上書きとの完全互換は保証できない。
- cardには `.timeline-vertical-content` と、画像ありを示す `.timeline-vertical-card-has-image` を追加できる。既存classは削除・改名しない。既存class名は互換対象とするが、見た目とDOM直接子関係の完全互換は保証しない。

## 代替案

### A. CSSのみで改善し、新データ項目とNOWを別Issueにする

利点:

- `timeline.js` と公開APIを変更しない。
- DOM互換性と回帰リスクが最も低い。
- 年、実線、カード、タイポグラフィ、引用符、色は先行改善できる。

欠点:

- NOWを含むJavaScript側の表示改善を満たさない。
- Issue #3を分割して追跡する必要がある。

設計確定前の縮小案として検討したが、NOWを含む現行要件を満たさないため採用しない。

### B. `project.type` にカテゴリーとmilestoneを統合する

利点:

- 新しいproject項目が1つで済む。
- 固定種別ごとのデザインを定義しやすい。

欠点:

- 「RELEASEだがmilestoneではない」などを表現できない。
- 種別追加が公開仕様とCSS変更を伴う。
- 利用者固有カテゴリーを扱いにくい。

情報の意味が異なるため推奨しない。

### C. milestoneアイコンを文字または画像で指定可能にする

利点:

- 利用者が用途に合う見た目を選べる。

欠点:

- 入力検証、アクセシビリティ、サイズ、外部画像、安全性、統一感の課題が増える。
- 第一段階の目的に対して過剰である。

第一段階では採用しない。

### D. 新旧テーマ切り替えオプションを追加する

利点:

- 見た目とDOMに依存する既存利用者が段階移行できる。

欠点:

- CSSと確認組み合わせが倍増する。
- 旧デザインの保守期限が必要になる。
- 単一のミニマルなデザインへ整理する目的が弱まる。

本Issueでは採用しない。新デザインを既定とし、旧デザイン切り替えオプションは追加しない。

## ファイル変更計画

### 追加

- `docs/specs/3/design.md`: 本設計
- `docs/specs/3/tasks.md`: 設計承認後の実装・検証タスク

### 変更

- `timeline.js`
  - NOWの範囲判定と時系列位置への挿入
  - 既存classを維持した補助classと必要最小限のARIA属性追加
- `css/timeline.css`
  - デザイントークン、年区切り、実線軸、marker、NOW、上部サムネイルカード、タイポグラフィ、レスポンシブ
  - 横型Todayと基本色・線・focusの統一
- `index.html`
  - 既存パラメータだけを使った画像あり・なしのデモデータ
  - 現在仕様と矛盾する説明文の修正
- `README.md`
  - デザイン変更の説明と代表画像
- `docs/api-spec.md`
  - 公開APIに変更がないことの確認。原則変更不要
- `docs/screen-spec.md`
  - 年区切り、NOW、PC・モバイル表示
- `docs/testing-policy.md`
  - NOWとレスポンシブ表示の正常系・境界値
- `docs/specs/3/requirements.md`
  - 確定した実装基準と最終受け入れ条件

### 条件付き変更

- `thumbnail.png`: READMEの代表画像を新デザインへ更新する場合
- `docs/architecture.md`: DOM構造または内部データフローの説明が実装後に変わる場合

### 変更しない

- `.github/workflows/static.yml`
- `AGENTS.md`（共通コマンド・規則が変わらない限り）
- DB、HTTP API、認証に関するファイル（該当実装なし）
- package管理ファイル（存在せず、新規依存も不要）

## 影響範囲

### JavaScript API

コンストラクターオプション、project、link、既存メソッド、コールバックを追加・変更しない。

### 画面

縦型の視覚表現と画像付きカードのDOM階層が変わる可能性がある。横型は構造を維持し、共通トークンとToday表示を中心に調整する。

### DB・HTTP API・外部連携

影響なし。DB、HTTP API、認証、権限、サーバー、外部サービスを追加しない。画像・リンクURLの取得可否は引き続き呼び出し元とブラウザに依存する。

### エラー

- 既存の対象DOMなし、範囲外event、リンク先なしの処理を変更しない。
- 新しい入力validationやエラー条件を追加しない。

### ログ

- 構造化ログや遠隔ログを追加しない。
- NOWの通常表示では新しいログを追加しない。

## テスト方針

自動テスト基盤は本Issueで導入しない。依存追加なしで可能な構文確認と、デモによる手動回帰確認を行う。

```powershell
node --check timeline.js
python -m http.server 8000
```

### デモデータ

最低限、次のeventを `index.html` に用意する。

- 画像を持つ既存形式のevent
- 画像を持たない既存形式のevent
- 同一日時のevent
- 長いタイトルと説明を持つevent

NOWは、表示期間が確認日のシステム日時を含む状態で確認する。

### 手動確認マトリクス

| 観点 | 確認内容 |
|---|---|
| 互換性 | 既存形式のデモデータ、クリック、linkモード、同日時順 |
| 縦型 | 年、実線軸、NOW、画像あり・なし |
| 横型 | event、接続線、Today、通常・仮想スクロール |
| 境界 | NOWが開始前・範囲内・終了後・eventと同時刻 |
| 文字 | 空・長いタイトル、説明 |
| 画像 | 未指定、読み込み失敗、縦長、横長 |
| 幅 | 640px超、640px、640px未満、狭幅 |
| 操作 | マウス、キーボードfocus、button、link、layout往復 |
| 品質 | 意図しない重なり・切れ、コンソールerror / warning |

PRには同一データ・同一viewportのbefore / after画像を、PC横型、PC縦型、モバイル縦型について添付する。

## 移行上の注意

- 入力パラメータを変更しないため、既存データ移行は発生しない。
- 既存classを削除・改名しない。
- DOM階層変更が必要な場合は、外部CSS上書きへの影響をPRで明示する。
- 新デザインを既定にするかテーマ切り替えを設けるかは、利用状況を確認して決定する。
- READMEとAPI仕様を実装と同じPRで更新する。
- `main` へのmergeはGitHub Pages公開を開始するため、before / after確認と人間の承認後に行う。

## ロールバック

DBやデータmigrationはない。問題発生時はIssue #3のJavaScript、CSS、デモ、関連文書を同一単位でrevertする。

- 入力データを変更しないため、利用データの巻き戻しは不要とする。
- DOMとCSSは対応するため、`timeline.js` だけ、または `css/timeline.css` だけを部分的に戻さない。
- GitHub Pagesは `main` の静的内容を公開するため、revert commitの反映が公開ロールバックになる。
- 旧デザインとの切り替えを採用しない場合、即時切り戻しはGit revertに依存する。

実際の本番承認者、監視、復旧時間、公開URLは未確認であり、本書では確定しない。

## 確定した実装基準

1. NOWは同時刻event群の直後へ置く。
2. NOWのためだけの年chapterは生成しない。
3. 画像付きcardは全画面幅で画像、本文の順に縦積みし、画像4:3、`object-fit: cover`とする。
4. 長いタイトルと説明は折り返して全文表示する。
5. 既存class名を維持し、補助classだけを追加する。見た目とDOM直接子関係の完全互換は保証しない。
6. 新デザインを既定にし、旧デザイン切り替えは追加しない。
7. 本書のデザイントークンとbefore / after撮影条件を比較基準とする。
8. Chrome、Edge、Firefox、Safariの最新2メジャーバージョンを確認対象とする。
9. WCAG 2.2 AAを目標とし、NOWは `role="separator"`、`aria-label="現在"` とする。
10. `thumbnail.png` は本Issueでは差し替えず、現行画像を維持する。

カテゴリー、milestone、基準日時指定は本Issueから除外し、必要であれば公開API変更を扱う後続Issueを作成する。GitHub Pagesの承認、監視、ロールバック担当は公開運用上の確認事項として残し、実装仕様のブロッカーにはしない。
