import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaruI18n } from '../core';
import { mountDevtools } from '../devtools/index';
import type { Translations } from '../core';

const translations: Translations = {
  'Hello': { ja: 'こんにちは', zh: '你好' },
  'World': { ja: '世界' },
};

function setupDOM() {
  document.body.innerHTML = `<p>Hello</p><p>World</p>`;
}

function getShadowRoot(): ShadowRoot {
  const host = document.querySelector('[data-maru-ignore]')!;
  return host.shadowRoot!;
}

describe('Devtools', () => {
  beforeEach(() => {
    setupDOM();
  });

  describe('mountDevtools()', () => {
    it('should mount devtools panel in shadow DOM', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const host = document.querySelector('[data-maru-ignore]');
      expect(host).not.toBeNull();
      expect(host!.shadowRoot).not.toBeNull();
    });

    it('should return a cleanup function', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      const destroy = mountDevtools(i18n);

      expect(typeof destroy).toBe('function');
      destroy();

      // Host should be removed
      expect(document.querySelector('[data-maru-ignore]')).toBeNull();
    });

    it('should show current language', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const infoValues = shadow.querySelectorAll('.info-value');
      // First .info-value is current lang
      expect(infoValues[0].textContent).toContain('en');
    });

    it('should show default language', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const infoValues = shadow.querySelectorAll('.info-value');
      // Second .info-value (inside settings) is default lang
      // Settings is closed by default, so check accordion content
      expect(shadow.querySelector('.panel-body')!.innerHTML).toContain('en');
    });

    it('should show change language buttons', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const langBtns = shadow.querySelectorAll('.change-lang-btn');
      expect(langBtns.length).toBeGreaterThanOrEqual(2); // en, ja, zh
    });

    it('should change language when button clicked', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const jaBtn = Array.from(shadow.querySelectorAll('.change-lang-btn'))
        .find((b) => b.textContent === 'ja') as HTMLElement;
      jaBtn?.click();

      expect(i18n.getLang()).toBe('ja');
    });

    it('should show collected texts', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const textList = shadow.querySelector('.text-list')!;
      expect(textList.innerHTML).toContain('Hello');
      expect(textList.innerHTML).toContain('World');
    });

    it('should re-render when language changes', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      i18n.setLang('ja');

      const shadow = getShadowRoot();
      // Active button should now be 'ja'
      const activeBtn = shadow.querySelector('.change-lang-btn.active');
      expect(activeBtn?.textContent).toBe('ja');
    });
  });

  describe('position', () => {
    it('should default to bottom-right', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const panel = shadow.querySelector('.maru-devtools') as HTMLElement;
      expect(panel.getAttribute('style')).toContain('bottom');
      expect(panel.getAttribute('style')).toContain('right');
    });

    it('should accept position option', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n, { position: 'top-left' });

      const shadow = getShadowRoot();
      const panel = shadow.querySelector('.maru-devtools') as HTMLElement;
      expect(panel.getAttribute('style')).toContain('top');
      expect(panel.getAttribute('style')).toContain('left');
    });

    it('should change position when preset button clicked', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Open settings accordion first
      const settingsHeader = shadow.querySelector('[data-accordion="settings"]') as HTMLElement;
      settingsHeader.click();

      const topLeftBtn = Array.from(shadow.querySelectorAll('.pos-btn'))
        .find((b) => b.textContent === 'top-left') as HTMLElement;
      topLeftBtn?.click();

      const panel = shadow.querySelector('.maru-devtools') as HTMLElement;
      expect(panel.getAttribute('style')).toContain('top');
      expect(panel.getAttribute('style')).toContain('left');
    });
  });

  describe('collapse/expand', () => {
    it('should toggle collapsed state on header click', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const header = shadow.querySelector('.panel-header') as HTMLElement;
      // Click on the h3, not the drag handle
      const h3 = header.querySelector('h3') as HTMLElement;
      h3.click();

      const panel = shadow.querySelector('.maru-devtools')!;
      expect(panel.classList.contains('collapsed')).toBe(true);
    });
  });

  describe('JSON template generation', () => {
    it('should generate JSON with all target languages', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Open texts accordion (should be open by default)
      const genBtn = shadow.querySelector('#maru-gen-json') as HTMLElement;
      genBtn.click();

      const jsonOutput = shadow.querySelector('#maru-json')!;
      const json = JSON.parse(jsonOutput.textContent!);

      // defaultLang (en) should be excluded
      expect(json['Hello']).toBeDefined();
      expect(json['Hello']['en']).toBeUndefined();
      expect(json['Hello']['ja']).toBe('こんにちは');
      expect(json['Hello']['zh']).toBe('你好');
    });

    it('should exclude entries where value equals the key', () => {
      const trans: Translations = {
        'Hello': { ja: 'こんにちは', zh: 'Hello' }, // zh value == key
      };
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations: trans, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const genBtn = shadow.querySelector('#maru-gen-json') as HTMLElement;
      genBtn.click();

      const jsonOutput = shadow.querySelector('#maru-json')!;
      const json = JSON.parse(jsonOutput.textContent!);

      expect(json['Hello']['zh']).toBeUndefined();
      expect(json['Hello']['ja']).toBe('こんにちは');
    });

    it('should show empty string for missing translations', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const trans: Translations = {
        'Hello': { ja: 'こんにちは' }, // zh missing
      };
      const i18n = new MaruI18n();
      i18n.init({ translations: trans, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();

      // Open settings to add zh
      const settingsHeader = shadow.querySelector('[data-accordion="settings"]') as HTMLElement;
      settingsHeader.click();

      const input = shadow.querySelector('#maru-lang-input') as HTMLInputElement;
      input.value = 'zh';
      const addBtn = shadow.querySelector('#maru-add-lang') as HTMLElement;
      addBtn.click();

      const genBtn = shadow.querySelector('#maru-gen-json') as HTMLElement;
      genBtn.click();

      const jsonOutput = shadow.querySelector('#maru-json')!;
      const json = JSON.parse(jsonOutput.textContent!);
      expect(json['Hello']['zh']).toBe('');
    });
  });

  describe('target languages management', () => {
    it('should add languages via input', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Open settings
      const settingsHeader = shadow.querySelector('[data-accordion="settings"]') as HTMLElement;
      settingsHeader.click();

      const input = shadow.querySelector('#maru-lang-input') as HTMLInputElement;
      input.value = 'ko, fr';
      const addBtn = shadow.querySelector('#maru-add-lang') as HTMLElement;
      addBtn.click();

      // Check tags
      const tags = shadow.querySelectorAll('.lang-tag');
      const tagTexts = Array.from(tags).map((t) => t.textContent!.replace('×', ''));
      expect(tagTexts).toContain('ko');
      expect(tagTexts).toContain('fr');
    });

    it('should remove language when × clicked', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Open settings
      const settingsHeader = shadow.querySelector('[data-accordion="settings"]') as HTMLElement;
      settingsHeader.click();

      const removeBtns = shadow.querySelectorAll('.remove-lang');
      const jaRemove = Array.from(removeBtns).find(
        (b) => (b as HTMLElement).dataset.lang === 'ja',
      ) as HTMLElement;
      jaRemove?.click();

      // After re-render, ja tag should be gone
      const tags = shadow.querySelectorAll('.lang-tag');
      const tagTexts = Array.from(tags).map((t) => t.textContent!.replace('×', ''));
      expect(tagTexts).not.toContain('ja');
    });
  });

  describe('filter buttons', () => {
    it('should deactivate filter on click', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const domFilter = shadow.querySelector('.filter-btn[data-filter="dom"]') as HTMLElement;
      expect(domFilter?.classList.contains('active')).toBe(true);

      domFilter?.click();
      const domFilter2 = getShadowRoot().querySelector('.filter-btn[data-filter="dom"]') as HTMLElement;
      expect(domFilter2?.classList.contains('active')).toBe(false);
    });

    it('should reactivate filter on second click', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const domFilter = shadow.querySelector('.filter-btn[data-filter="dom"]') as HTMLElement;
      // Deactivate
      domFilter?.click();
      // Reactivate
      getShadowRoot().querySelector('.filter-btn[data-filter="dom"]')!.dispatchEvent(new Event('click'));
      const domFilter3 = getShadowRoot().querySelector('.filter-btn[data-filter="dom"]') as HTMLElement;
      expect(domFilter3?.classList.contains('active')).toBe(true);
    });
  });

  describe('texts accordion toggle', () => {
    it('should toggle texts accordion', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const textsHeader = shadow.querySelector('[data-accordion="texts"]') as HTMLElement;
      textsHeader.click();
      // Should be closed
      const body = getShadowRoot().querySelector('#acc-texts');
      expect(body?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('add language via Enter key', () => {
    it('should add language on Enter', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Open settings
      (shadow.querySelector('[data-accordion="settings"]') as HTMLElement).click();

      const input = getShadowRoot().querySelector('#maru-lang-input') as HTMLInputElement;
      input.value = 'ko';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      const tags = getShadowRoot().querySelectorAll('.lang-tag');
      const tagTexts = Array.from(tags).map((t) => t.textContent!.replace('×', ''));
      expect(tagTexts).toContain('ko');
    });
  });

  describe('select all / deselect all', () => {
    it('should select all visible texts', () => {
      document.body.innerHTML = `<p>Hello</p><p>World</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const selectAll = shadow.querySelector('#maru-select-all') as HTMLElement;
      selectAll?.click();

      // After select all, all visible checkboxes should be checked
      const checkboxes = getShadowRoot().querySelectorAll('.text-item input[type="checkbox"]');
      for (const cb of checkboxes) {
        expect((cb as HTMLInputElement).checked).toBe(true);
      }
    });

    it('should deselect all visible texts', () => {
      document.body.innerHTML = `<p>Hello</p><p>World</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const deselectAll = shadow.querySelector('#maru-deselect-all') as HTMLElement;
      deselectAll?.click();

      const checkboxes = getShadowRoot().querySelectorAll('.text-item input[type="checkbox"]');
      for (const cb of checkboxes) {
        expect((cb as HTMLInputElement).checked).toBe(false);
      }
    });
  });

  describe('checkbox interaction', () => {
    it('should update filter counts when checkbox unchecked', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const cb = shadow.querySelector('.text-item input[type="checkbox"]') as HTMLInputElement;
      expect(cb.checked).toBe(true);

      // Uncheck
      cb.checked = false;
      cb.dispatchEvent(new Event('change'));

      const domFilter = getShadowRoot().querySelector('.filter-btn[data-filter="dom"]') as HTMLElement;
      expect(domFilter?.textContent).toContain('0/');
    });

    it('should update filter counts when checkbox checked', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      // First uncheck
      const shadow = getShadowRoot();
      const cb = shadow.querySelector('.text-item input[type="checkbox"]') as HTMLInputElement;
      cb.checked = false;
      cb.dispatchEvent(new Event('change'));

      // Then check again
      const cb2 = getShadowRoot().querySelector('.text-item input[type="checkbox"]') as HTMLInputElement;
      cb2.checked = true;
      cb2.dispatchEvent(new Event('change'));

      const domFilter = getShadowRoot().querySelector('.filter-btn[data-filter="dom"]') as HTMLElement;
      expect(domFilter?.textContent).toContain('1/');
    });
  });

  describe('text label click', () => {
    it('should scroll to element and highlight', () => {
      document.body.innerHTML = `<p id="target">Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const label = shadow.querySelector('.text-label') as HTMLElement;
      expect(label).not.toBeNull();

      // Mock scrollIntoView
      const targetEl = document.getElementById('target')!;
      targetEl.scrollIntoView = vi.fn();

      label.click();
      expect(targetEl.scrollIntoView).toHaveBeenCalled();
      expect(targetEl.classList.contains('maru-highlight-flash')).toBe(true);
    });
  });

  describe('copy JSON', () => {
    it('should call clipboard API', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Generate JSON first
      const genBtn = shadow.querySelector('#maru-gen-json') as HTMLElement;
      genBtn.click();

      // Mock clipboard
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const copyBtn = getShadowRoot().querySelector('#maru-copy-json') as HTMLElement;
      copyBtn.click();

      expect(writeText).toHaveBeenCalled();
    });
  });

  describe('drag', () => {
    it('should update position on drag', () => {
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      const dragHandle = shadow.querySelector('#maru-drag') as HTMLElement;

      // Simulate drag
      dragHandle.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150 }));
      document.dispatchEvent(new MouseEvent('mouseup'));

      const panel = shadow.querySelector('.maru-devtools') as HTMLElement;
      expect(panel.getAttribute('style')).toContain('left:');
      expect(panel.getAttribute('style')).toContain('top:');
    });
  });

  describe('includeSelectors option', () => {
    it('should classify texts in include areas from other instances', () => {
      document.body.innerHTML = `
        <p>Normal text</p>
        <div class="other-include"><p>Include area text</p></div>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations: { 'Normal text': { ja: 'テスト' } }, defaultLang: 'en' });
      mountDevtools(i18n, { includeSelectors: ['.other-include'] });

      const shadow = getShadowRoot();
      const incFilter = shadow.querySelector('.filter-btn[data-filter="include-nodef"]');
      expect(incFilter).not.toBeNull();
    });
  });

  describe('excludeSelectors option', () => {
    it('should classify texts in extra exclude areas', () => {
      document.body.innerHTML = `
        <p>Normal text</p>
        <div class="extra-exc"><p>Extra excluded text</p></div>
      `;
      const i18n = new MaruI18n();
      i18n.init({ translations: { 'Normal text': { ja: 'テスト' } }, defaultLang: 'en' });
      mountDevtools(i18n, { excludeSelectors: ['.extra-exc'] });

      const shadow = getShadowRoot();
      const excFilter = shadow.querySelector('.filter-btn[data-filter="exclude-nodef"]');
      expect(excFilter).not.toBeNull();
    });
  });

  describe('t()-only texts', () => {
    it('should show t()-only texts when filter is active', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.t('Only via t()');
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Activate t() filter
      const tFilter = shadow.querySelector('.filter-btn[data-filter="t-only"]') as HTMLElement;
      if (tFilter) tFilter.click();

      const items = getShadowRoot().querySelectorAll('.text-item');
      const texts = Array.from(items).map((item) => item.textContent);
      expect(texts.some((t) => t?.includes('Only via t()'))).toBe(true);
    });
  });

  describe('t()-only default unchecked', () => {
    it('should default t()-only texts to unchecked', () => {
      document.body.innerHTML = `<p>Hello</p>`;
      const i18n = new MaruI18n();
      i18n.init({ translations, defaultLang: 'en' });
      i18n.t('t-only text');
      mountDevtools(i18n);

      const shadow = getShadowRoot();
      // Activate t() filter
      const tFilter = shadow.querySelector('.filter-btn[data-filter="t-only"]') as HTMLElement;
      if (tFilter) tFilter.click();

      const checkboxes = getShadowRoot().querySelectorAll('.text-item input[type="checkbox"]');
      const tOnlyCbs = Array.from(checkboxes).filter((_, idx) => {
        const items = getShadowRoot().querySelectorAll('.text-item');
        return items[idx]?.textContent?.includes('t-only text');
      });
      // t-only text should be unchecked
      for (const cb of tOnlyCbs) {
        expect((cb as HTMLInputElement).checked).toBe(false);
      }
    });
  });
});
