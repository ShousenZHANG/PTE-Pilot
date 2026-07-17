export interface DrillWord {
  key: string;
  expected: string;
}

export interface DrillWordResult {
  expected: string;
  errors: number;
  skipped: boolean;
}

export interface DrillState {
  words: DrillWord[];
  index: number;
  typed: string;
  wordErrors: number;
  totalErrors: number;
  results: DrillWordResult[];
  completed: boolean;
}

export interface DrillStep {
  state: DrillState;
  rejected: boolean;
  advanced: boolean;
}

export function startDrill(words: DrillWord[]): DrillState {
  return {
    words: words.filter((word) => word.expected.trim().length > 0),
    index: 0,
    typed: "",
    wordErrors: 0,
    totalErrors: 0,
    results: [],
    completed: words.length === 0,
  };
}

/*
 * Typing-tutor semantics: the raw input must stay a prefix of the target
 * word (case-insensitive). A wrong keystroke is rejected — the caller resets
 * the input to the last good prefix — and counted. Completing the word
 * advances automatically.
 */
export function drillType(state: DrillState, raw: string): DrillStep {
  if (state.completed) return { state, rejected: false, advanced: false };
  const expected = state.words[state.index]?.expected ?? "";
  const target = normalize(expected);
  const value = normalize(raw);
  if (value === target) {
    return { state: advance(state, false), rejected: false, advanced: true };
  }
  if (target.startsWith(value)) {
    return {
      state: { ...state, typed: raw },
      rejected: false,
      advanced: false,
    };
  }
  return {
    state: {
      ...state,
      wordErrors: state.wordErrors + 1,
      totalErrors: state.totalErrors + 1,
    },
    rejected: true,
    advanced: false,
  };
}

export function drillSkip(state: DrillState): DrillState {
  if (state.completed) return state;
  return advance(state, true);
}

function advance(state: DrillState, skipped: boolean): DrillState {
  const expected = state.words[state.index]?.expected ?? "";
  const results = [
    ...state.results,
    { expected, errors: state.wordErrors, skipped },
  ];
  const index = state.index + 1;
  return {
    ...state,
    index,
    typed: "",
    wordErrors: 0,
    results,
    completed: index >= state.words.length,
  };
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-AU");
}
