# Cloud Market Racing Chart v2

AWS / Azure / Google Cloud のクラウド市場シェア推移を、軽量な Canvas 2D レンダリングで操作できるレーシングチャートです。

## 更新方針

この版では、古い DOM 更新中心の実装をやめ、UI イメージに忠実な 2026 年風のデザインへ寄せました。

- Formal / Casual の表示モード切替
- Canvas 2D によるチャート描画
- Play / Pause / Reset
- Timeline scrubber
- Speed: 0.5x / 1x / 1.5x / 2x
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

## Local preview

```powershell
python -m http.server 8099 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8099/
```
