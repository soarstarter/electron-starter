# App & Tray Icons

How to change the desktop (dock / taskbar / installer) icon and the system-tray
(menu-bar) icon, and how to regenerate every derived asset from source.

All icon assets live in `resources/build/`:

```
resources/build/
  icon.svg                 # SOURCE — full-color app icon (rounded square + brand mark)
  icon.png                 # 512x512  — dock icon in dev (app.dock.setIcon) + Linux
  icon.icns                # 16→1024  — packaged macOS app bundle icon
  icon.ico                 # 16→256   — packaged Windows app + installer icon
  tray/
    icon-template.svg      # SOURCE — monochrome mark for the macOS menu bar
    icon-template.png      # 22x22   — macOS menu-bar template (@1x)
    icon-template-2x.png   # 44x44   — macOS menu-bar template (@2x / retina)
    icon-light.png         # 22x22   — Windows/Linux tray (colored)
    icon-dark.png          # 22x22   — Windows/Linux tray (colored)
```

Only the two `*.svg` files are hand-edited. Every `.png` / `.icns` / `.ico` is
generated from them with the commands below.

## Where they are used in code

- `lib/main/app.ts` — imports `icon.png` and sets it as the dev dock icon
  (`app.dock?.setIcon`) and the `BrowserWindow` icon. Packaged builds ignore this
  and use the bundle icon from `electron-builder`.
- `lib/main/tray.ts` — on macOS loads `icon-template.png` + `icon-template-2x.png`
  and calls `icon.setTemplateImage(true)` so macOS tints it to match the bar. On
  Windows/Linux it loads `icon-light.png` / `icon-dark.png` based on the OS theme.
- `electron-builder.yml` — no explicit `icon` field; electron-builder auto-detects
  `resources/build/icon.{icns,ico,png}` by platform.

## Design conventions

- **App icon** (`icon.svg`): a `1024×1024` canvas with a rounded square
  (`x=100 y=100 w=824 rx=184`, i.e. macOS-standard padding) filled with the brand
  gradient, and the white brand mark centered on top.
- **Tray template** (`tray/icon-template.svg`): the mark **only** (no background
  square), drawn in solid black `#000` on a transparent canvas. macOS uses the
  alpha channel and recolors it (white on dark bars, black on light). The `viewBox`
  is padded so the mark fills **~60%** of the icon, which sits comfortably next to
  neighboring menu-bar icons. (The menu bar is ~22 pt tall and Apple's template
  glyphs occupy ~16–18 pt of it; a tall, bold mark like this reads heavier, so it
  is tuned smaller than that nominal range.) Shrink the mark by widening the
  `viewBox`; enlarge it by tightening the `viewBox`.

## Changing the icon

1. Replace the mark/gradient in `resources/build/icon.svg`. To reuse an existing
   brand mark, drop its paths into the centered `<g transform=...>` group and keep
   the outer rounded-square `<rect>`.
2. Mirror the same mark (black, no square) in `resources/build/tray/icon-template.svg`.
3. Regenerate all raster assets (below).
4. Sanity-check the results by opening the PNGs, and run the app (`pnpm dev`) to see
   the dock and tray icons.

## Regenerating raster assets

Uses only tools bundled with macOS (`sips`, `iconutil`) plus `png-to-ico` via
`npx` — no ImageMagick / librsvg required. Run from `resources/build/`:

```sh
cd resources/build

# 1) App PNG (512x512)
sips -s format png --resampleHeightWidth 512 512 icon.svg --out icon.png

# 2) macOS .icns — build an iconset, then pack it
ISET=$(mktemp -d)/icon.iconset; mkdir -p "$ISET"
sips -s format png -z 16   16   icon.svg --out "$ISET/icon_16x16.png"
sips -s format png -z 32   32   icon.svg --out "$ISET/icon_16x16@2x.png"
sips -s format png -z 32   32   icon.svg --out "$ISET/icon_32x32.png"
sips -s format png -z 64   64   icon.svg --out "$ISET/icon_32x32@2x.png"
sips -s format png -z 128  128  icon.svg --out "$ISET/icon_128x128.png"
sips -s format png -z 256  256  icon.svg --out "$ISET/icon_128x128@2x.png"
sips -s format png -z 256  256  icon.svg --out "$ISET/icon_256x256.png"
sips -s format png -z 512  512  icon.svg --out "$ISET/icon_256x256@2x.png"
sips -s format png -z 512  512  icon.svg --out "$ISET/icon_512x512.png"
sips -s format png -z 1024 1024 icon.svg --out "$ISET/icon_512x512@2x.png"
iconutil -c icns "$ISET" -o icon.icns

# 3) Windows .ico (multi-resolution)
TMP=$(mktemp -d)
for s in 16 24 32 48 64 128 256; do
  sips -s format png --resampleHeightWidth $s $s icon.svg --out "$TMP/$s.png" >/dev/null
done
npx --yes png-to-ico "$TMP"/16.png "$TMP"/24.png "$TMP"/32.png "$TMP"/48.png \
                     "$TMP"/64.png "$TMP"/128.png "$TMP"/256.png > icon.ico

# 4) macOS menu-bar template (monochrome)
sips -s format png --resampleHeightWidth 22 22 tray/icon-template.svg --out tray/icon-template.png
sips -s format png --resampleHeightWidth 44 44 tray/icon-template.svg --out tray/icon-template-2x.png

# 5) Windows/Linux colored tray icons (reuse the full app icon)
sips -s format png --resampleHeightWidth 22 22 icon.svg --out tray/icon-light.png
sips -s format png --resampleHeightWidth 22 22 icon.svg --out tray/icon-dark.png
```

> Note: `sips` renders SVG via macOS's importer. Gradients, rounded rects, and
> stroked paths (with `stroke-linecap="round"`) all rasterize correctly. Keep the
> source SVGs simple (avoid filters/masks) so they render identically everywhere.
