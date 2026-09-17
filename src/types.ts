export type LineKind = "equal" | "add" | "remove" | "change";
export type WordKind = "equal" | "add" | "remove";
export type DiffView = "unified" | "split";

export interface WordPart {
  kind: WordKind;
  text: string;
}

export interface DiffRow {
  kind: LineKind;
  beforeNo: number | null;
  afterNo: number | null;
  beforeText: string;
  afterText: string;
  beforeWords?: WordPart[];
  afterWords?: WordPart[];
}

export type DisplayItem =
  | { type: "row"; row: DiffRow }
  | { type: "gap"; count: number };

export interface DiffSummary {
  added: number;
  removed: number;
  unchanged: number;
  changed: number;
  beforeLines: number;
  afterLines: number;
  beforeChars: number;
  afterChars: number;
  beforeTokens: number;
  afterTokens: number;
  tokenDelta: number;
}

export interface PromptDiff {
  rows: DiffRow[];
  display: DisplayItem[];
  summary: DiffSummary;
  identical: boolean;
  empty: boolean;
  id: string;
}

export interface SamplePair {
  id: string;
  label: string;
  blurb: string;
  title: string;
  before: string;
  after: string;
}
