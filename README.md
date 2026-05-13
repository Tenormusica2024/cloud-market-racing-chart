# Cloud Market Racing Chart v2

AWS / Azure / Google Cloud / Oracle Cloud / Alibaba Cloud のクラウド市場シェア推移を、軽量な Canvas 2D レンダリングで操作できるレーシングチャートです。

Live demo: https://tenormusica2024.github.io/cloud-market-racing-chart/

## 更新方針

この版では、古い DOM 更新中心の実装をやめ、UI イメージに忠実な 2026 年風のデザインへ寄せました。

- Formal / Casual の表示モード切替
- 初期表示は Casual モード
- Canvas 2D によるチャート描画
- Play / Pause / Reset
- Timeline scrubber
- Speed: 1x / 2x / 5x / 10x（default: 5x）
- Reduced motion toggle
- 非表示タブでの自動停止
- 現在値のアクセシブルなテーブル表示
- 右側インサイト欄とチャート下コンテキスト欄を分け、情報量が増えてもチャート下に大きな空白が出にくいレイアウト

## Performance policy

- チャート本体は SVG DOM ではなく Canvas 2D で描画
- `requestAnimationFrame` に描画を集約
- 再生中に大きな DOM ツリーを毎フレーム更新しない
- devicePixelRatio は最大 2 に制限
- ResizeObserver の結果は rAF にまとめる
- Reduced motion と visibility pause を実装

## Current UI layout

- Main chart: 2026 Q1 時点の Top 5 をレーシングバーとして表示
- Right insight rail:
  - Top 5 share sparkline
  - Leader
  - Google Cloud Momentum
  - Top 5 Mix
  - Source link
- Chart bottom context strip:
  - AI Neoclouds
  - Change vs 2025 Q4
- Mobile では各カードを縦積みにして、横スクロールなしで確認できるようにしています。

## Data policy

- AWS / Azure / Google Cloud の過去値は、Canalys / Omdia / Synergy Research Group などの公開市場シェア記事を基準点にしています。
- 2026 Q1 の Top 5 値は、Synergy Research Group 系の記事と CRN Asia の Top 5 整理を基準点にしています。
- 中間四半期は、公開値の間を線形補間したデモ用の推移です。
- 右側の `Top 5 Mix` は AWS / Azure / Google Cloud / Oracle Cloud / Alibaba Cloud の合計を 100% とした構成比で表示し、キャプションには実際の市場シェア値を表示します。
- 2026 Q1 の最新Top 5値: AWS 28% / Microsoft Azure 21% / Google 14% / Oracle 4% / Alibaba 4%。
- `AI Neoclouds` は単体プロバイダーではなく、AI-focused challengers の市場シグナルとしてチャート下の補足インサイトに分離表示しています。2026 Q1時点の集計値は約5%です。
- `Google Cloud Momentum` は 2026 Q1 の補足インサイトとして、Google Cloud のシェア 14%、前年比+2pt、Cloud revenue +63%、backlog $460B+ を表示しています。
- Oracle / Alibaba の2025-2026値は公開記事の値を優先しています。2024以前の4番手以降は、過去推移を見せるための補間・文脈値を含みます。
- 参照例:
  - https://canalys.dev/newsroom/canalys-worldwide-cloud-infrastructure-Q4-2019-and-full-year-2019
  - https://www.canalys.com/newsroom/global-cloud-market-q4-2020
  - https://canalys.dev/newsroom/global-cloud-services-Q4-2021
  - https://canalys.dev/newsroom/global-cloud-services-Q4-2022
  - https://www.canalys.com/newsroom/worldwide-cloud-q4-2023
  - https://newsflash.tdsynnex.co.uk/industry-updates/worldwide-cloud-service-spending-to-grow-by-19-in-2025/6711
  - https://omdia.tech.informa.com/pr/2025/jun/global-cloud-infrastructure-spending-rose-21percent-in-q1-2025
  - https://www.comparethecloud.net/news/global-cloud-infrastructure-spending-hit-1109-billion-in-q4-2025-omdia-reports
  - https://www.srgresearch.com/articles/cloud-market-growth-rate-jumps-as-annual-spending-forecast-is-increased-by-65-billion
  - https://www.srgresearch.com/articles/cloud-market-annual-revenue-run-rate-topped-half-a-trillion-dollars-in-q1-as-growth-surge-continues
  - https://www.crnasia.com/news-network/2026/cloud-market-share-q1-2026-aws-microsoft-google-battling-in-ai-era
  - https://s206.q4cdn.com/479360582/files/doc_financials/2026/q1/Alphabet-Q1-2026-Earnings-Slides.pdf

## Local preview

```powershell
python -m http.server 8099 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8099/
```
