# Timeline Generator

タイムライン上にプロジェクトの開始時期と、それらの関連を可視化できる軽量なJavaScriptライブラリです。  
年月単位でプロジェクトの流れを表現し、成長や派生を視覚的に分かりやすく表示できます。

---

## 特徴

- 年・月単位のグリッドに沿った正確なタイムライン表示
- プロジェクトノードの開始時点をタイムライン上に自動配置
- プロジェクト同士の接続（矢印線）描画機能
- 横型グリッドと縦型カードレイアウトの切り替え
- 縦型ではイベントを新しい順に表示し、接続線を描画しない
- 縦型では年ごとの見出しと中央の時間軸を表示し、デスクトップではカードを左右交互に配置
- モバイルではカードを時間軸の右側へまとめ、狭い画面でも時系列を追いやすく表示
- 縦型カードでは画像、日付と見出し、引用スタイルの説明、名前と詳細アクションを順に表示
- 縦型では画像や見出しを操作領域にせず、「詳しく見る」からクリックコールバックまたは外部リンクを実行
- 縦型の説明は省略せず全文を表示
- スクロール対応済み（スクロール外でも線が正しく描画）
- HTML＋CSS＋JavaScript のシンプル構成
- カスタマイズしやすい

---

## デモイメージ

![Timeline Generator Demo](thumbnail.png)

---

## セットアップ

### 必要ファイル構成

```
/project-directory/
├── index.html
├── css/
│   └── timeline.css
└── timeline.js
```

### 読み込み例

```html
<link rel="stylesheet" href="./css/timeline.css">
<script src="timeline.js"></script>
```

---

## 使い方

### HTML側

```html
<div id="timeline-container">
    <div id="timeline-years" class="timeline-section timeline-years"></div>
    <div id="timeline-months" class="timeline-section timeline-months"></div>
    <div id="timeline-grid" class="timeline-section timeline-grid"></div>
</div>

<!-- 任意: 今日の位置をテキスト表示する場合 -->
<p id="timeline-today-label"></p>
```

### JavaScript側

```javascript
const timeline = new TimelineGenerator({
    targetId: "timeline-container",
    startDate: "2011-01",
    endDate: "2015-12",
    scale: "month",
    layout: "horizontal", // "horizontal" または "vertical"
    projects: [
        // end は範囲外チェックに使われるため、start と同じ月でもOK
        { id: "p1", name: "プロジェクトA", start: "2011-02", end: "2011-02", lane: 1, color: "#4fc3f7" },
        { id: "p2", name: "プロジェクトB", start: "2012-05", end: "2012-05", lane: 2, color: "#81c784" },
        { id: "p3", name: "プロジェクトC", start: "2013-08", end: "2013-08", lane: 1, color: "#ffb74d" }
    ],
    links: [
        { from: "p1", to: "p2" },
        { from: "p2", to: "p3" },
        { from: "p1", to: "p3" }
    ]
});
timeline.render();
```

---

## オプション一覧

| オプション          | 必須 | 説明                                                                          |
|:---------------|:---|:----------------------------------------------------------------------------|
| targetId       | 必須 | タイムラインを描画する対象divのID                                                         |
| startDate      | 必須 | 開始年月 (`"YYYY-MM"` 形式)、日単位の場合は `"YYYY-MM-DD"`、年単位の場合は `"YYYY"`               |
| endDate        | 必須 | 終了年月 (`"YYYY-MM"` 形式)、日単位の場合は `"YYYY-MM-DD"`、年単位の場合は `"YYYY"`               |
| scale          | 任意 | `"hour"`, `"day"`, `"month"`, `"quarter"`, `"year"`（デフォルトは`"month"`）       |
| layout         | 任意 | `"horizontal"` または `"vertical"`（デフォルトは `"horizontal"`）                  |
| projects       | 必須 | プロジェクト情報配列（下記参照）                                                            |
| links          | 任意 | プロジェクト間の接続線情報配列                                                             |
| onProjectClick | 任意 | プロジェクトボックスがクリックされた時のコールバック                                                  |
| minLaneCount   | 任意 | レーン数の最小値（デフォルト: 5）                                                          |
| maxLaneCount   | 任意 | レーン数の最大値（デフォルト: 10）                                                         |
| clickMode      | 任意 | `"event"` or `"link"`。`"link"`の場合は `url` を持つプロジェクトをアンカー表示（デフォルト: `"event"`） |
| linkTarget     | 任意 | `clickMode: "link"` の場合の `target` 属性（デフォルト: `"_blank"`）                     |
| linkRel        | 任意 | `clickMode: "link"` の場合の `rel` 属性（デフォルト: `"noopener"`）                      |
| virtualScrollThreshold | 任意 | 横型で仮想スクロールを有効にする列数（デフォルト: `180`）                         |
| virtualColumnBuffer | 任意 | 仮想スクロールで表示範囲の前後に描画する列数（デフォルト: `12`、最小: `4`）              |

