# Chrome Extension Research Notes

Sources checked during implementation:

- Chrome content script docs: static declarations are appropriate for code that should run automatically on known URL patterns, and content scripts can read and modify page DOM.
- Chrome storage docs: `storage.sync` is recommended for user settings that should follow the signed-in Chrome profile.
- Chrome Web Store best practices: optimize for security, privacy, performance, and user experience.
- Chrome MV3 CSP docs: extension pages cannot relax script policy to allow remote code or unsafe eval.
- Open-source extension templates such as `chrome-extension-boilerplate-react-vite`, `chrome-ext-starter`, and `webext-options-sync` favor typed shared settings, build-time bundling, explicit options defaults, and reusable storage helpers.

Project decisions:

- Use a small TypeScript + esbuild pipeline instead of React. The UI is simple enough that React would add weight without reducing complexity.
- Bundle each extension entry into one local file. This avoids content-script module/chunk loading edge cases.
- Keep settings in a shared pure TypeScript module used by popup, options, content script, and tests.
- Avoid a service worker until a real background event boundary exists.
