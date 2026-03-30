# maru-i18n

[![npm version](https://img.shields.io/npm/v/maru-i18n)](https://www.npmjs.com/package/maru-i18n)
[![bundle size](https://img.shields.io/bundlephobia/minzip/maru-i18n)](https://bundlephobia.com/package/maru-i18n)

**Translate any webpage without touching HTML.** Just provide translation files and maru-i18n handles the rest.

> **CSR only.** This library is designed for Client-Side Rendering. SSR / SSG are not supported.

## Features

- **Zero dependencies** — no runtime deps
- **No HTML changes required** — works with your existing markup as-is
- **Automatic DOM scanning** — uses TreeWalker to detect text nodes and match them against translation keys
- **Dynamic content support** — MutationObserver watches for DOM changes in SPAs
- **Framework support** — Vanilla JS, React, and CDN (UMD global)
- **Devtools panel** — floating UI for inspecting collected texts and generating JSON templates

## Install

```bash
npm install maru-i18n
```

## Quick Start

### 1. Define translations

```js
const translations = {
  'Hello, World!': {
    ja: 'こんにちは、世界！',
    fr: 'Bonjour, le monde !',
  },
  'Welcome to my site': {
    ja: '私のサイトへようこそ',
    fr: 'Bienvenue sur mon site',
  },
};
```

### 2a. Vanilla JS

```js
import { createMaruI18n } from 'maru-i18n';

const i18n = createMaruI18n();
i18n.init({ translations });
i18n.observe(); // watch for dynamic DOM changes

i18n.setLang('ja');
```

### 2b. React

```tsx
import { MaruProvider, useMaruTranslation } from 'maru-i18n/react';

function App() {
  const { t, setLang, lang } = useMaruTranslation();
  return (
    <div>
      <h1>Hello, World!</h1>
      <p>{t('Welcome to my site')}</p>
      <button onClick={() => setLang('ja')}>Japanese</button>
    </div>
  );
}

// Wrap your root with MaruProvider
<MaruProvider translations={translations} lang="ja">
  <App />
</MaruProvider>
```

### 2c. CDN (UMD)

```html
<script src="https://unpkg.com/maru-i18n/dist/maru-i18n.umd.js"></script>
<script>
  var i18n = maruI18n.createMaruI18n();
  i18n.init({
    translations: { 'Hello': { ja: 'こんにちは' } },
  });
  i18n.setLang('ja');
</script>
```

## API

### `createMaruI18n(): MaruInstance`

Creates a new maru-i18n instance.

### `MaruInstance`

| Method | Description |
|---|---|
| `init(options)` | Scan the DOM and mark translatable text nodes |
| `setLang(lang)` | Switch language. If called before `init`, the value is queued |
| `getLang()` | Returns the current language code |
| `getAvailableLangs()` | Returns an array of available language codes |
| `t(text)` | Pure string translation (useful in React / JS logic) |
| `ignore(el)` | Exclude an element from translation |
| `observe(root?)` | Start MutationObserver for dynamic DOM updates |
| `onChange(fn)` | Register a language-change listener. Returns an unsubscribe function |
| `getCollectedTexts()` | Returns an array of all collected source texts |
| `destroy()` | Disconnect observer and remove all listeners |

### `MaruOptions`

```ts
interface MaruOptions {
  translations: Record<string, Record<string, string>>;
  lang?: string;       // initial language
  root?: HTMLElement;   // scan root (default: document.body)
  include?: string;     // CSS selector — only translate inside matching elements
  exclude?: string;     // CSS selector — skip matching elements
}
```

### React

```tsx
import { MaruProvider, useMaruTranslation } from 'maru-i18n/react';
```

| Export | Description |
|---|---|
| `MaruProvider` | Context provider. Accepts `translations`, `lang`, `include`, `exclude` props |
| `useMaruTranslation()` | Returns `{ t, setLang, lang, availableLangs }` |

### Devtools

```js
import { mountDevtools } from 'maru-i18n/devtools';

mountDevtools(i18n); // shows a floating panel
```

Automatically disabled when `NODE_ENV === 'production'`.

## How It Works

1. `init()` walks the entire DOM tree using TreeWalker
2. Text nodes whose content matches a key in `translations` get a `data-maru-i18n` attribute
3. If the parent element has only that text node as a child, the attribute is set on the parent directly
4. Otherwise the text node is wrapped in `<span data-maru-i18n="..." style="display:contents">` (zero layout impact)
5. `setLang()` queries all `[data-maru-i18n]` elements and updates their text content

### Excluding Elements

- Add `data-maru-ignore` attribute to any element
- Use the `exclude` option with a CSS selector
- `<script>`, `<style>`, `<noscript>`, `<textarea>`, `<code>`, `<pre>` are always skipped

## Singleton

A pre-created instance is available for convenience:

```js
import { maru } from 'maru-i18n';

maru.init({ translations });
maru.setLang('ja');
```

## TypeScript

All types are exported:

```ts
import type { Translations, MaruOptions, MaruInstance } from 'maru-i18n';
```

## Browser Support

Modern browsers supporting ES2020 (latest Chrome, Firefox, Safari, Edge).

## License

MIT
