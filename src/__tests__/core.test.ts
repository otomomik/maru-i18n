import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaruI18n } from '../core';
import type { Translations } from '../core';

const translations: Translations = {
  'Hello': { ja: 'こんにちは', zh: '你好' },
  'World': { ja: '世界', zh: '世界' },
  'Goodbye': { ja: 'さようなら' },
};

/** Query all elements marked by maru-i18n */
function queryAllMarked(root: Element | Document = document): Element[] {
  return Array.from(root.querySelectorAll('[data-maru-i18n]'));
}

function setupDOM() {
  document.body.innerHTML = `
    <div id="app">
      <h1>Hello</h1>
      <p>World</p>
      <p>Goodbye</p>
      <p>Not translated</p>
    </div>
  `;
}

describe('MaruI18n', () => {
  beforeEach(() => {
    setupDOM();
  });

  // ===========================================
  // init
  // ===========================================
  describe('init()', () => {
    it('should scan and mark translatable text nodes', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      expect(queryAllMarked(document.body).length).toBe(3);
    });

    it('should not mark text nodes that are not in translations', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      const p = document.querySelectorAll('p');
      const lastP = p[p.length - 1];
      expect(lastP.hasAttribute('data-maru-i18n')).toBe(false);
    });

    it('should use document.body as default root', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      expect(queryAllMarked(document.body).length).toBe(3);
    });

    it('should use custom root element', () => {
      document.body.innerHTML = `
        <div id="root"><p>Hello</p></div>
        <div id="outside"><p>Hello</p></div>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations, root: document.getElementById('root') as HTMLElement });

      expect(queryAllMarked(document.getElementById('root')!).length).toBe(1);
      expect(queryAllMarked(document.getElementById('outside')!).length).toBe(0);
    });

    it('should apply defaultLang on init', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'ja' });
      expect(i18n.getLang()).toBe('ja');
      const h1 = document.querySelector('h1')!;
      expect(h1.textContent).toBe('こんにちは');
    });

    it('should apply lang option over defaultLang', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en', lang: 'ja' });
      expect(i18n.getLang()).toBe('ja');
    });

    it('should apply pending lang set before init', () => {
      const i18n = new MaruI18n();
      i18n.setLang('ja');
      i18n.init({ translations });
      expect(i18n.getLang()).toBe('ja');
      expect(document.querySelector('h1')!.textContent).toBe('こんにちは');
    });
  });

  // ===========================================
  // setLang
  // ===========================================
  describe('setLang()', () => {
    it('should update all marked elements to the target language', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');

      expect(document.querySelector('h1')!.textContent).toBe('こんにちは');
      expect(document.querySelectorAll('p')[0].textContent).toBe('世界');
      expect(document.querySelectorAll('p')[1].textContent).toBe('さようなら');
    });

    it('should fallback to original text if translation is missing', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('zh');

      // "Goodbye" has no zh translation
      expect(document.querySelectorAll('p')[1].textContent).toBe('Goodbye');
    });

    it('should restore original text when switching back to default', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      i18n.setLang('en');

      // en is not in translations, so fallback to key
      expect(document.querySelector('h1')!.textContent).toBe('Hello');
    });

    it('should queue lang if called before init', () => {
      const i18n = new MaruI18n();
      i18n.setLang('ja');
      expect(i18n.getLang()).toBe('');
      i18n.init({ translations });
      expect(i18n.getLang()).toBe('ja');
    });
  });

  // ===========================================
  // t()
  // ===========================================
  describe('t()', () => {
    it('should translate a string for the current language', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(i18n.t('Hello')).toBe('こんにちは');
    });

    it('should return original text if no translation exists', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(i18n.t('Unknown text')).toBe('Unknown text');
    });

    it('should return original text if no language is set', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      expect(i18n.t('Hello')).toBe('Hello');
    });

    it('should add text to collectedTexts', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.t('Hello');
      i18n.t('Something new');
      const collected = i18n.getCollectedTexts();
      expect(collected).toContain('Hello');
      expect(collected).toContain('Something new');
    });
  });

  // ===========================================
  // getLang / getDefaultLang / getAvailableLangs
  // ===========================================
  describe('getLang()', () => {
    it('should return empty string before init', () => {
      const i18n = new MaruI18n();
      expect(i18n.getLang()).toBe('');
    });

    it('should return current language', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(i18n.getLang()).toBe('ja');
    });
  });

  describe('getDefaultLang()', () => {
    it('should return empty string if not set', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      expect(i18n.getDefaultLang()).toBe('');
    });

    it('should return the default language', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      expect(i18n.getDefaultLang()).toBe('en');
    });
  });

  describe('getAvailableLangs()', () => {
    it('should return all language codes from translations', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      const langs = i18n.getAvailableLangs();
      expect(langs).toContain('ja');
      expect(langs).toContain('zh');
    });

    it('should include defaultLang', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      expect(i18n.getAvailableLangs()).toContain('en');
    });

    it('should not have duplicates', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'ja' });
      const langs = i18n.getAvailableLangs();
      expect(langs.filter((l) => l === 'ja').length).toBe(1);
    });
  });

  // ===========================================
  // getTranslations
  // ===========================================
  describe('getTranslations()', () => {
    it('should return the translations object', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      expect(i18n.getTranslations()).toBe(translations);
    });
  });

  // ===========================================
  // ignore
  // ===========================================
  describe('ignore()', () => {
    it('should prevent element from being translated', () => {
      document.body.innerHTML = `<p id="a">Hello</p><p id="b">World</p>`;
      const i18n = new MaruI18n();
      i18n.ignore(document.getElementById('a')!);
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');

      expect(document.getElementById('a')!.textContent).toBe('Hello');
      expect(document.getElementById('b')!.textContent).toBe('世界');
    });

    it('should prevent children from being translated', () => {
      document.body.innerHTML = `<div id="parent"><p>Hello</p></div>`;
      const i18n = new MaruI18n();
      i18n.ignore(document.getElementById('parent')!);
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');

      expect(document.querySelector('p')!.textContent).toBe('Hello');
    });
  });

  // ===========================================
  // data-maru-ignore attribute
  // ===========================================
  describe('data-maru-ignore attribute', () => {
    it('should skip elements with data-maru-ignore', () => {
      document.body.innerHTML = `
        <p>Hello</p>
        <div data-maru-ignore><p>World</p></div>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');

      expect(document.querySelectorAll('p')[0].textContent).toBe('こんにちは');
      expect(document.querySelectorAll('p')[1].textContent).toBe('World');
    });
  });

  // ===========================================
  // exclude option
  // ===========================================
  describe('exclude option', () => {
    it('should skip elements matching exclude selector', () => {
      document.body.innerHTML = `
        <p>Hello</p>
        <div class="no-translate"><p>World</p></div>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en', exclude: '.no-translate' });
      i18n.setLang('ja');

      expect(document.querySelectorAll('p')[0].textContent).toBe('こんにちは');
      expect(document.querySelectorAll('p')[1].textContent).toBe('World');
    });
  });

  // ===========================================
  // include option
  // ===========================================
  describe('include option', () => {
    it('should only translate inside matching elements', () => {
      document.body.innerHTML = `
        <p>Hello</p>
        <div class="translate-me"><p>World</p></div>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en', include: '.translate-me' });
      i18n.setLang('ja');

      expect(document.querySelectorAll('p')[0].textContent).toBe('Hello');
      expect(document.querySelectorAll('p')[1].textContent).toBe('世界');
    });
  });

  // ===========================================
  // SKIP_TAGS
  // ===========================================
  describe('skip tags', () => {
    it.each(['script', 'style', 'noscript', 'textarea', 'code', 'pre'])(
      'should not translate text inside <%s>',
      (tag) => {
        document.body.innerHTML = `<${tag}>Hello</${tag}><p>Hello</p>`;
        const i18n = new MaruI18n();
        i18n.init({ translations, defaultLang: 'en' });
        i18n.setLang('ja');

        expect(document.querySelector(tag)!.textContent).toBe('Hello');
        expect(document.querySelector('p')!.textContent).toBe('こんにちは');
      },
    );
  });

  // ===========================================
  // observe (MutationObserver)
  // ===========================================
  describe('observe()', () => {
    it('should translate dynamically added elements', async () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      i18n.observe();

      const p = document.createElement('p');
      p.textContent = 'Hello';
      document.getElementById('app')!.appendChild(p);

      // MutationObserver is async
      await new Promise((r) => setTimeout(r, 0));

      expect(p.textContent).toBe('こんにちは');
    });

    it('should not react to its own mutations', () => {
      setupDOM();
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.observe();

      // setLang triggers DOM mutations, observer should not infinitely loop
      i18n.setLang('ja');
      expect(document.querySelector('h1')!.textContent).toBe('こんにちは');

      i18n.setLang('zh');
      expect(document.querySelector('h1')!.textContent).toBe('你好');
    });

    it('should disconnect previous observer when called again', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.observe();
      i18n.observe(); // should not throw
    });
  });

  // ===========================================
  // onChange
  // ===========================================
  describe('onChange()', () => {
    it('should call listener when language changes', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      const fn = vi.fn();
      i18n.onChange(fn);
      i18n.setLang('ja');
      expect(fn).toHaveBeenCalledWith('ja');
    });

    it('should support multiple listeners', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      i18n.onChange(fn1);
      i18n.onChange(fn2);
      i18n.setLang('ja');
      expect(fn1).toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      const fn = vi.fn();
      const unsub = i18n.onChange(fn);
      unsub();
      i18n.setLang('ja');
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // getCollectedTexts
  // ===========================================
  describe('getCollectedTexts()', () => {
    it('should return texts found during scan', () => {
      setupDOM();
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      const texts = i18n.getCollectedTexts();
      expect(texts).toContain('Hello');
      expect(texts).toContain('World');
      expect(texts).toContain('Goodbye');
      expect(texts).not.toContain('Not translated');
    });

    it('should include texts from t() calls', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.t('custom text');
      expect(i18n.getCollectedTexts()).toContain('custom text');
    });
  });

  // ===========================================
  // destroy
  // ===========================================
  describe('destroy()', () => {
    it('should disconnect observer and clear listeners', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.observe();
      const fn = vi.fn();
      i18n.onChange(fn);
      i18n.destroy();

      // setLang queues because initialized is false
      i18n.setLang('ja');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations });
      i18n.destroy();
      i18n.destroy(); // should not throw
    });
  });

  // ===========================================
  // Mixed text nodes (display:contents wrapping)
  // ===========================================
  describe('mixed text nodes', () => {
    it('should wrap text in span with display:contents when parent has mixed children', () => {
      document.body.innerHTML = `<p>Hello <strong>bold</strong></p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });

      const span = document.querySelector('p span');
      expect(span).not.toBeNull();
      expect(span!.getAttribute('style')).toContain('display');
      expect(span!.getAttribute('style')).toContain('contents');
      expect(span!.textContent!.trim()).toBe('Hello');
    });

    it('should mark parent directly when it has single text node', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });

      const p = document.querySelector('p')!;
      expect(p.hasAttribute('data-maru-i18n')).toBe(true);
      expect(p.querySelector('span')).toBeNull();
    });
  });

  // ===========================================
  // Multiple instances
  // ===========================================
  describe('multiple instances', () => {
    it('should scope via include — each instance only translates its own area', () => {
      document.body.innerHTML = `
        <div id="a"><p>Hello</p></div>
        <div id="b"><p>World</p></div>
      `;
      const transA = { 'Hello': { ja: 'こんにちは', zh: '你好' } } as const;
      const transB = { 'World': { ja: '世界', zh: '世界zh' } } as const;

      const i18n1 = new MaruI18n();
      const i18n2 = new MaruI18n();

      i18n1.init({ translations: transA, include: '#a' });
      i18n2.init({ translations: transB, include: '#b' });

      i18n1.setLang('ja');
      i18n2.setLang('zh');

      expect(document.querySelector('#a p')!.textContent).toBe('こんにちは');
      expect(document.querySelector('#b p')!.textContent).toBe('世界zh');
    });

    it('should not interfere — setLang only updates elements with keys in own translations', () => {
      document.body.innerHTML = `
        <div id="a"><p>Hello</p></div>
        <div id="b"><p>Goodbye</p></div>
      `;
      const transA = { 'Hello': { ja: 'こんにちは' } } as const;
      const transB = { 'Goodbye': { ja: 'さようなら' } } as const;

      const i18n1 = new MaruI18n();
      const i18n2 = new MaruI18n();

      i18n1.init({ translations: transA });
      i18n2.init({ translations: transB });

      i18n1.setLang('ja');
      i18n2.setLang('ja');

      expect(document.querySelector('#a p')!.textContent).toBe('こんにちは');
      expect(document.querySelector('#b p')!.textContent).toBe('さようなら');

      // i18n2 setLang should not touch #a
      i18n2.setLang('en');
      expect(document.querySelector('#a p')!.textContent).toBe('こんにちは');
      // Goodbye fallback to key
      expect(document.querySelector('#b p')!.textContent).toBe('Goodbye');
    });
  });

  // ===========================================
  // Whitespace handling
  // ===========================================
  describe('whitespace handling', () => {
    it('should trim whitespace when matching text nodes', () => {
      document.body.innerHTML = `<p>  Hello  </p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(document.querySelector('p')!.textContent).toBe('こんにちは');
    });

    it('should skip whitespace-only text nodes', () => {
      document.body.innerHTML = `<p>   </p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      const marked = document.querySelectorAll('[data-maru-i18n]');
      expect(marked.length).toBe(0);
    });

    it('should preserve surrounding whitespace in display:contents spans', () => {
      document.body.innerHTML = `<p>Hello <strong>bold</strong> World</p>`;
      const trans = {
        'Hello': { ja: 'こんにちは' },
        'World': { ja: '世界' },
      };
      const i18n = new MaruI18n();
      i18n.init({ translations: trans, defaultLang: 'en' });
      i18n.setLang('ja');

      const p = document.querySelector('p')!;
      // Should have spaces preserved: "こんにちは bold 世界" (not "こんにちはbold世界")
      expect(p.textContent).toContain('こんにちは ');
      expect(p.textContent).toContain(' 世界');
    });
  });

  // ===========================================
  // Exclude with nested Include
  // ===========================================
  describe('exclude with nested include', () => {
    it('should translate inside include even when parent is excluded', () => {
      document.body.innerHTML = `
        <div class="excluded">
          <p id="ex">Excluded text</p>
          <div class="nested-inc">
            <p id="inc">Included text</p>
          </div>
        </div>
      `;
      const mainTrans = { 'Excluded text': { ja: '除外テキスト' } };
      const inclTrans = { 'Included text': { ja: 'インクルードテキスト' } };

      const main = new MaruI18n();
      main.init({ translations: mainTrans, defaultLang: 'en', exclude: '.excluded' });

      const incl = new MaruI18n();
      incl.init({ translations: inclTrans, defaultLang: 'en', include: '.nested-inc' });

      main.setLang('ja');
      incl.setLang('ja');

      // Excluded text should NOT be translated
      expect(document.getElementById('ex')!.textContent).toBe('Excluded text');
      // Included text inside excluded parent SHOULD be translated
      expect(document.getElementById('inc')!.textContent).toBe('インクルードテキスト');
    });

    it('should not translate include area text by the main (exclude) instance', () => {
      document.body.innerHTML = `
        <div class="excluded">
          <div class="nested-inc">
            <p id="inc">Included text</p>
          </div>
        </div>
      `;
      const mainTrans = { 'Included text': { ja: 'メインが翻訳' } };

      const main = new MaruI18n();
      main.init({ translations: mainTrans, defaultLang: 'en', exclude: '.excluded' });
      main.setLang('ja');

      // Main instance excludes .excluded, so even though key exists, it shouldn't translate
      expect(document.getElementById('inc')!.textContent).toBe('Included text');
    });
  });

  // ===========================================
  // getMarkedTexts
  // ===========================================
  describe('getMarkedTexts()', () => {
    it('should return only texts marked via scanAndMark', () => {
      setupDOM();
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.t('custom text');
      const marked = i18n.getMarkedTexts();
      expect(marked).toContain('Hello');
      expect(marked).not.toContain('custom text');
    });
  });

  // ===========================================
  // getAllTexts
  // ===========================================
  describe('getAllTexts()', () => {
    it('should return texts in document order with context', () => {
      document.body.innerHTML = `
        <p>Normal text</p>
        <div data-maru-ignore><p>Ignored text</p></div>
        <div class="exc"><p>Excluded text</p></div>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations: { 'Normal text': { ja: 'テスト' } }, defaultLang: 'en', exclude: '.exc' });
      const all = i18n.getAllTexts();
      const normalEntry = all.find((e) => e.text === 'Normal text');
      const ignoredEntry = all.find((e) => e.text === 'Ignored text');
      const excludedEntry = all.find((e) => e.text === 'Excluded text');
      expect(normalEntry).toBeDefined();
      expect(normalEntry!.element).not.toBeNull();
      expect(ignoredEntry?.context).toBe('ignore');
      expect(excludedEntry?.context).toBe('exclude');
    });

    it('should return original text for marked elements even after setLang', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      const all = i18n.getAllTexts();
      const entry = all.find((e) => e.text === 'Hello');
      expect(entry).toBeDefined();
      expect(entry!.text).toBe('Hello');
    });

    it('should include texts from include areas', () => {
      document.body.innerHTML = `
        <div class="inc"><p>Inside</p></div>
        <p>Outside</p>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations: { 'Inside': { ja: 'テスト' } }, defaultLang: 'en', include: '.inc' });
      const all = i18n.getAllTexts();
      // Outside is not filtered out from getAllTexts, just context differs
      expect(all.find((e) => e.text === 'Inside')).toBeDefined();
      expect(all.find((e) => e.text === 'Outside')).toBeDefined();
    });
  });

  // ===========================================
  // setLang updates html lang attribute
  // ===========================================
  describe('html lang attribute', () => {
    it('should update document.documentElement.lang on setLang', () => {
      setupDOM();
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(document.documentElement.lang).toBe('ja');
    });

    it('should not update html lang when syncHtmlLang is false', () => {
      setupDOM();
      document.documentElement.lang = 'en';
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en', syncHtmlLang: false });
      i18n.setLang('ja');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  // ===========================================
  // setLang skip if unchanged
  // ===========================================
  describe('setLang skip if unchanged', () => {
    it('should not fire onChange if language is the same', () => {
      setupDOM();
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      const fn = vi.fn();
      i18n.onChange(fn);
      i18n.setLang('ja'); // same language
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // init called twice (re-initialization)
  // ===========================================
  describe('init() called twice', () => {
    it('should clean up previous state and re-scan with new translations', () => {
      document.body.innerHTML = `<p>Hello</p><p>Goodbye</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations: { 'Hello': { ja: 'こんにちは' } }, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(document.querySelectorAll('p')[0].textContent).toBe('こんにちは');

      // Re-init with different translations
      i18n.init({ translations: { 'Goodbye': { ja: 'さようなら' } }, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(document.querySelectorAll('p')[1].textContent).toBe('さようなら');
    });
  });

  // ===========================================
  // destroy then init (reuse)
  // ===========================================
  describe('destroy then init', () => {
    it('should work correctly after destroy and re-init', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(document.querySelector('p')!.textContent).toBe('こんにちは');

      i18n.destroy();
      // After destroy, DOM should be restored
      expect(document.querySelector('p')!.textContent).toBe('Hello');

      // Re-init
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      expect(document.querySelector('p')!.textContent).toBe('こんにちは');
    });

    it('should clear collectedTexts and markedTexts on destroy', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.t('extra');
      expect(i18n.getCollectedTexts().length).toBeGreaterThan(0);

      i18n.destroy();
      expect(i18n.getCollectedTexts()).toEqual([]);
      expect(i18n.getMarkedTexts()).toEqual([]);
    });
  });

  // ===========================================
  // Invalid CSS selectors
  // ===========================================
  describe('invalid CSS selectors', () => {
    it('should not throw with invalid include selector', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      expect(() => {
        i18n.init({ translations, defaultLang: 'en', include: '[invalid' });
      }).not.toThrow();
    });

    it('should not throw with invalid exclude selector', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      expect(() => {
        i18n.init({ translations, defaultLang: 'en', exclude: '[invalid' });
      }).not.toThrow();
    });
  });

  // ===========================================
  // observe with mixed dynamic content
  // ===========================================
  describe('observe with mixed dynamic content', () => {
    it('should handle dynamically added mixed text nodes', async () => {
      document.body.innerHTML = `<div id="root"></div>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.setLang('ja');
      i18n.observe(document.getElementById('root')!);

      const p = document.createElement('p');
      p.innerHTML = 'Hello <strong>bold</strong>';
      document.getElementById('root')!.appendChild(p);

      await new Promise((r) => setTimeout(r, 0));

      // Hello should be wrapped in display:contents span and translated
      const span = p.querySelector('span[data-maru-i18n]');
      expect(span).not.toBeNull();
    });
  });

  // ===========================================
  // destroy unwraps spans
  // ===========================================
  describe('destroy cleanup', () => {
    it('should unwrap display:contents spans on destroy', () => {
      document.body.innerHTML = `<p>Hello <strong>bold</strong></p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });

      // Verify span was created
      expect(document.querySelector('span[data-maru-i18n]')).not.toBeNull();

      i18n.destroy();

      // Span should be removed
      expect(document.querySelector('span[data-maru-i18n]')).toBeNull();
    });
  });
});
