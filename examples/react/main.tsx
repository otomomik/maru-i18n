import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { MaruProvider, useMaruI18n } from "../../src/adapters/react";
import { createMaruI18n } from "../../src/index";
import type { Translations, MaruInstance } from "../../src/core";

const translations: Translations = {
  "Hello, World!": {
    ja: "こんにちは、世界！",
    fr: "Bonjour, le monde !",
  },
  "This is a comprehensive demo of maru-i18n.": {
    ja: "これは maru-i18n の包括的なデモです。",
    fr: "Ceci est une démonstration complète de maru-i18n.",
  },
  "Language Switching": {
    ja: "言語切り替え",
    fr: "Changement de langue",
  },
  "onChange Listener": {
    ja: "onChange リスナー",
    fr: "Écouteur onChange",
  },
  "t() String Translation": {
    ja: "t() 文字列翻訳",
    fr: "Traduction de chaîne t()",
  },
  Ignore: {
    ja: "無視",
    fr: "Ignorer",
  },
  "data-maru-ignore attribute (on parent):": {
    ja: "data-maru-ignore 属性（親要素）:",
    fr: "Attribut data-maru-ignore (sur le parent) :",
  },
  "data-maru-ignore attribute (on element):": {
    ja: "data-maru-ignore 属性（要素自体）:",
    fr: "Attribut data-maru-ignore (sur l'élément) :",
  },
  "This text has data-maru-ignore and will NOT be translated.": {
    ja: "（翻訳されないはず）",
    fr: "(Ne devrait pas être traduit)",
  },
  "This text is ignored via ignore() and will NOT be translated.": {
    ja: "（翻訳されないはず）",
    fr: "(Ne devrait pas être traduit)",
  },
  "Exclude Option": {
    ja: "除外オプション",
    fr: "Option d'exclusion",
  },
  "This text is inside .exclude-me and will NOT be translated.": {
    ja: "（翻訳されないはず）",
    fr: "(Ne devrait pas être traduit)",
  },
  "Include Option (separate instance)": {
    ja: "インクルードオプション（別インスタンス）",
    fr: "Option d'inclusion (instance séparée)",
  },
  "Exclude with nested Include": {
    ja: "除外の中にインクルード",
    fr: "Exclusion avec inclusion imbriquée",
  },
  "This text is excluded and will NOT be translated.": {
    ja: "（翻訳されないはず）",
    fr: "(Ne devrait pas être traduit)",
  },
  "Dynamic DOM": {
    ja: "動的 DOM",
    fr: "DOM dynamique",
  },
  "Add dynamic content": {
    ja: "動的コンテンツを追加",
    fr: "Ajouter du contenu dynamique",
  },
  Clear: {
    ja: "クリア",
    fr: "Effacer",
  },
  "Dynamically added content!": {
    ja: "動的に追加されたコンテンツ！",
    fr: "Contenu ajouté dynamiquement !",
  },
  "Collected Texts": {
    ja: "収集されたテキスト",
    fr: "Textes collectés",
  },
  "Mixed Text Nodes": {
    ja: "混在テキストノード",
    fr: "Nœuds de texte mixtes",
  },
  is: {
    ja: "は",
    fr: "est",
  },
  "bold here": {
    ja: "ここが太字",
    fr: "gras ici",
  },
  "and continues.": {
    ja: "で、続きます。",
    fr: "et continue.",
  },
  "Powered by maru-i18n": {
    ja: "maru-i18n で動いています",
    fr: "Propulsé par maru-i18n",
  },
};

const includeTranslations: Translations = {
  "This text is inside the include area.": {
    ja: "このテキストはインクルード領域内です。",
    fr: "Ce texte est dans la zone d'inclusion.",
  },
};

const nestedIncludeTranslations: Translations = {
  "This text is inside nested include.": {
    ja: "このテキストはネストされたインクルード内です。",
    fr: "Ce texte est dans l'inclusion imbriquée.",
  },
};

// ===== Language Switching =====
function LanguageSwitcher() {
  const { setLang, lang, availableLangs } = useMaruI18n();
  return (
    <Section title="Language Switching">
      <div style={{ marginBottom: 8 }}>
        {availableLangs.map((l) => (
          <Btn key={l} active={l === lang} onClick={() => setLang(l)}>
            {l}
          </Btn>
        ))}
      </div>
      <Info>
        getLang(): "{lang}" | getAvailableLangs(): [{availableLangs.join(", ")}]
      </Info>
    </Section>
  );
}

// ===== onChange Listener =====
function OnChangeDemo() {
  const { lang } = useMaruI18n();
  const countRef = useRef(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    countRef.current += 1;
    setCount(countRef.current);
  }, [lang]);

  return (
    <Section title="onChange Listener">
      <Info>
        onChange fired #{count}: lang = "{lang}"
      </Info>
    </Section>
  );
}

// ===== t() String Translation =====
function TFunctionDemo() {
  const { t } = useMaruI18n();
  return (
    <Section title="t() String Translation">
      <Info>t("Hello, World!") → "{t("Hello, World!")}"</Info>
    </Section>
  );
}

// ===== Ignore =====
function IgnoreDemo() {
  return (
    <Section title="Ignore">
      <p>
        <strong>data-maru-ignore attribute (on parent):</strong>
      </p>
      <ExcludedBox data-maru-ignore>
        <p>This text has data-maru-ignore and will NOT be translated.</p>
      </ExcludedBox>

      <p style={{ marginTop: 12 }}>
        <strong>data-maru-ignore attribute (on element):</strong>
      </p>
      <ExcludedBox>
        <p data-maru-ignore>
          This text is ignored via ignore() and will NOT be translated.
        </p>
      </ExcludedBox>
    </Section>
  );
}

