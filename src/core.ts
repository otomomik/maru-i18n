// ============================================================
// maru-i18n  —  Core library
// ============================================================

/** Translation map: `{ originalText: { lang: translatedText } }` */
export type Translations = Record<string, Record<string, string>>;

/** Accepts known keys with autocomplete, but also allows any string */
export type TranslationKey<T extends Translations> = (keyof T & string) | (string & {});

export interface MaruOptions<T extends Translations = Translations> {
  /** Translation data */
  translations: T;
  /** The language of the original HTML text (e.g. "en") */
  defaultLang?: string;
  /** Initial language code (defaults to defaultLang if set) */
  lang?: string;
  /** Root element to scan (default: document.body) */
  root?: HTMLElement;
  /** CSS selector — only translate inside matching elements */
  include?: string;
  /** CSS selector — skip matching elements */
  exclude?: string;
}

export interface MaruInstance<T extends Translations = Translations> {
  init(options: MaruOptions<T>): void;
  setLang(lang: string): void;
  getLang(): string;
  getDefaultLang(): string;
  getAvailableLangs(): string[];
  getTranslations(): T;
  t(text: TranslationKey<T>): string;
  ignore(el: HTMLElement): void;
  observe(root?: HTMLElement): void;
  onChange(fn: (lang: string) => void): () => void;
  getCollectedTexts(): string[];
  /** Texts found in DOM and marked with data-maru-i18n */
  getMarkedTexts(): string[];
  /** All visible text nodes in the DOM with context info */
  getAllTexts(): { text: string; element: HTMLElement | null; context: 'normal' | 'exclude' | 'include' | 'ignore' }[];
  destroy(): void;
}

// Tags whose content should never be translated
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE',
]);

const ATTR = 'data-maru-i18n';
const WS_ATTR = 'data-maru-ws';
const IGNORE_ATTR = 'data-maru-ignore';

/** Set text content, restoring leading/trailing whitespace if stored */
function setTextWithWs(el: HTMLElement, text: string): void {
  const ws = el.getAttribute(WS_ATTR);
  if (ws) {
    const sepIdx = ws.indexOf('\t');
    const leading = ws.substring(0, sepIdx);
    const trailing = ws.substring(sepIdx + 1);
    el.textContent = leading + text + trailing;
  } else {
    el.textContent = text;
  }
}

export class MaruI18n<T extends Translations = Translations> implements MaruInstance<T> {
  private translations: T = {} as T;
  private defaultLang = '';
  private currentLang = '';
  private pendingLang: string | null = null;
  private root: HTMLElement | null = null;
  private include: string | undefined;
  private exclude: string | undefined;
  private listeners: Set<(lang: string) => void> = new Set();
  private observer: MutationObserver | null = null;
  private initialized = false;
  private isMutating = false;
  private collectedTexts: Set<string> = new Set();
  private markedTexts: Set<string> = new Set();

  // ----------------------------------------------------------
  // init
  // ----------------------------------------------------------
  init(options: MaruOptions<T>): void {
    this.translations = options.translations;
    this.defaultLang = options.defaultLang ?? '';
    this.root = options.root ?? document.body;
    this.include = options.include;
    this.exclude = options.exclude;
    this.initialized = true;

    this.scanAndMark(this.root);

    // Apply pending or initial language
    const lang = this.pendingLang ?? options.lang ?? this.defaultLang;
    this.pendingLang = null;
    if (lang) {
      this.setLang(lang);
    }
  }

  // ----------------------------------------------------------
  // setLang
  // ----------------------------------------------------------
  setLang(lang: string): void {
    if (!this.initialized) {
      this.pendingLang = lang;
      return;
    }

    this.currentLang = lang;

    this.isMutating = true;

    const els = (this.root ?? document.body).querySelectorAll<HTMLElement>(`[${ATTR}]`);
    for (const el of els) {
      const key = el.getAttribute(ATTR)!;
      // Only update elements whose key exists in THIS instance's translations
      if (!(key in this.translations)) continue;
      const entry = this.translations[key];
      if (entry && lang in entry) {
        setTextWithWs(el, entry[lang]);
      } else {
        // Fallback to original text (the key itself)
        setTextWithWs(el, key);
      }
    }

    // Update <html lang="...">
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }

