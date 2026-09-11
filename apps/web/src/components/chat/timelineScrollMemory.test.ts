import { describe, expect, it } from "vite-plus/test";

import {
  forgetTimelineScroll,
  recallTimelineScroll,
  rememberTimelineScroll,
  resolveTimelineScrollRestore,
} from "./timelineScrollMemory";

const rows = [{ id: "first" }, { id: "second" }, { id: "third" }];

describe("timelineScrollMemory", () => {
  it("reopens at the remembered row and offset", () => {
    expect(
      resolveTimelineScrollRestore(rows, { rowId: "second", offset: 120, lastRowId: "third" }),
    ).toEqual({ initialScrollIndex: { index: 1, viewOffset: -120 }, hasNewContent: false });
  });

  it("flags new content when rows landed after the user left", () => {
    expect(
      resolveTimelineScrollRestore([...rows, { id: "fourth" }], {
        rowId: "second",
        offset: 0,
        lastRowId: "third",
      }),
    ).toEqual({ initialScrollIndex: { index: 1, viewOffset: -0 }, hasNewContent: true });
  });

  it("opens at the end when nothing is remembered or the row is gone", () => {
    expect(resolveTimelineScrollRestore(rows, undefined)).toBeUndefined();
    expect(
      resolveTimelineScrollRestore(rows, { rowId: "removed", offset: 0, lastRowId: "third" }),
    ).toBeUndefined();
  });

  it("remembers per thread until the thread is left at the end", () => {
    const memory = { rowId: "first", offset: 8, lastRowId: "third" };
    rememberTimelineScroll("env:thread-a", memory);
    expect(recallTimelineScroll("env:thread-a")).toEqual(memory);
    expect(recallTimelineScroll("env:thread-b")).toBeUndefined();
    forgetTimelineScroll("env:thread-a");
    expect(recallTimelineScroll("env:thread-a")).toBeUndefined();
  });
});
