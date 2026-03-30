# maru-i18n

CSR-only i18n library. No HTML changes needed — just provide translation files.

## Commands
- `npm run build` — ESM/CJS + UMD build
- `npm run test` — vitest (happy-dom)
- `npm run typecheck` — tsc --noEmit
- Examples: `npx vite serve examples/vanilla` or `npx vite serve examples/react`

## Architecture
- `src/core.ts` — MaruI18n class. All instances share `data-maru-i18n` attribute. `setLang` only updates keys in own translations.
- `src/adapters/react.tsx` — MaruProvider + useMaruI18n hook. Init runs in useEffect (DOM needed).
- `src/devtools/index.ts` — Shadow DOM panel. Mounted on one instance; use `includeSelectors`/`excludeSelectors` to recognize other instances' areas.
- Translations structure: `{ 'original text': { ja: '翻訳', zh: '翻译' } }` (keyed by original text, not by language)

## Key Design Decisions
- Single `data-maru-i18n` attribute shared across all instances (value = original text as key)
- `defaultLang` option: declares HTML's language. `setLang(defaultLang)` falls back to key text.
- display:contents wrapping: `data-maru-ws` stores leading/trailing whitespace (tab-separated)
- `setLang` updates `<html lang="...">` automatically
- devtools uses MutationObserver (200ms debounce) to auto-refresh text list on DOM changes

## Testing
- vitest + happy-dom environment
- DOM must be reset in beforeEach (instances accumulate state)
- MutationObserver tests need `await new Promise(r => setTimeout(r, 0))` for async callbacks
- React tests use @testing-library/react with `act()` for useEffect timing

## Gotchas
- Elements whose textContent is overwritten by JS must have `data-maru-ignore` to prevent setLang conflicts
- Mixed text nodes: text node must exactly match a translation key after trim (no partial matching)
- Wrap in `<span>` to make a single text node for mixed content translation
- vite-plugin-dts bundled TS version warning is safe to ignore
- All documentation, commit messages, and PR descriptions must be in English
