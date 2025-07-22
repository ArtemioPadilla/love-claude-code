# Love Claude Code Icon Assets

This directory contains icon assets for the Electron app.

## Application Icons
- `icon.svg` - Source SVG icon (created)
- `icon.png` - PNG version for Linux (1024x1024)
- `icon.icns` - macOS icon format
- `icon.ico` - Windows icon format

## Tray Icons

### Base Icons (Required)
- `tray-icon-Template.png` - macOS tray icon (16x16)
- `tray-icon-Template@2x.png` - macOS Retina tray icon (32x32)
- `tray-icon.ico` - Windows tray icon (16x16, 32x32, 48x48)
- `tray-icon.png` - Linux tray icon (22x22 or 24x24)

### Status Variants (Optional)
- `tray-icon-syncing-Template.png` - Syncing state (macOS)
- `tray-icon-error-Template.png` - Error state (macOS)
- `tray-icon-offline-Template.png` - Offline state (macOS)
- Similar variants for Windows (.ico) and Linux (.png)

## Notification Icons

Located in `notifications/` subdirectory:
- `success.png` - Success notifications (256x256)
- `error.png` - Error notifications (256x256)
- `warning.png` - Warning notifications (256x256)
- `info.png` - Info notifications (256x256)
- `git.png` - Git operation notifications (256x256)
- `build.png` - Build notifications (256x256)
- `update.png` - Update notifications (256x256)

## Generating Icons:

To generate platform-specific icons from the SVG:

```bash
# Install icon generator
npm install -g electron-icon-builder

# Generate all icon formats
electron-icon-builder --input=icon.svg --output=./

# Or manually:
# For PNG (Linux)
convert -background none icon.svg -resize 1024x1024 icon.png

# For ICO (Windows) - requires ImageMagick
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 32x32 icon-32.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 64x64 icon-64.png
convert icon.svg -resize 128x128 icon-128.png
convert icon.svg -resize 256x256 icon-256.png
convert icon-16.png icon-32.png icon-48.png icon-64.png icon-128.png icon-256.png icon.ico

# For ICNS (macOS) - requires iconutil
mkdir icon.iconset
convert icon.svg -resize 16x16 icon.iconset/icon_16x16.png
convert icon.svg -resize 32x32 icon.iconset/icon_16x16@2x.png
convert icon.svg -resize 32x32 icon.iconset/icon_32x32.png
convert icon.svg -resize 64x64 icon.iconset/icon_32x32@2x.png
convert icon.svg -resize 128x128 icon.iconset/icon_128x128.png
convert icon.svg -resize 256x256 icon.iconset/icon_128x128@2x.png
convert icon.svg -resize 256x256 icon.iconset/icon_256x256.png
convert icon.svg -resize 512x512 icon.iconset/icon_256x256@2x.png
convert icon.svg -resize 512x512 icon.iconset/icon_512x512.png
convert icon.svg -resize 1024x1024 icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

## Icon Requirements:

### macOS (.icns)
- Multiple resolutions from 16x16 to 1024x1024
- Must include @2x variants for Retina displays

### Windows (.ico)
- Multiple resolutions: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Single ICO file containing all sizes

### Linux (.png)
- Single high-resolution PNG (512x512 or 1024x1024)
- Used for desktop shortcuts and app launchers