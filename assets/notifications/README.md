# Notification Icons

This directory should contain notification icons for different notification types:

- `success.png` - Green checkmark icon (256x256)
- `error.png` - Red X or error icon (256x256)
- `warning.png` - Yellow warning triangle (256x256)
- `info.png` - Blue info circle (256x256)
- `git.png` - Git branch icon (256x256)
- `build.png` - Build/compile icon (256x256)
- `update.png` - Update/download icon (256x256)

## Generating Icons

You can generate these icons from SVG sources:

```bash
# Example for success icon
convert -background none -resize 256x256 success.svg success.png
```

Icons should have:
- Transparent background
- Clear, simple design
- Good contrast
- 256x256 resolution for high DPI displays