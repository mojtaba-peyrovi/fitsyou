# fitsyou

## Versioning

The extension version shown in Chrome (`chrome://extensions`) comes from `package.json`'s `version` field, not from `extension/public/manifest.json`. The webpack build injects it into the manifest at build time, overwriting the placeholder `0.0.0` in the source file.

To release a new version:
1. Bump `version` in `package.json`.
2. Run `npm run build:prod`.
3. Zip the contents of `dist/` and upload to the Chrome Web Store.