# JavaScript API Specification

## 対象

HTTP APIはありません。本書は、通常の `<script src="timeline.js"></script>` で読み込むブラウザ向け `TimelineGenerator` クラスの現在の公開インターフェースを記載します。モジュールexportやパッケージ配布はありません。

## 生成

```javascript
const timeline = new TimelineGenerator(options);
```

### options

| 名前 | 型 | 既定値 | 内容 |
|---|---|---|---|
| `targetId` | string | なし | 描画先要素のID |
| `startDate` | string | なし | 表示開始。形式はscaleに対応 |
| `endDate` | string | なし | 表示終了。形式はscaleに対応 |
| `scale` | string | `"month"` | `"hour"`, `"day"`, `"month"`, `"quarter"`, `"year"` |
| `layout` | string | `"horizontal"` | `"vertical"` のみ縦型、それ以外は横型 |
| `projects` | array | `[]` | 表示するイベント |
| `links` | array | `[]` | 横型の接続関係 |
| `minLaneCount` | number | `5` | 横型の最小レーン数 |
| `maxLaneCount` | number | `10` | 横型の最大レーン数 |
| `clickMode` | string | `"event"` | `"link"` のみリンク、それ以外はイベント |
| `linkTarget` | string | `"_blank"` | リンクの `target` |
| `linkRel` | string | `"noopener"` | リンクの `rel` |
| `onProjectClick` | function | `null` | eventモードのクリックコールバック |
| `virtualScrollThreshold` | number | `180` | 横型の仮想化を有効にする列数 |
| `virtualColumnBuffer` | number | `12` | 表示範囲の前後へ追加描画する列数。最小4 |

必須項目に対する明示的な例外やvalidation responseはありません。`targetId` の要素がなければコンソールerror後に終了し、空の日付は日付解析時点の現在日時へフォールバックします。この挙動に依存せず、呼び出し側で必須値を渡してください。

### 日付形式

| scale | 形式例 |
|---|---|
| `hour` | `2026-08-14 15:00` または `2026-08-14T15:00` |
| `day` | `2026-08-14` |
| `month` | `2026-08` |
| `quarter` | `2026-Q3` |
| `year` | `2026` |

## Project

| フィールド | 用途 |
|---|---|
| `id` | DOM ID、data属性、link参照に使う識別子 |
| `name` | 横型ラベル、アクセシブル名、縦型の名前 |
| `start`, `end` | 横型の範囲判定と配置、縦型の日付フォールバック |
| `lane` | 横型の行番号 |
| `color` | 横型ボックスまたは縦型アクセント色 |
| `url` | linkモードの遷移先 |
| `backgroundImage` | 横型アイコン、縦型カード画像 |
| `title` | 縦型見出し。未指定時は `name`、さらに未指定なら `Untitled` |
| `description` | 縦型本文。空なら要素を生成しない |
| `eventAt` | 縦型の日付・時刻と並び順。`start`、`end` より優先 |

`onProjectClick` は `{ event, project, element }` を受け取ります。横型ではイベントボックス、縦型では「詳しく見る」ボタンの操作時だけ呼ばれます。linkモードかつ `url` があるprojectでは呼ばれません。

## Link

```javascript
{ from: "p1", to: "p2" }
```

横型で指定ID間にSVG曲線を描画します。存在しないIDはコンソールwarning後にスキップされ、縦型では `links` 全体を使用しません。認証・権限・status codeはありません。

## メソッド

### `render(): void`

現在の設定で描画します。既存の描画DOMを置換します。

### `setLayout(layout): void`

`"vertical"` なら縦型、それ以外なら横型へ切り替えて再描画します。同じlayoutで描画済みの場合は何もしません。

上記以外のメソッドは現在呼び出し可能ですが、描画内部の実装として扱い、互換性を保証する公開APIとは位置付けません。

## 表示仕様に関する注記

- Issue #3のデザイン変更によるコンストラクターオプション、Project、Link、公開メソッド、コールバックの追加・変更はありません。
- 縦型のNOWはシステム日時を使用し、`startDate`と`endDate`の閉区間内の場合だけ表示します。
- NOWの基準日時を外部指定するオプションはありません。
- 同時刻eventは既存の入力順を維持し、そのevent群の直後へNOWを表示します。
- 画像付き縦型cardの構造補助classは内部DOMであり、公開APIには含みません。