// ===== Exclude Option =====
function ExcludeDemo() {
  return (
    <Section title="Exclude Option">
      <ExcludedBox className="exclude-me">
        <p>This text is inside .exclude-me and will NOT be translated.</p>
      </ExcludedBox>
    </Section>
  );
}

// ===== Include Option (separate instance) =====
function IncludeDemo() {
  const { lang } = useMaruI18n();
  const instanceRef = useRef<MaruInstance | null>(null);

  useEffect(() => {
    const i18nInclude = createMaruI18n();
    i18nInclude.init({
      translations: includeTranslations,
      defaultLang: "en",
      include: ".include-only",
    });
    instanceRef.current = i18nInclude;

    return () => {
      i18nInclude.destroy();
    };
  }, []);

  useEffect(() => {
    if (instanceRef.current && lang) {
      instanceRef.current.setLang(lang);
    }
  }, [lang]);

  return (
    <Section title="Include Option (separate instance)">
      <div>
        <p>This text is outside the include area.</p>
        <div
          className="include-only"
          style={{ border: "2px solid #4a6cf7", padding: 12, borderRadius: 6 }}
        >
          <p>This text is inside the include area.</p>
          <p>This text is in include but has no translation.</p>
        </div>
      </div>
    </Section>
  );
}

// ===== Exclude with nested Include =====
function ExcludeIncludeDemo() {
  const { lang } = useMaruI18n();
  const instanceRef = useRef<MaruInstance | null>(null);

  useEffect(() => {
    const inst = createMaruI18n();
    inst.init({
      translations: nestedIncludeTranslations,
      defaultLang: "en",
      include: ".include-nested",
    });
    instanceRef.current = inst;
    return () => { inst.destroy(); };
  }, []);

  useEffect(() => {
    if (instanceRef.current && lang) instanceRef.current.setLang(lang);
  }, [lang]);

  return (
    <Section title="Exclude with nested Include">
      <div className="exclude-me" style={{ border: "2px dashed #ccc", padding: 12, borderRadius: 6 }}>
        <p>This text is excluded and will NOT be translated.</p>
        <div className="include-nested" style={{ border: "2px solid #4a6cf7", padding: 12, borderRadius: 6 }}>
          <p>This text is inside nested include.</p>
        </div>
      </div>
    </Section>
  );
}

// ===== Dynamic DOM =====
function DynamicDomDemo() {
  const [items, setItems] = useState<number[]>([]);

  return (
    <Section title="Dynamic DOM">
      <div style={{ marginBottom: 8 }}>
        <Btn onClick={() => setItems((prev) => [...prev, prev.length])}>
          Add dynamic content
        </Btn>
        <Btn onClick={() => setItems([])}>Clear</Btn>
      </div>
      <div
        style={{
          minHeight: 40,
          background: "#fafafa",
          padding: 12,
          borderRadius: 6,
        }}
      >
        {items.map((i) => (
          <p key={i}>Dynamically added content!</p>
        ))}
      </div>
    </Section>
  );
}

// ===== Collected Texts =====
function CollectedTextsDemo() {
  const { lang } = useMaruI18n();
  const [texts, setTexts] = useState<string[]>([]);

  const refresh = useCallback(() => {
    const els = document.querySelectorAll("[data-maru-i18n]");
    const collected = Array.from(
      new Set(Array.from(els).map((el) => el.getAttribute("data-maru-i18n")!)),
    );
    setTexts(collected);
  }, []);

  useEffect(() => {
    refresh();
  }, [lang, refresh]);

  return (
    <Section title="Collected Texts">
      <Info>
        {texts.length} texts: {JSON.stringify(texts, null, 2)}
      </Info>
    </Section>
  );
}

// ===== Mixed Text Nodes =====
function MixedTextDemo() {
  return (
    <Section title="Mixed Text Nodes">
      <p>
        <span>Hello, World!</span> is <strong>bold here</strong> and continues.
      </p>
    </Section>
  );
}

// ===== Shared UI =====
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          marginTop: 0,
          color: "#555",
          fontSize: 16,
          borderBottom: "1px solid #ddd",
          paddingBottom: 4,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-maru-ignore
      style={{
        background: "#f5f5f5",
        padding: 12,
        borderRadius: 6,
        fontSize: 13,
        fontFamily: "monospace",
      }}
    >
      {children}
    </div>
  );
}

function Btn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        marginRight: 6,
        marginBottom: 6,
        padding: "6px 14px",
        cursor: "pointer",
        fontWeight: active ? "bold" : "normal",
        background: active ? "#4a6cf7" : "#eee",
        color: active ? "#fff" : "#333",
        border: "none",
        borderRadius: 4,
      }}
    >
      {children}
    </button>
  );
}

const ExcludedBox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div
    ref={ref}
    style={{ border: "2px dashed #ccc", padding: 12, borderRadius: 6 }}
    {...props}
  >
    {children}
  </div>
));

// ===== App =====
function App() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 720,
        margin: "40px auto",
        padding: "0 20px",
      }}
    >
      <h1>Hello, World!</h1>
      <p>This is a comprehensive demo of maru-i18n.</p>

      <LanguageSwitcher />
      <OnChangeDemo />
      <TFunctionDemo />
      <IgnoreDemo />
      <ExcludeDemo />
      <IncludeDemo />
      <ExcludeIncludeDemo />
      <DynamicDomDemo />
      <CollectedTextsDemo />
      <MixedTextDemo />

      <footer style={{ marginTop: 40, color: "#888", fontSize: 13 }}>
        Powered by maru-i18n
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <MaruProvider
    translations={translations}
    defaultLang="en"
    exclude=".exclude-me"
    devtools={{ includeSelectors: ['.include-only', '.include-nested'] }}
  >
    <App />
  </MaruProvider>,
);