描画後に表示方向を切り替える場合は `setLayout` を使います。

```javascript
timeline.setLayout("vertical");
timeline.setLayout("horizontal");
```

`layout` を省略した場合は、従来との互換性を保つため横型で描画します。横型は `links` と `lane`
を使って関係性を表示します。縦型は `projects` をイベント日時の新しい順に並べ、`links` と `lane`
を描画に使用しません。

---

## プロジェクト情報（projects）

各プロジェクトは次の形式で指定します。

```javascript
{
  id: "p1",         // ユニークなID
  name: "名前",      // 表示名
  start: "2011-02", // 開始年月（dayの場合は"YYYY-MM-DD"、quarterの場合は"YYYY-Q1"、yearの場合は"YYYY"）
  end: "2011-06",   // 終了年月（dayの場合は"YYYY-MM-DD"、quarterの場合は"YYYY-Q1"、yearの場合は"YYYY"）
  lane: 1,          // レーン番号（上から順番に）
  color: "#4fc3f7", // 任意：ボックスの色
  url: "https://example.com", // 任意：clickMode が "link" のときにリンク先として使用
  backgroundImage: "https://example.com/icon.png", // 任意：アイコン画像
  title: "カードのタイトル", // 任意：縦型で表示
  description: "カードの説明", // 任意：縦型で表示。3行を超える場合は展開可能
  eventAt: "2011-02-15T10:30:00" // 任意：縦型の日付・時刻表示と並び順に使用
}
```

縦型の日付は `eventAt`、`start`、`end` の順で使用します。日時が同じプロジェクトは、
`projects` に指定した元の順序を維持します。

### クリックイベントのコールバック

プロジェクトボックスにクリックイベントをバインドしたい場合は `onProjectClick` を指定します。
`clickMode: "link"` の場合は、`url` を持つプロジェクトがアンカー要素として描画されるため、
`onProjectClick` は実行されません。

```javascript
const timeline = new TimelineGenerator({
  targetId: "timeline-container",
  startDate: "2011-01",
  endDate: "2015-12",
  scale: "month",
  projects,
  links,
  onProjectClick: ({ event, project, element }) => {
    console.log("Clicked", project, element);
    event.preventDefault();
  },
});
```

---

## 接続線情報（links）

横型でプロジェクト間の関連を示す矢印線を設定します。縦型では `links` を描画しません。

```javascript
{
  from: "p1", // 接続元プロジェクトID
  to: "p2"    // 接続先プロジェクトID
}
```

---

## 注意点

- コンテナ要素（例：`#timeline-container`）は **`position: relative;`** を指定してください。
- 横型は年・月ヘッダーの高さを基準に接続線を描画します。
- 横型ではプロジェクトの `start` / `end` が範囲外の場合、警告を出して描画をスキップします。
- 縦型の説明展開ボタンはカードのクリック・外部リンクとは独立して動作します。

---

## ライセンス

MIT License

---

## 開発ドキュメント

- [プロダクト概要](docs/product-overview.md)
- [アーキテクチャ](docs/architecture.md)
- [テスト方針](docs/testing-policy.md)
- [JavaScript API仕様](docs/api-spec.md)
- [デモ画面仕様](docs/screen-spec.md)

---

## 作者

- Timeline Generator 開発者
- お問い合わせ：[ここに連絡先やGitHubアカウントなどを記載可能]
