# Packet

Packet is a Manifest V3 Chrome extension that rewrites visible `npm` and `npx` command snippets to the user's preferred Node.js package manager.

Supported presets:

- npm
- pnpm
- yarn
- bun
- nub
- aube

## Development

```sh
npm install
npm run qa
```

Load the unpacked extension from `dist/` in `chrome://extensions` after `npm run build`.

## Smoke Test

```sh
npm run smoke
```

The smoke test launches an extension-capable Playwright Chromium profile with the unpacked extension, opens live Next.js documentation pages, and verifies that `npm install` and `npx` examples are rewritten.

To force an installed browser channel, run with `PLAYWRIGHT_CHROME_CHANNEL=chrome npm run smoke`.

## Design Notes

- Manifest V3 only.
- No background worker: the popup/options UI persists settings to `chrome.storage.sync`, and the content script reads those settings directly.
- No remote code, inline scripts, or broad API permissions beyond `storage` and the content-script page matches required for page rewriting.
- Text nodes are re-rendered from their original text so changing package managers does not stack replacements.
- A `MutationObserver` handles client-side navigation and dynamically rendered documentation.

## License

MIT
