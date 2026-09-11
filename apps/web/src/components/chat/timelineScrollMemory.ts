/**
 * Where the user left a thread's timeline, so switching threads and coming
 * back reopens at the same row instead of the live edge. Session-scoped by
 * design: a reload starts every thread at the end again.
 */
export interface TimelineScrollMemory {
  /** Row under the top edge of the viewport when the user left. */
  readonly rowId: string;
  /** Pixels scrolled past the top of that row. */
  readonly offset: number;
  /** Last row that existed when the user left; a different one means new content. */
  readonly lastRowId: string;
}

export interface TimelineScrollRestore {
  readonly initialScrollIndex: { readonly index: number; readonly viewOffset: number };
  readonly hasNewContent: boolean;
}

const timelineScrollMemoryByThreadKey = new Map<string, TimelineScrollMemory>();

export function rememberTimelineScroll(threadKey: string, memory: TimelineScrollMemory): void {
  timelineScrollMemoryByThreadKey.set(threadKey, memory);
}

/** A thread left at the live edge reopens at the live edge, as it always has. */
export function forgetTimelineScroll(threadKey: string): void {
  timelineScrollMemoryByThreadKey.delete(threadKey);
}

export function recallTimelineScroll(threadKey: string): TimelineScrollMemory | undefined {
  return timelineScrollMemoryByThreadKey.get(threadKey);
}

/** Restore only when the remembered row is still in the list; otherwise open at the end. */
export function resolveTimelineScrollRestore(
  rows: ReadonlyArray<{ readonly id: string }>,
  memory: TimelineScrollMemory | undefined,
): TimelineScrollRestore | undefined {
  if (!memory) return undefined;
  const index = rows.findIndex((row) => row.id === memory.rowId);
  if (index < 0) return undefined;
  return {
    initialScrollIndex: { index, viewOffset: -memory.offset },
    hasNewContent: rows[rows.length - 1]?.id !== memory.lastRowId,
  };
}
