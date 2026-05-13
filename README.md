# Cloud Market Racing Chart v2

AWS / Azure / Google Cloud のクラウド市場シェア推移を、軽量な Canvas 2D レンダリングで操作できるレーシングチャートです。

## 更新方針

この版では、古い DOM 更新中心の実装をやめ、UI イメージに忠実な 2026 年風のデザインへ寄せました。

- Formal / Casual の表示モード切替
- Canvas 2D によるチャート描画
- Play / Pause / Reset
- Timeline scrubber
- Speed: 1x / 2x / 5x / 10x（default: 5x）
- Reduced motion toggle
- 非表示タブでの自動停止
- 現在値のアクセシブルなテーブル表示

## Performance policy

- チャート本体は SVG DOM ではなく Canvas 2D で描画
- `requestAnimationFrame` に描画を集約
- 再生中に大きな DOM ツリーを毎フレーム更新しない
- devicePixelRatio は最大 2 に制限
- ResizeObserver の結果は rAF にまとめる
- Reduced motion と visibility pause を実装

## Data policy

- AWS / Azure / Google Cloud の値は、Canalys などの公開されている Q4 市場シェア記事を基準点にしています。
- 中間四半期は、公開 Q4 値の間を線形補間したデモ用の推移です。
- 右側の `Provider Mix` は AWS / Azure / Google Cloud の合計を 100% とした構成比で表示し、キャプションには実際の市場シェア値を表示します。
- 参照例:
  - https://canalys.dev/newsroom/canalys-worldwide-cloud-infrastructure-Q4-2019-and-full-year-2019
  - https://www.canalys.com/newsroom/global-cloud-market-q4-2020
  - https://canalys.dev/newsroom/global-cloud-services-Q4-2021
  - https://canalys.dev/newsroom/global-cloud-services-Q4-2022
  - https://www.canalys.com/newsroom/worldwide-cloud-q4-2023
  - https://newsflash.tdsynnex.co.uk/industry-updates/worldwide-cloud-service-spending-to-grow-by-19-in-2025/6711

## Local preview

```powershell
python -m http.server 8099 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8099/
```