    this.isMutating = false;

    for (const fn of this.listeners) {
      fn(lang);
    }
  }

  // ----------------------------------------------------------
  // t  —  pure string translation
  // ----------------------------------------------------------
  t(text: TranslationKey<T>): string {
    this.collectedTexts.add(text);
    if (!this.currentLang) return text;
    return this.translations[text]?.[this.currentLang] ?? text;
  }

  // ----------------------------------------------------------
  // getLang / getDefaultLang / getAvailableLangs
  // ----------------------------------------------------------
  getLang(): string {
    return this.currentLang;
  }

  getDefaultLang(): string {
    return this.defaultLang;
  }

  getAvailableLangs(): string[] {
    const langs = new Set<string>();
    if (this.defaultLang) langs.add(this.defaultLang);
    for (const key in this.translations) {
      for (const lang in this.translations[key]) {
        langs.add(lang);
      }
    }
    return Array.from(langs);
  }

  // ----------------------------------------------------------
  // getTranslations
  // ----------------------------------------------------------
  getTranslations(): T {
    return this.translations;
  }

  // ----------------------------------------------------------
  // ignore
  // ----------------------------------------------------------
  ignore(el: HTMLElement): void {
    el.setAttribute(IGNORE_ATTR, '');
  }

  // ----------------------------------------------------------
  // observe  —  MutationObserver for dynamic DOM
  // ----------------------------------------------------------
  observe(root?: HTMLElement): void {
    const target = root ?? this.root ?? document.body;
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver((mutations) => {
      if (this.isMutating) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanAndMark(node as HTMLElement);
            // Apply current language to newly marked nodes
            if (this.currentLang) {
              this.applyLangToSubtree(node as HTMLElement);
            }
          }
        }
      }
    });

    this.observer.observe(target, { childList: true, subtree: true });
  }

  // ----------------------------------------------------------
  // onChange
  // ----------------------------------------------------------
  onChange(fn: (lang: string) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  // ----------------------------------------------------------
  // getCollectedTexts
  // ----------------------------------------------------------
  getCollectedTexts(): string[] {
    return Array.from(this.collectedTexts);
  }

  // ----------------------------------------------------------
  // getMarkedTexts
  // ----------------------------------------------------------
  getMarkedTexts(): string[] {
    return Array.from(this.markedTexts);
  }

  // ----------------------------------------------------------
  // getAllTexts — scan all visible text nodes in the DOM
  // ----------------------------------------------------------
  getAllTexts(): { text: string; element: HTMLElement | null; context: 'normal' | 'exclude' | 'include' | 'ignore' }[] {
    const root = this.root ?? document.body;
    type Entry = { text: string; element: HTMLElement | null; context: 'normal' | 'exclude' | 'include' | 'ignore' };
    const results: Entry[] = [];
    const seen = new Set<string>();

    // Single-pass: walk all nodes (elements + text) in document order.
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;

      // Element with data-maru-i18n — read original text from attribute
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (!el.hasAttribute(ATTR)) continue;
        const original = el.getAttribute(ATTR)!;
        if (seen.has(original)) continue;
        seen.add(original);
        // Determine context for marked elements
        let ctx: Entry['context'] = 'normal';
        if (this.exclude && el.closest(this.exclude)) ctx = 'exclude';
        else if (this.include && el.closest(this.include)) ctx = 'include';
        results.push({ text: original, element: el, context: ctx });
        continue;
      }

      // Text node
      const parent = node.parentElement;
      if (!parent) continue;
      if (parent.shadowRoot) continue;
      if (SKIP_TAGS.has(parent.tagName)) continue;
      if (parent.closest(`[${ATTR}]`)) continue;
      const text = (node.textContent ?? '').trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);

      // Determine context
      let ctx: Entry['context'] = 'normal';
      if (parent.closest(`[${IGNORE_ATTR}]`)) ctx = 'ignore';
      else if (this.exclude && parent.closest(this.exclude)) ctx = 'exclude';
      else if (this.include && parent.closest(this.include)) ctx = 'include';
      else if (this.include && !parent.closest(this.include)) ctx = 'normal';
      results.push({ text, element: parent, context: ctx });
    }
    return results;
  }

  // ----------------------------------------------------------
  // destroy
  // ----------------------------------------------------------
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }

  // ----------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------

  /** Collect all translatable text nodes, then mark their parents */
  private scanAndMark(root: HTMLElement): void {
    const allKeys = this.getAllTranslationKeys();
    if (allKeys.size === 0) return;

    // Pass 1: collect text nodes
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // Skip shadow DOM host's internal walker
        if (parent.shadowRoot) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest(`[${IGNORE_ATTR}]`)) return NodeFilter.FILTER_REJECT;
        if (this.exclude && parent.closest(this.exclude)) return NodeFilter.FILTER_REJECT;
        if (this.include && !parent.closest(this.include)) return NodeFilter.FILTER_REJECT;
        // Already marked with this key
        if (parent.hasAttribute(ATTR)) return NodeFilter.FILTER_REJECT;

        const text = (node.textContent ?? '').trim();
        if (!text) return NodeFilter.FILTER_REJECT;
        if (!allKeys.has(text)) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    // Pass 2: mark DOM
    this.isMutating = true;
    for (const textNode of textNodes) {
      const text = (textNode.textContent ?? '').trim();
      this.collectedTexts.add(text);
      this.markedTexts.add(text);
      const parent = textNode.parentElement!;

      // Already processed (another text node in same parent already handled)
      if (parent.hasAttribute(ATTR)) continue;

      // Check if parent has only this single text node child (no element siblings)
      const childNodes = Array.from(parent.childNodes);
      const hasOnlyThisText =
        childNodes.length === 1 && childNodes[0] === textNode;

      if (hasOnlyThisText) {
        // Mark the parent directly
        parent.setAttribute(ATTR, text);
      } else {
        // Wrap in a span with display:contents, preserving surrounding whitespace
        const rawText = textNode.textContent ?? '';
        const leading = rawText.match(/^\s*/)?.[0] ?? '';
        const trailing = rawText.match(/\s*$/)?.[0] ?? '';
        const span = document.createElement('span');
        span.setAttribute(ATTR, text);
        span.style.display = 'contents';
        if (leading || trailing) {
          span.setAttribute('data-maru-ws', `${leading}\t${trailing}`);
        }
        textNode.parentNode!.replaceChild(span, textNode);
        span.appendChild(textNode);
      }
    }
    this.isMutating = false;
  }

  /** Apply current language to all marked nodes within a subtree */
  private applyLangToSubtree(root: HTMLElement): void {
    const lang = this.currentLang;
    const els = root.querySelectorAll
      ? root.querySelectorAll<HTMLElement>(`[${ATTR}]`)
      : [];

    this.isMutating = true;
    for (const el of els) {
      const key = el.getAttribute(ATTR)!;
      if (!(key in this.translations)) continue;
      const entry = this.translations[key];
      if (entry && lang in entry) {
        setTextWithWs(el, entry[lang]);
      }
    }
    // Also check root itself
    if (root.hasAttribute?.(ATTR)) {
      const key = root.getAttribute(ATTR)!;
      if (key in this.translations) {
        const entry = this.translations[key];
        if (entry && lang in entry) {
          setTextWithWs(root, entry[lang]);
        }
      }
    }
    this.isMutating = false;
  }

  /** Get all translation keys (top-level keys of translations) */
  private getAllTranslationKeys(): Set<string> {
    return new Set(Object.keys(this.translations));
  }
}
