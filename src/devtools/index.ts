import type { MaruInstance } from '../core';

export interface DevtoolsOptions {
  /** Panel position. Default: "bottom-right" */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Additional CSS selectors to recognize as include areas (from other instances) */
  includeSelectors?: string[];
  /** Additional CSS selectors to recognize as exclude areas (from other instances) */
  excludeSelectors?: string[];
}

const PANEL_STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    color: #e0e0e0;
  }
  .maru-devtools {
    position: fixed;
    width: 360px;
    max-height: 520px;
    background: #1e1e2e;
    border: 1px solid #444;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .maru-devtools.collapsed {
    width: auto;
    max-height: none;
  }
  .maru-devtools.collapsed .panel-body {
    display: none;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #2a2a3e;
    cursor: pointer;
    user-select: none;
  }
  .panel-header h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  .panel-body {
    padding: 12px;
    overflow-y: auto;
    flex: 1;
  }
  label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: #aaa;
  }
  input, select {
    width: 100%;
    padding: 6px 8px;
    margin-bottom: 10px;
    background: #2a2a3e;
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    box-sizing: border-box;
  }
  button {
    padding: 6px 12px;
    background: #4a6cf7;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    margin-right: 6px;
    margin-bottom: 6px;
  }
  button:hover { background: #3b5de7; }
  .text-list {
    max-height: 200px;
    overflow-y: auto;
    background: #16161e;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 10px;
    font-size: 12px;
    line-height: 1.6;
  }
  .text-list div {
    padding: 2px 0;
    border-bottom: 1px solid #2a2a3e;
    word-break: break-word;
  }
  .text-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .text-item input[type="checkbox"] {
    margin: 3px 0 0 0;
    width: auto;
    flex-shrink: 0;
  }
  .text-item span {
    flex: 1;
    min-width: 0;
  }
  .text-badge {
    display: inline-block;
    font-size: 9px;
    padding: 0 4px;
    border-radius: 3px;
    margin-right: 4px;
    vertical-align: middle;
    line-height: 1.4;
  }
  .badge-dom { background: #4ade80; color: #000; }
  .badge-t { background: #4a6cf7; color: #fff; }
  .badge-exclude { background: #f87171; color: #fff; }
  .badge-include { background: #fb923c; color: #fff; }
  .badge-ignore { background: #a78bfa; color: #fff; }
  .text-empty {
    color: #666;
    font-style: italic;
  }
  .text-item span.text-label {
    cursor: pointer;
  }
  .text-item span.text-label:hover {
    text-decoration: underline;
    color: #fff;
  }
  .select-actions {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .select-actions button {
    padding: 2px 8px;
    font-size: 11px;
    background: #2a2a3e;
    border: 1px solid #555;
    color: #ccc;
    margin: 0;
  }
  .select-actions button:hover { background: #3a3a5e; }
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }
  .filter-btn {
    padding: 2px 8px;
    font-size: 11px;
    border: 1px solid #555;
    margin: 0;
    cursor: pointer;
    opacity: 0.4;
  }
  .filter-btn.active { opacity: 1; }
  .json-output {
    background: #16161e;
    border-radius: 4px;
    padding: 8px;
    font-size: 11px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 160px;
    overflow-y: auto;
    margin-bottom: 10px;
  }
  .toggle-btn {
    background: none;
    border: none;
    color: #aaa;
    font-size: 16px;
    padding: 0 4px;
    margin: 0;
  }
  .copied {
    color: #4ade80;
    font-size: 12px;
    margin-left: 8px;
  }
  .info-value {
    padding: 6px 8px;
    margin-bottom: 10px;
    background: #2a2a3e;
    border-radius: 4px;
    font-size: 13px;
    color: #fff;
  }
  .lang-row {
    display: flex;
    gap: 6px;
    margin-bottom: 6px;
  }
  .lang-row input {
    flex: 1;
    margin-bottom: 0;
  }
  .lang-row button {
    flex-shrink: 0;
    margin: 0;
  }
  .lang-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
  }
  .lang-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    font-size: 12px;
    background: #2a2a3e;
    border: 1px solid #555;
    border-radius: 4px;
    color: #ccc;
  }
  .lang-tag .remove-lang {
    background: none;
    border: none;
    color: #888;
    font-size: 14px;
    padding: 0 2px;
    margin: 0;
    cursor: pointer;
    line-height: 1;
  }
  .lang-tag .remove-lang:hover { color: #f87171; }

  /* Change language buttons */
  .change-lang-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
  }
  .change-lang-btn {
    padding: 4px 10px;
    font-size: 12px;
    background: #2a2a3e;
    border: 1px solid #555;
    margin: 0;
  }
  .change-lang-btn:hover { background: #3a3a5e; }
  .change-lang-btn.active {
    background: #4a6cf7;
    border-color: #4a6cf7;
    color: #fff;
  }

  /* Position selector */
  .position-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-bottom: 10px;
  }
  .position-grid button {
    padding: 4px 0;
    font-size: 11px;
    background: #2a2a3e;
    border: 1px solid #555;
    margin: 0;
    color: #ccc;
  }
  .position-grid button:hover { background: #3a3a5e; }
  .position-grid button.active {
    background: #4a6cf7;
    border-color: #4a6cf7;
    color: #fff;
  }

  /* Drag handle */
  .drag-handle {
    cursor: grab;
    padding: 0 6px;
    color: #666;
    font-size: 14px;
    line-height: 1;
  }
  .drag-handle:active { cursor: grabbing; }

  /* Accordion */
  .accordion {
    border: 1px solid #333;
    border-radius: 4px;
    margin-bottom: 10px;
    overflow: hidden;
  }
  .accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: #252538;
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    font-weight: 600;
    color: #ccc;
  }
  .accordion-header:hover { background: #2e2e45; }
  .accordion-arrow {
    font-size: 10px;
    color: #888;
    transition: transform 0.15s;
  }
  .accordion-arrow.open {
    transform: rotate(90deg);
  }
  .accordion-body {
    padding: 10px;
  }
  .accordion-body.hidden {
    display: none;
  }
`;

const POSITION_MAP: Record<string, string> = {
  'bottom-right': 'bottom: 16px; right: 16px;',
  'bottom-left': 'bottom: 16px; left: 16px;',
  'top-right': 'top: 16px; right: 16px;',
  'top-left': 'top: 16px; left: 16px;',
};

export function mountDevtools(
  instance: MaruInstance,
  options?: DevtoolsOptions,
): () => void {
  // No-op in production
  if (typeof window === 'undefined') return () => {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (g.process?.env?.NODE_ENV === 'production') {
      return () => {};
    }
  } catch {
    // process not defined — that's fine
  }

  // Inject global style for highlight flash
  const globalStyle = document.createElement('style');
  globalStyle.textContent = `.maru-highlight-flash { outline: 3px solid #4a6cf7 !important; outline-offset: 2px; transition: outline-color 0.3s; }`;
  document.head.appendChild(globalStyle);

  const host = document.createElement('div');
  host.setAttribute('data-maru-ignore', '');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = PANEL_STYLES;
  shadow.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'maru-devtools';
  shadow.appendChild(panel);

  let collapsed = false;
  let jsonVisible = false;
  let settingsOpen = false;
  let textsOpen = true;
  // Filter: which statuses to show. Default: DOM + INC
  const visibleStatuses = new Set<string>(['dom', 'include-nodef']);
  let filterInitialized = false;
  // Track texts explicitly checked by user (so new texts don't auto-check)
  const userChecked = new Set<string>();
  let currentPosition: string = options?.position ?? 'bottom-right';
  let customPos: { x: number; y: number } | null = null;

  function applyPosition() {
    if (customPos) {
      panel.setAttribute('style', `left: ${customPos.x}px; top: ${customPos.y}px;`);
    } else {
      panel.setAttribute('style', POSITION_MAP[currentPosition] ?? POSITION_MAP['bottom-right']);
    }
  }
  applyPosition();

  // Drag support
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;

  function onDragStart(e: MouseEvent) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    e.preventDefault();
  }
  function onDragMove(e: MouseEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    customPos = { x: panelStartX + dx, y: panelStartY + dy };
    currentPosition = '';
    applyPosition();
  }
  function onDragEnd() {
    isDragging = false;
  }
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  // Initialize target languages from existing translations
  const targetLangs = new Set<string>(instance.getAvailableLangs());
  // Texts excluded from JSON generation (unchecked)
  const excludedTexts = new Set<string>();

  function render() {
    const collectedTexts = instance.getCollectedTexts();
    const allDomEntries = instance.getAllTexts();

    type Status = 'dom' | 'include-nodef' | 'exclude-nodef' | 'ignore' | 't-only';
    type TextEntry = { text: string; status: Status; element: HTMLElement | null };
    const allTexts: TextEntry[] = [];
    const seen = new Set<string>();

    const extraInc = options?.includeSelectors ?? [];
    const extraExc = options?.excludeSelectors ?? [];

    for (const { text, element, context } of allDomEntries) {
      seen.add(text);
      const hasAttr = element?.hasAttribute('data-maru-i18n') ?? false;
      let status: Status;
      if (hasAttr) {
        status = 'dom';
      } else if (context === 'ignore') {
        status = 'ignore';
      } else if (context === 'exclude' || (element && extraExc.some((s) => element.closest(s)))) {
        status = 'exclude-nodef';
      } else {
        // Everything else is a translation target (include or normal)
        status = 'include-nodef';
      }
      allTexts.push({ text, status, element });
    }
    // t()-only texts
    for (const t of collectedTexts) {
      if (!seen.has(t)) {
        seen.add(t);
        allTexts.push({ text: t, status: 't-only', element: null });
      }
    }
    const currentLang = instance.getLang();
    const defaultLang = instance.getDefaultLang();
    const translations = instance.getTranslations();
    const langs = instance.getAvailableLangs();

    // Save scroll positions before re-render
    const textListEl = shadow.querySelector('.text-list');
    const textListScroll = textListEl ? textListEl.scrollTop : 0;
    const panelBodyEl = shadow.querySelector('.panel-body');
    const panelBodyScroll = panelBodyEl ? panelBodyEl.scrollTop : 0;

    panel.innerHTML = `
      <div class="panel-header">
        <span class="drag-handle" id="maru-drag">\u2630</span>
        <h3 style="flex:1">maru-i18n devtools</h3>
        <span class="toggle-btn">${collapsed ? '+' : '\u2212'}</span>
      </div>
      <div class="panel-body">

        <!-- Change Language -->
        <label>Change Language</label>
        <div class="change-lang-buttons">
          ${langs.map((l) => `<button class="change-lang-btn${l === currentLang ? ' active' : ''}" data-lang="${escapeHtml(l)}">${escapeHtml(l)}</button>`).join('')}
        </div>

        <!-- Settings accordion -->
        <div class="accordion">
          <div class="accordion-header" data-accordion="settings">
            <span>Settings</span>
            <span class="accordion-arrow${settingsOpen ? ' open' : ''}">\u25B6</span>
          </div>
          <div class="accordion-body${settingsOpen ? '' : ' hidden'}" id="acc-settings">
            <label>Current Language</label>
            <div class="info-value">${escapeHtml(currentLang || '(none)')}${currentLang && currentLang === defaultLang ? ' (default)' : ''}</div>

            <label>Default Language</label>
            <div class="info-value">${escapeHtml(defaultLang || '(not set)')}</div>

            <label>Panel Position</label>
            <div class="position-grid">
              ${(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((p) =>
                `<button class="pos-btn${p === currentPosition ? ' active' : ''}" data-pos="${p}">${p}</button>`
              ).join('')}
            </div>

            <label>Target Languages</label>
            <div class="lang-row">
              <input type="text" id="maru-lang-input" placeholder="e.g. ja, zh, ko..." />
              <button id="maru-add-lang">Add</button>
            </div>
            <div class="lang-tags">
              ${Array.from(targetLangs).map((l) => `<span class="lang-tag">${escapeHtml(l)}<button class="remove-lang" data-lang="${escapeHtml(l)}">\u00D7</button></span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Texts accordion -->
        <div class="accordion">
          <div class="accordion-header" data-accordion="texts">
            <span>Texts (${allTexts.length})</span>
            <span class="accordion-arrow${textsOpen ? ' open' : ''}">\u25B6</span>
          </div>
          <div class="accordion-body${textsOpen ? '' : ' hidden'}" id="acc-texts">
            ${(() => {
                // Default: only DOM texts are checked. New texts default to unchecked.
                for (const { text, status } of allTexts) {
                  if (!filterInitialized && status !== 'dom') excludedTexts.add(text);
                  // New texts added after init also default to unchecked unless DOM
                  if (filterInitialized && !excludedTexts.has(text) && status !== 'dom' && !userChecked.has(text)) {
                    excludedTexts.add(text);
                  }
                }
                filterInitialized = true;

                const badgeLabels: Record<Status, [string, string]> = {
                  'dom': ['badge-dom', 'DOM'],
                  'include-nodef': ['badge-include', 'INC'],
                  'exclude-nodef': ['badge-exclude', 'EXC'],
                  'ignore': ['badge-ignore', 'IGN'],
                  't-only': ['badge-t', 't()'],
                };

                // Filter bar with selected/total counts per status
                const filterBarHtml = (['dom', 'include-nodef', 'exclude-nodef', 'ignore', 't-only'] as const).map((s) => {
                  const items = allTexts.filter((t) => t.status === s);
                  const total = items.length;
                  if (total === 0) return '';
                  const selected = items.filter((t) => !excludedTexts.has(t.text)).length;
                  const [cls, lbl] = badgeLabels[s];
                  return `<button class="filter-btn ${cls}${visibleStatuses.has(s) ? ' active' : ''}" data-filter="${s}">${lbl} ${selected}/${total}</button>`;
                }).join('');

                // Build text→index map for O(1) lookup
                const textIdxMap = new Map<string, number>();
                allTexts.forEach((t, i) => { if (!textIdxMap.has(t.text)) textIdxMap.set(t.text, i); });

                const filtered = allTexts.filter((t) => visibleStatuses.has(t.status));

                const listHtml = filtered.map(({ text, status, element }) => {
                  const origIdx = textIdxMap.get(text) ?? 0;
                  const checked = !excludedTexts.has(text);
                  const [badgeClass, badgeLabel] = badgeLabels[status];
                  const clickable = element ? ' text-label' : '';
                  return `<div class="text-item">
                    <input type="checkbox" data-text-idx="${origIdx}" ${checked ? 'checked' : ''} />
                    <span class="${clickable}" data-text-idx="${origIdx}"><span class="text-badge ${badgeClass}">${badgeLabel}</span>${escapeHtml(text)}</span>
                  </div>`;
                }).join('');

                return `
                  <label>Filter</label>
                  <div class="filter-bar">${filterBarHtml}</div>
                  <div class="select-actions">
                    <button id="maru-select-all">Select All</button>
                    <button id="maru-deselect-all">Deselect All</button>
                  </div>
                  <div class="text-list">${listHtml}</div>
                `;
              })()}

            <button id="maru-gen-json">Generate JSON template</button>
            <button id="maru-copy-json" style="display:${jsonVisible ? 'inline-block' : 'none'}">Copy</button>
            <span class="copied" id="maru-copied" style="display:none">Copied!</span>

            <div class="json-output" id="maru-json" style="display:${jsonVisible ? 'block' : 'none'}"></div>
          </div>
        </div>

      </div>
    `;

    // Restore scroll positions after re-render
    const newTextList = shadow.querySelector('.text-list');
    if (newTextList) newTextList.scrollTop = textListScroll;
    const newPanelBody = shadow.querySelector('.panel-body');
    if (newPanelBody) newPanelBody.scrollTop = panelBodyScroll;

    // Event: filter buttons
    for (const btn of shadow.querySelectorAll('.filter-btn')) {
      btn.addEventListener('click', () => {
        const filter = (btn as HTMLElement).dataset.filter!;
        if (visibleStatuses.has(filter)) {
          visibleStatuses.delete(filter);
        } else {
          visibleStatuses.add(filter);
        }
        render();
      });
    }

    // Event: drag handle
    shadow.querySelector('#maru-drag')!.addEventListener('mousedown', (e) => {
      onDragStart(e as MouseEvent);
    });

    // Event: toggle collapse (click on header but not drag handle)
    shadow.querySelector('.panel-header')!.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'maru-drag') return;
      collapsed = !collapsed;
      panel.classList.toggle('collapsed', collapsed);
      render();
    });

    // Event: change language buttons
    for (const btn of shadow.querySelectorAll('.change-lang-btn')) {
      btn.addEventListener('click', () => {
        const lang = (btn as HTMLElement).dataset.lang!;
        instance.setLang(lang);
      });
    }

    // Event: accordion toggles
    shadow.querySelector('[data-accordion="settings"]')!.addEventListener('click', () => {
      settingsOpen = !settingsOpen;
      render();
    });
    shadow.querySelector('[data-accordion="texts"]')!.addEventListener('click', () => {
      textsOpen = !textsOpen;
      render();
    });

    // Event: position buttons
    for (const btn of shadow.querySelectorAll('.pos-btn')) {
      btn.addEventListener('click', () => {
        currentPosition = (btn as HTMLElement).dataset.pos!;
        customPos = null;
        applyPosition();
        render();
      });
    }

    // Event: add language
    const addLang = () => {
      const input = shadow.querySelector('#maru-lang-input') as HTMLInputElement;
      const val = input.value.trim();
      if (val) {
        for (const l of val.split(/[,\s]+/)) {
          const lang = l.trim();
          if (lang) targetLangs.add(lang);
        }
        render();
      }
    };
    shadow.querySelector('#maru-add-lang')!.addEventListener('click', addLang);
    shadow.querySelector('#maru-lang-input')!.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') addLang();
    });

    // Event: remove language
    for (const btn of shadow.querySelectorAll('.remove-lang')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = (btn as HTMLElement).dataset.lang!;
        targetLangs.delete(lang);
        render();
      });
    }

    // Event: text checkboxes
    for (const cb of shadow.querySelectorAll('.text-item input[type="checkbox"]')) {
      cb.addEventListener('change', () => {
        const idx = parseInt((cb as HTMLInputElement).dataset.textIdx!, 10);
        const text = allTexts[idx]?.text;
        if (!text) return;
        if ((cb as HTMLInputElement).checked) {
          excludedTexts.delete(text);
          userChecked.add(text);
        } else {
          excludedTexts.add(text);
          userChecked.delete(text);
        }
        render();
      });
    }

    // Event: click text label → scroll to element
    for (const label of shadow.querySelectorAll('.text-label')) {
      label.addEventListener('click', () => {
        const idx = parseInt((label as HTMLElement).dataset.textIdx!, 10);
        const entry = allTexts[idx];
        if (!entry?.element) return;
        entry.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        entry.element.classList.add('maru-highlight-flash');
        setTimeout(() => entry.element?.classList.remove('maru-highlight-flash'), 1500);
      });
    }

    // Event: select all / deselect all (filtered only)
    shadow.querySelector('#maru-select-all')!.addEventListener('click', () => {
      for (const { text, status } of allTexts) {
        if (visibleStatuses.has(status)) {
          excludedTexts.delete(text);
          userChecked.add(text);
        }
      }
      render();
    });
    shadow.querySelector('#maru-deselect-all')!.addEventListener('click', () => {
      for (const { text, status } of allTexts) {
        if (visibleStatuses.has(status)) {
          excludedTexts.add(text);
          userChecked.delete(text);
        }
      }
      render();
    });
    // Event: generate JSON (only checked texts)
    shadow.querySelector('#maru-gen-json')!.addEventListener('click', () => {
      jsonVisible = true;
      const template: Record<string, Record<string, string>> = {};
      for (const { text } of allTexts) {
        if (excludedTexts.has(text)) continue;
        const existing = translations[text] ?? {};
        const entry: Record<string, string> = {};
        for (const l of targetLangs) {
          if (l === defaultLang) continue;
          const val = existing[l] ?? '';
          if (val === text) continue;
          entry[l] = val;
        }
        if (Object.keys(entry).length > 0) {
          template[text] = entry;
        }
      }
      const jsonEl = shadow.querySelector('#maru-json') as HTMLElement;
      jsonEl.textContent = JSON.stringify(template, null, 2);
      jsonEl.style.display = 'block';
      (shadow.querySelector('#maru-copy-json') as HTMLElement).style.display = 'inline-block';
    });

    // Event: copy JSON
    shadow.querySelector('#maru-copy-json')!.addEventListener('click', () => {
      const jsonEl = shadow.querySelector('#maru-json') as HTMLElement;
      navigator.clipboard.writeText(jsonEl.textContent ?? '').then(() => {
        const copiedEl = shadow.querySelector('#maru-copied') as HTMLElement;
        copiedEl.style.display = 'inline';
        setTimeout(() => {
          copiedEl.style.display = 'none';
        }, 1500);
      });
    });
  }

  render();

  // Re-render on language change
  const unsub = instance.onChange(() => render());

  // Re-render on DOM changes (new elements added/removed)
  let domDebounce: ReturnType<typeof setTimeout> | null = null;
  const domObserver = new MutationObserver(() => {
    if (domDebounce) clearTimeout(domDebounce);
    domDebounce = setTimeout(() => render(), 200);
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  return () => {
    unsub();
    domObserver.disconnect();
    if (domDebounce) clearTimeout(domDebounce);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    globalStyle.remove();
    host.remove();
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
