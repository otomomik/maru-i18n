import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MaruProvider, useMaruI18n } from '../adapters/react';
import type { Translations } from '../core';

const translations: Translations = {
  'Hello': { ja: 'こんにちは', zh: '你好' },
  'World': { ja: '世界' },
  'Greeting:': { ja: '挨拶:' },
};

function TestApp() {
  const { t, setLang, lang, availableLangs } = useMaruI18n();
  return (
    <div>
      <h1>Hello</h1>
      <p>World</p>
      <span data-testid="t-result">{t('Greeting:')}</span>
      <span data-testid="lang">{lang}</span>
      <span data-testid="available">{availableLangs.join(',')}</span>
      <button onClick={() => setLang('ja')} data-testid="set-ja">JA</button>
      <button onClick={() => setLang('zh')} data-testid="set-zh">ZH</button>
      <button onClick={() => setLang('en')} data-testid="set-en">EN</button>
    </div>
  );
}

describe('React Adapter', () => {
  describe('MaruProvider', () => {
    it('should render children', () => {
      render(
        <MaruProvider translations={translations} defaultLang="en">
          <div data-testid="child">Hello</div>
        </MaruProvider>,
      );
      expect(screen.getByTestId('child')).toBeTruthy();
    });

    it('should initialize with defaultLang', () => {
      render(
        <MaruProvider translations={translations} defaultLang="en">
          <TestApp />
        </MaruProvider>,
      );
      expect(screen.getByTestId('lang').textContent).toBe('en');
    });

    it('should use lang prop over defaultLang', () => {
      render(
        <MaruProvider translations={translations} defaultLang="en" lang="ja">
          <TestApp />
        </MaruProvider>,
      );
      expect(screen.getByTestId('lang').textContent).toBe('ja');
    });

    it('should provide available languages after mount', async () => {
      render(
        <MaruProvider translations={translations} defaultLang="en">
          <TestApp />
        </MaruProvider>,
      );
      // After useEffect runs
      await act(() => new Promise((r) => setTimeout(r, 0)));
      const available = screen.getByTestId('available').textContent!;
      expect(available).toContain('en');
      expect(available).toContain('ja');
      expect(available).toContain('zh');
    });
  });

  describe('useMaruI18n', () => {
    it('should throw if used outside MaruProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      function Bad() {
        useMaruI18n();
        return null;
      }
      expect(() => render(<Bad />)).toThrow('useMaruI18n must be used inside <MaruProvider>');
      consoleError.mockRestore();
    });

    it('should provide t() function', async () => {
      render(
        <MaruProvider translations={translations} defaultLang="en" lang="ja">
          <TestApp />
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));
      expect(screen.getByTestId('t-result').textContent).toBe('挨拶:');
    });

    it('should update lang when setLang is called', async () => {
      render(
        <MaruProvider translations={translations} defaultLang="en">
          <TestApp />
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));

      act(() => {
        screen.getByTestId('set-ja').click();
      });

      expect(screen.getByTestId('lang').textContent).toBe('ja');
    });

    it('should update t() result when language changes', async () => {
      render(
        <MaruProvider translations={translations} defaultLang="en">
          <TestApp />
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));

      // Default: original text
      expect(screen.getByTestId('t-result').textContent).toBe('Greeting:');

      act(() => {
        screen.getByTestId('set-ja').click();
      });

      expect(screen.getByTestId('t-result').textContent).toBe('挨拶:');
    });
  });

  describe('exclude prop', () => {
    it('should not translate elements matching exclude', async () => {
      function App() {
        return (
          <div>
            <p data-testid="included">Hello</p>
            <div className="skip">
              <p data-testid="excluded">Hello</p>
            </div>
          </div>
        );
      }
      render(
        <MaruProvider translations={translations} defaultLang="en" lang="ja" exclude=".skip">
          <App />
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));

      expect(screen.getByTestId('included').textContent).toBe('こんにちは');
      expect(screen.getByTestId('excluded').textContent).toBe('Hello');
    });
  });

  describe('data-maru-ignore in React', () => {
    it('should skip elements with data-maru-ignore', async () => {
      function App() {
        return (
          <div>
            <p data-testid="normal">Hello</p>
            <div data-maru-ignore>
              <p data-testid="ignored">Hello</p>
            </div>
          </div>
        );
      }
      render(
        <MaruProvider translations={translations} defaultLang="en" lang="ja">
          <App />
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));

      expect(screen.getByTestId('normal').textContent).toBe('こんにちは');
      expect(screen.getByTestId('ignored').textContent).toBe('Hello');
    });
  });

  describe('devtools prop', () => {
    it('should mount devtools when devtools={true}', async () => {
      render(
        <MaruProvider translations={translations} defaultLang="en" devtools>
          <div>Hello</div>
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));
      const host = document.querySelector('[data-maru-ignore]');
      expect(host).not.toBeNull();
      expect(host!.shadowRoot).not.toBeNull();
    });

    it('should mount devtools with options object', async () => {
      render(
        <MaruProvider translations={translations} defaultLang="en" devtools={{ position: 'top-left' }}>
          <div>Hello</div>
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));
      const host = document.querySelector('[data-maru-ignore]');
      expect(host).not.toBeNull();
    });

    it('should sync lang prop changes', async () => {
      const { rerender } = render(
        <MaruProvider translations={translations} defaultLang="en" lang="en">
          <TestApp />
        </MaruProvider>,
      );
      await act(() => new Promise((r) => setTimeout(r, 0)));
      expect(screen.getByTestId('lang').textContent).toBe('en');

      rerender(
        <MaruProvider translations={translations} defaultLang="en" lang="ja">
          <TestApp />
        </MaruProvider>,
      );
      expect(screen.getByTestId('lang').textContent).toBe('ja');
    });
  });
});
