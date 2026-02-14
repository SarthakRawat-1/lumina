
export const DEFAULT_SETTINGS = {
  emptyEditor: true,
  hasLinkAttributes: true,
  isCodeHighlighted: true,
  isCodeShiki: true,
  isRichText: true,
  listStrictIndent: false,
  measureTypingPerf: false,
  selectionAlwaysOnDisplay: true,
  shouldUseLexicalContextMenu: true,
  showTableOfContents: false,
  tableCellBackgroundColor: true,
  tableCellMerge: true,
  tableHorizontalScroll: true,
} as const;

// These are mutated in setupEnv
export const INITIAL_SETTINGS: Record<SettingName, boolean> = {
  ...DEFAULT_SETTINGS,
};

export type SettingName = keyof typeof DEFAULT_SETTINGS;

export type Settings = typeof INITIAL_SETTINGS;
