export { MaruI18n } from './core';
export { createMaruI18n } from './adapters/vanilla';
export type { Translations, TranslationKey, MaruOptions, MaruInstance } from './core';

import { createMaruI18n } from './adapters/vanilla';

/** Pre-created singleton instance for convenience */
export const maru = createMaruI18n();
