import { MaruI18n } from '../core';
import type { Translations, MaruOptions, MaruInstance } from '../core';

/** Create a new maru-i18n instance */
export function createMaruI18n<T extends Translations = Translations>(): MaruInstance<T> {
  return new MaruI18n<T>();
}

export type { MaruOptions, MaruInstance };
