# Issue #3 タイムラインのデザイン向上 — Tasks

## 位置付け

- 対象Issue: [#3 タイムラインのデザイン向上](https://github.com/chroco-ooo/timeline-js/issues/3)
- 要件: [`requirements.md`](requirements.md)
- 設計: [`design.md`](design.md)
- テスト計画: [`test-plan.md`](test-plan.md)
- 本書は調査、仕様確定、実装、テスト、文書同期をレビュー可能な差分へ分け、依存順に並べる。
- カテゴリー、milestone、基準日時の外部指定は本Issueに含めない。
- DB、バックエンド、HTTP API、依存関係、ビルド工程、デプロイ設定は変更しない。

## 進行ルール

- Task 2の承認ゲートを完了するまで実装へ進まない。
- 既存のコンストラクターオプション、`projects` / `links`、公開メソッド、コールバックの互換性を維持する。
- 既存の `timeline-*` classは削除・改名しない。
- `timeline.js` と `css/timeline.css` の対応が必要な変更は、片方だけを公開可能な完成状態としない。
- 各実装タスク後に最低限 `node --check timeline.js` を実行する。
- 自動テスト基盤や新しい依存関係は追加しない。

## 進捗

| Task | 状態 | 備考 |
|---|---|---|
| Task 1 | 完了 | 現行DOM、class、公開API、before状態を確認 |
| Task 2 | 完了 | 推奨案をRequirementsとDesignへ反映 |
| Task 3 | 完了 | `test-plan.md`を作成 |
| Task 4 | 完了 | NOWの範囲判定、時系列挿入、ARIAを実装 |
| Task 5 | 完了 | contentと画像ありmodifierを追加 |
| Task 6 | 完了 | 年、実線軸、上部サムネイルcard、本文、レスポンシブを実装 |
| Task 7 | 完了 | NOWとTodayの共通トークン、横型の年またぎ線を実装 |
| Task 8 | 完了 | デモデータと画面説明を更新 |
| Task 9 | 完了 | 構文、ローカルブラウザ、主要viewport、横型・縦型回帰を確認。未実施のブラウザ横断等は受入時に省略を承認 |
| Task 10 | 完了 | READMEと仕様文書を同期。`thumbnail.png`は現行維持で承認 |
| Task 11 | 完了 | Issue仕様、タスク状態、確認結果、受入判断を同期 |

## Task 1: 現行実装と互換性境界を調査する

### 責務

変更前のDOM、CSS class、公開API、表示状態を記録し、実装判断に必要な現状を確定する。

### 対象ファイル

- `timeline.js`
- `css/timeline.css`
- `index.html`
- `README.md`
- `docs/architecture.md`
- `docs/api-spec.md`
- `docs/screen-spec.md`

### 前提

- なし

### 作業

- [ ] 縦型のDOM階層と既存classを一覧化する。
- [ ] 横型Today、縦型年区切り、時間軸、eventカード、クリック・linkモードの現状を確認する。
- [ ] PC横型、PC縦型、640px以下の縦型を同一データ・同一viewportで撮影する。
- [ ] 外部CSS互換として維持するclassとDOM階層を整理する。
- [ ] 現在のコンソールerror / warningを記録する。

### 完了条件

- [ ] 既存class、DOM階層、公開APIの互換性基準が記録されている。
- [ ] before画像のブラウザ、viewport、撮影条件が記録されている。
- [ ] Designの仕様決定に必要な材料が揃っている。

### 確認コマンド

```powershell
rg -n "timeline-vertical|timeline-today" timeline.js css/timeline.css
rg -n "constructor|render|setLayout|Project|options" timeline.js docs/api-spec.md
python -m http.server 8000
```

## Task 2: Design仕様と受け入れ基準を確定する

### 責務

実装結果を左右する仕様を決定する。実装やリファクタリングは行わない。

### 対象ファイル

- `docs/specs/3/requirements.md`
- `docs/specs/3/design.md`

### 前提

- Task 1完了
- 完成モックまたはbefore / after比較基準を保守者が確認できること

### 作業

- [ ] NOWと同時刻eventの前後関係を決定する。
- [ ] NOWの年にeventがない場合のchapter表示を決定する。
- [ ] PCカードのbreakpoint、画像比率、高さまたは`aspect-ratio`を決定する。
- [ ] 長いタイトル・説明の折り返し、省略、全文表示方針を決定する。
- [ ] DOM階層と外部CSS上書きの互換性保証範囲を決定する。
- [ ] 新デザインを既定にするか、旧デザイン切り替えを設けるか決定する。
- [ ] 配色、デザイントークン、完成モックを承認する。
- [ ] 対応ブラウザ、確認端末、アクセシビリティ基準を決定する。
- [ ] NOWの読み上げ文言を決定する。
- [ ] `thumbnail.png`の更新要否と撮影条件を決定する。

### 完了条件

- [ ] Designの実装基準がすべて確定している。
- [ ] 寸法、色、breakpoint、DOM、NOW配置が実装者の追加判断なしに実装できる。
- [ ] Requirementsの受け入れ条件を客観的に判定できる。

### 確認コマンド

```powershell
rg -n "確定事項|確定した実装基準|WCAG 2.2 AA|641px" docs/specs/3/requirements.md docs/specs/3/design.md
git diff --check
```

## Task 3: Issue #3のテスト計画を作成する

### 責務

実装前に正常系、境界値、回帰確認、視覚比較の方法を固定する。

### 対象ファイル

- `docs/specs/3/test-plan.md`（新規）

### 前提

- Task 2完了

### 作業

- [ ] Requirementsの各受け入れ条件へテストケースを対応付ける。
- [ ] NOWの開始前、範囲内、終了後、開始・終了境界、同時刻eventを定義する。
- [ ] 画像あり、画像なし、縦長、横長、読み込み失敗を定義する。
- [ ] 640px超、640px、640px未満、狭幅の確認条件を定義する。
- [ ] 横型Today、接続線、仮想スクロール、layout往復の回帰ケースを定義する。
- [ ] マウス、キーボード、eventモード、linkモードの確認を定義する。
- [ ] before / after画像のデータ、viewport、撮影条件を定義する。

### 完了条件

- [ ] Requirementsの受け入れ条件に未対応項目がない。
- [ ] 各ケースに前提データ、手順、期待結果、viewportがある。
- [ ] システム日時に依存するNOWの再現方法が明記されている。

### 確認コマンド

```powershell
rg -n "R1|R2|R5|R6|NOW|640|Today|link|focus|仮想" docs/specs/3/test-plan.md
git diff --check
```

## Task 4: NOWの判定・挿入ロジックを実装する

### 責務

縦型NOWに必要な日時処理とDOM生成だけを実装する。カード構造や全面的なCSS変更は含めない。

### 対象ファイル

- `timeline.js`

### 前提

- Task 2、Task 3完了
- NOW配置、範囲終端、読み上げ仕様が確定済み

### 作業

- [ ] `new Date()`を基準にNOWを判定する。
- [ ] `startDate`と`endDate`をscale単位の閉区間へ正規化する。
- [ ] 表示期間内だけNOW要素を生成する。
- [ ] 確定した同時刻ルールで、新しい順のevent列へNOWを挿入する。
- [ ] 必要最小限のNOW用classとARIA情報を追加する。
- [ ] eventの入力順、日付フォールバック、横型Today処理を維持する。

### 完了条件

- [ ] NOWが表示期間内だけ生成される。
- [ ] `hour`、`day`、`month`、`quarter`、`year`の終端を正しく扱う。
- [ ] 同時刻eventの入力順が変わらない。
- [ ] 新しい公開オプションやprojectフィールドを追加していない。
- [ ] 横型Todayの動作が維持されている。

### 確認コマンド

```powershell
node --check timeline.js
rg -n "timeline-vertical-now|new Date" timeline.js
```

## Task 5: 縦型カードの構造補助classを追加する

### 責務

上部サムネイルカードを成立させるための最小限のDOM変更を行う。視覚デザインは含めない。

### 対象ファイル

- `timeline.js`

### 前提

- Task 1、Task 2完了
- DOM階層の互換性方針が確定済み

### 作業

- [ ] 画像と本文を縦積みできる構造または補助classを追加する。
- [ ] 既存classを削除・改名せず維持する。
- [ ] 画像なしeventに空の画像領域を生成しない。
- [ ] 詳細button / linkとコールバックの発火範囲を維持する。
- [ ] 安全なテキスト出力と画像URL処理を維持する。

### 完了条件

- [ ] 画像あり・なしの双方をCSSで自然に配置できる。
- [ ] `onProjectClick`とlinkモードの発火要素・引数が変わらない。
- [ ] 既存classが維持されている。
- [ ] 公開APIに変更がない。

### 確認コマンド

```powershell
node --check timeline.js
rg -n "timeline-vertical-card|timeline-vertical-content|timeline-vertical-image|footer-action" timeline.js
```

## Task 6: 縦型の視覚デザインを実装する

### 責務

R1、R2、R6と付随する縦型デザイン調整をCSSへ実装する。

### 対象ファイル

- `css/timeline.css`

### 前提

- Task 2、Task 5完了
- 承認済みモック、色、寸法がある

### 作業

- [ ] 年区切りを大きな年表示と細い横線へ変更する。
- [ ] 縦軸を低彩度の1〜2px実線へ変更する。
- [ ] event固有色をmarkerやリンク等の小面積に限定する。
- [ ] 画像付きカードの上部へサムネイルを全幅表示する。
- [ ] 画像なしカードの本文を全幅にする。
- [ ] 画像へ確定済みの`object-fit`、比率、高さ制約を適用する。
- [ ] 影、枠線、角丸、hover移動、引用符装飾を整理する。
- [ ] 年、タイトル、日付、本文、補助情報の視覚階層を反映する。
- [ ] 640px以下では画像と本文を縦積みに戻す。
- [ ] 既存のfocus表示を維持する。

### 完了条件

- [ ] R1、R2、R6を承認済みモックどおり満たす。
- [ ] 画像なしeventに不要な画像領域や余白がない。
- [ ] 長文、画像失敗、狭幅で重なりや操作不能がない。
- [ ] キーボードfocusを視認できる。

### 確認コマンド

```powershell
rg -n "timeline-vertical|@media \(max-width: 640px\)|focus-visible|focus-within" css/timeline.css
node --check timeline.js
python -m http.server 8000
```

## Task 7: NOWと横型Todayの共通デザインを実装する

### 責務

R5と横型・縦型のデザイン言語統一を実装する。横型の構造変更は行わない。

### 対象ファイル

- `css/timeline.css`

### 前提

- Task 4、Task 6完了

### 作業

- [ ] 背景、surface、文字、副文字、境界線、軸、アクセント、focusのCSS custom propertiesを定義する。
- [ ] 縦型NOWのラベル、線、markerを実装する。
- [ ] NOWがeventカードや操作要素を覆わない配置にする。
- [ ] 横型Todayとアクセント色、ラベル文字サイズ、線幅を共有する。
- [ ] 横型event、接続線、hover、focusの構造と意味を維持する。

### 完了条件

- [ ] NOWとTodayに統一感がある。
- [ ] NOWが近接eventや同時刻eventを覆わない。
- [ ] NOWが範囲外の場合に余白や線が残らない。
- [ ] 横型の通常描画、仮想スクロール、接続線が崩れない。

### 確認コマンド

```powershell
rg -n -- "--timeline-|timeline-vertical-now|timeline-today" css/timeline.css
node --check timeline.js
python -m http.server 8000
```

## Task 8: デモデータと画面説明を更新する

### 責務

新デザインと境界値を確認できるデモへ更新する。ライブラリ本体の仕様変更は含めない。

### 対象ファイル

- `index.html`

### 前提

- Task 4〜Task 7完了

### 作業

- [ ] 画像あり・なしのeventを含める。
- [ ] 同一日時eventを含める。
- [ ] 長いタイトルと説明を含める。
- [ ] 必要に応じて縦長・横長画像の確認ケースを含める。
- [ ] 「説明の省略表示を切り替えられる」という未実装文言を修正する。
- [ ] 既存パラメータ形式、クリックフィードバック、layout切り替えを維持する。

### 完了条件

- [ ] 新しい公開データ項目を使用していない。
- [ ] 横型・縦型で同じデータを表示できる。
- [ ] 受け入れ確認に必要な主要ケースがデモにある。
- [ ] 画面説明が実装と矛盾しない。

### 確認コマンド

```powershell
rg -n "backgroundImage|eventAt|description|data-layout|onProjectClick" index.html
node --check timeline.js
python -m http.server 8000
```

## Task 9: 構文確認と手動回帰テストを実施する

### 責務

実装を変更せず、`test-plan.md`に沿って構文、機能、レスポンシブ、アクセシビリティ、視覚回帰を確認する。

### 対象ファイル

- `timeline.js`
- `css/timeline.css`
- `index.html`
- `docs/specs/3/test-plan.md`

### 前提

- Task 4〜Task 8完了

### 作業

- [ ] 横型・縦型の切り替えと往復を確認する。
- [ ] eventモードとlinkモードを確認する。
- [ ] 接続線、Today、通常・仮想スクロールを確認する。
- [ ] 年区切り、実線軸、NOWを確認する。
- [ ] NOWの開始前、範囲内、終了後、同時刻を確認する。
- [ ] 画像あり、なし、失敗、縦長、横長を確認する。
- [ ] 長いタイトルと説明を確認する。
- [ ] 640px超、640px、640px未満、狭幅を確認する。
- [ ] マウスとキーボードfocusを確認する。
- [ ] コンソールerror / warningを確認する。
- [ ] PC横型、PC縦型、モバイル縦型のafter画像を撮影する。

### 完了条件

- [ ] 全テスト結果が記録されている。
- [ ] 未確認項目と不合格項目が明示されている。
- [ ] before / after画像が同一データ・同一viewportで比較できる。
- [ ] before / afterが承認済み基準を満たす。

### 確認コマンド

```powershell
node --check timeline.js
python -m http.server 8000
git diff --check
```

## Task 10: 利用者向け・全体仕様文書を同期する

### 責務

検証済みの最終実装を利用者向け文書と全体仕様へ反映する。実装変更は混ぜない。

### 対象ファイル

- `README.md`
- `docs/api-spec.md`
- `docs/screen-spec.md`
- `docs/testing-policy.md`
- `index.html`の画面説明
- `docs/architecture.md`（条件付き）
- `thumbnail.png`（条件付き）

### 前提

- Task 9合格

### 作業

- [ ] READMEへ年区切り、実線軸、NOW、上部サムネイルカード、モバイル表示を反映する。
- [ ] API仕様へ公開API・データ形式に変更がないことを反映する。
- [ ] 画面仕様へNOWの条件、年区切り、レスポンシブ、状態別表示を追加する。
- [ ] テスト方針へNOW、画像、境界幅、before / after確認を追加する。
- [ ] DOM構造または内部データフローが変わった場合だけArchitectureを更新する。
- [ ] 承認された場合だけ`thumbnail.png`を差し替える。

### 完了条件

- [ ] 実装とREADME、API仕様、画面仕様に矛盾がない。
- [ ] 公開API変更なしが明記されている。
- [ ] 条件付き同期先を更新しなかった場合は理由が記録されている。

### 確認コマンド

```powershell
rg -n "NOW|Today|年|640|画像|公開API" README.md docs/api-spec.md docs/screen-spec.md docs/testing-policy.md
node --check timeline.js
git diff --check
```

## Task 11: Issue仕様と完了記録を同期する

### 責務

Issue単位のRequirements、Design、test-plan、tasksを最終結果へ同期する。

### 対象ファイル

- `docs/specs/3/requirements.md`
- `docs/specs/3/design.md`
- `docs/specs/3/test-plan.md`
- `docs/specs/3/tasks.md`

### 前提

- Task 9、Task 10完了

### 作業

- [ ] Requirementsの受け入れ条件へ結果を反映する。
- [ ] Designの推奨値を実装済みの確定値へ置き換える。
- [ ] 各Taskの完了状態と確認結果を反映する。
- [ ] 未実施、延期、条件付き項目を記録する。
- [ ] カテゴリー、milestone、基準日時指定が後続Issue対象であることを維持する。

### 完了条件

- [ ] Requirements、Design、実装、テスト結果が一致する。
- [ ] 全Taskの状態と検証証跡が記録されている。
- [ ] 残課題が後続Issue候補として明確になっている。

### 確認コマンド

```powershell
rg -n "確定事項|確定した実装基準|完了条件" docs/specs/3
node --check timeline.js
git diff --check
```

## 確定した実装前提

- [x] before / afterの撮影条件とデザイントークン初期値を確定した。
- [x] NOWは同時刻event群の直後へ置く。
- [x] NOWのためだけの年chapterは生成しない。
- [x] 全画面幅で画像と本文を縦積みにし、画像4:3、`object-fit: cover`とする。
- [x] 長いタイトルと説明は折り返して全文表示する。
- [x] 既存class名を維持し、補助classを追加する。見た目とDOM直接子関係の完全互換は保証しない。
- [x] 新デザインを既定にし、旧デザイン切り替えは追加しない。
- [x] Chrome、Edge、Firefox、Safariの最新2メジャーバージョンを確認対象とする。
- [x] WCAG 2.2 AAを目標とし、NOWは `role="separator"`、`aria-label="現在"` とする。
- [x] `thumbnail.png`は受け入れ確認後に所定条件で更新する。

Task 2とTask 3を含む全成果物はレビューされ、Issue #3の完了として承認された。

## 最終受入

- [x] 主要実装と文書同期が完了した。
- [x] `node --check timeline.js`と`git diff --check`が成功した。
- [x] ローカルブラウザで横型、縦型、NOW、Today、接続線、レスポンシブ、画像表示、年境界を確認した。
- [x] 年境界の最終デザインは、中央揃えの月ラベル、通常罫線と同系色の実線、淡いフェードで承認された。
- [x] 未実施のブラウザ横断、linkモード、仮想スクロール、スクリーンリーダー、before画像保存は既知の残存確認事項として受容された。
- [x] `thumbnail.png`は本Issueでは差し替えず、現行画像を維持する。

## 対象外・後続Issue候補

- カテゴリーチップとカテゴリー用projectフィールド
- milestone表示と重要度用projectフィールド
- 基準日時を外部指定するコンストラクターオプション
- タイムライン描画エンジンの刷新
- 横型タイムラインの全面再設計
- 新しいフレームワーク、依存関係、ビルド工程、自動テスト基盤
- DB、HTTP API、認証、権限、外部サービス連携
- `.github/workflows/static.yml`の変更
