# fitsyou

## Versioning

The extension version shown in Chrome (`chrome://extensions`) comes from **`package.json`'s `version` field**, not from `extension/public/manifest.json`. The webpack build injects it into the manifest at build time, overwriting the placeholder in the source file.

**To bump the version before submitting to the Chrome Web Store:**
1. Edit **`package.json` line 3** — change the `"version"` field (e.g., `"1.0.1"` → `"1.2.0"`).
2. Run `npm run build:prod` to rebuild the extension and inject the new version into `dist/manifest.json`.
3. Zip the contents of `dist/` and upload to the Chrome Web Store.