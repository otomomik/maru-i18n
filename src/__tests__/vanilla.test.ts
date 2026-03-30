import { describe, it, expect } from 'vitest';
import { createMaruI18n } from '../adapters/vanilla';
import { MaruI18n, createMaruI18n as createFromIndex } from '../index';

describe('Vanilla Adapter', () => {
  describe('createMaruI18n()', () => {
    it('should create an independent instance', () => {
      const i18n = createMaruI18n();
      expect(i18n).toBeDefined();
      expect(i18n.getLang()).toBe('');
    });

    it('should create separate instances each call', () => {
      const a = createMaruI18n();
      const b = createMaruI18n();
      expect(a).not.toBe(b);
    });
  });
});

describe('Index exports', () => {
  it('should export MaruI18n class', () => {
    expect(MaruI18n).toBeDefined();
    const instance = new MaruI18n();
    expect(instance.getLang()).toBe('');
  });

  it('should export createMaruI18n', () => {
    expect(createFromIndex).toBeDefined();
    expect(typeof createFromIndex).toBe('function');
  });
});
