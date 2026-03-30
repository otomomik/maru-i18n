import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { MaruI18n } from '../core';
import type { Translations, TranslationKey } from '../core';
import { mountDevtools } from '../devtools/index';
import type { DevtoolsOptions } from '../devtools/index';

interface MaruContextValue<T extends Translations = Translations> {
  t: (text: TranslationKey<T>) => string;
  setLang: (lang: string) => void;
  lang: string;
  availableLangs: string[];
}

const MaruContext = createContext<MaruContextValue<Translations> | null>(null);

export interface MaruProviderProps<T extends Translations = Translations> {
  translations: T;
  defaultLang?: string;
  lang?: string;
  children: ReactNode;
  include?: string;
  exclude?: string;
  /** Show devtools panel. Pass `true` or a DevtoolsOptions object. */
  devtools?: boolean | DevtoolsOptions;
}

export function MaruProvider<T extends Translations>({
  translations,
  defaultLang,
  lang: langProp,
  children,
  include,
  exclude,
  devtools: devtoolsProp,
}: MaruProviderProps<T>) {
  const instanceRef = useRef<MaruI18n<T> | null>(null);
  const [lang, setLangState] = useState(langProp ?? defaultLang ?? '');
  const [ready, setReady] = useState(false);

  // Create instance once
  if (!instanceRef.current) {
    instanceRef.current = new MaruI18n<T>();
  }
  const instance = instanceRef.current;

  // Init after mount (DOM is available)
  useEffect(() => {
    instance.init({ translations, defaultLang, include, exclude });
    instance.observe();
    setReady(true);

    let destroyDevtools: (() => void) | undefined;
    if (devtoolsProp) {
      const opts = typeof devtoolsProp === 'object' ? devtoolsProp : undefined;
      destroyDevtools = mountDevtools(instance, opts);
    }

    const unsub = instance.onChange((newLang) => {
      setLangState(newLang);
    });

    return () => {
      unsub();
      destroyDevtools?.();
      instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync lang prop → instance
  useEffect(() => {
    if (langProp) {
      instance.setLang(langProp);
      setLangState(langProp);
    }
  }, [langProp, instance]);

  const setLang = useCallback(
    (newLang: string) => {
      instance.setLang(newLang);
      setLangState(newLang);
    },
    [instance],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback(
    (text: TranslationKey<T>) => instance.t(text),
    [instance, lang],
  );

  const value: MaruContextValue<T> = {
    t,
    setLang,
    lang,
    availableLangs: ready ? instance.getAvailableLangs() : [],
  };

  return (
    <MaruContext.Provider value={value as MaruContextValue<Translations>}>
      {children}
    </MaruContext.Provider>
  );
}

export function useMaruI18n<T extends Translations = Translations>() {
  const ctx = useContext(MaruContext);
  if (!ctx) {
    throw new Error('useMaruI18n must be used inside <MaruProvider>');
  }
  return ctx as MaruContextValue<T>;
}

/** @deprecated Use useMaruI18n instead */
export const useMaruTranslation = useMaruI18n;

export { MaruContext };
