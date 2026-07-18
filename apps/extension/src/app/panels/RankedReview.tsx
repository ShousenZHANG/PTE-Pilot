import { useState } from "react";
import type { RankedReviewEntry } from "../practice-controller";

type ReviewFilter = "all" | "wrong" | "new" | "due";

const REVIEW_FILTERS: Array<{ id: ReviewFilter; label: string }> = [
  { id: "all", label: "全部" },
  { id: "wrong", label: "只看错题" },
  { id: "due", label: "到期" },
  { id: "new", label: "未做" },
];

function matchesReviewFilter(
  entry: RankedReviewEntry,
  filter: ReviewFilter,
): boolean {
  if (filter === "wrong") return entry.wrong;
  if (filter === "due") return entry.due;
  if (filter === "new") return !entry.attempted;
  return true;
}

export function RankedReview({
  entries,
  current,
  queueActive,
  onChoose,
  onStartWrong,
  onExitQueue,
}: {
  entries: RankedReviewEntry[];
  current: string | undefined;
  queueActive: boolean;
  onChoose: (questionId: string) => void;
  onStartWrong: (questionIds: string[]) => void;
  onExitQueue: () => void;
}): React.JSX.Element {
  const [filter, setFilter] = useState<ReviewFilter>(() =>
    entries.some((entry) => entry.wrong) ? "wrong" : "all",
  );
  const attempted = entries.filter((entry) => entry.attempted).length;
  const wrongEntries = entries.filter((entry) => entry.wrong);
  const wrong = wrongEntries.length;
  const due = entries.filter((entry) => entry.due).length;
  const visible = entries.filter((entry) => matchesReviewFilter(entry, filter));
  return (
    <section data-testid="ranked-review">
      <h2>错题集</h2>
      <p className="review-stats" data-testid="review-stats">
        已练 {attempted}/{entries.length} · 错题 {wrong} · 到期 {due}
      </p>
      <div className="drill-actions">
        <button
          type="button"
          className="drill-start"
          data-testid="wrong-drive-start"
          disabled={wrong === 0}
          onClick={() =>
            onStartWrong(wrongEntries.map((entry) => entry.questionId))
          }
        >
          只刷错题（{wrong}）
        </button>
        {queueActive && (
          <button type="button" onClick={onExitQueue}>
            退出错题循环
          </button>
        )}
      </div>
      <fieldset className="review-filters" aria-label="复习筛选">
        {REVIEW_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`chip${filter === id ? " chip--on" : ""}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
            {id === "wrong" ? `（${wrong}）` : ""}
          </button>
        ))}
      </fieldset>
      {visible.length === 0 ? (
        <p className="review-empty">
          {filter === "wrong" ? "没有错题——继续保持。" : "该筛选下暂无题目。"}
        </p>
      ) : (
        <ol className="rank-list">
          {visible.slice(0, 50).map((entry, index) => (
            <li key={entry.questionId}>
              <button
                type="button"
                disabled={entry.questionId === current}
                onClick={() => onChoose(entry.questionId)}
              >
                <span>#{index + 1}</span>
                {entry.questionId}
                {entry.wrong ? <em className="tag tag--wrong">错题</em> : null}
                {!entry.attempted ? <em className="tag">未做</em> : null}
                {entry.due && !entry.wrong ? (
                  <em className="tag tag--due">到期</em>
                ) : null}
                {entry.marked ? <em className="tag tag--marked">★</em> : null}
                {entry.questionId === current ? " · 当前" : ""}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
