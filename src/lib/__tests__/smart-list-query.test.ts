import { describe, it, expect, vi } from "vitest";
import {
  applySmartListFilters,
  collectTagIds,
  isRuleGroup,
  ruleToPostgrestFragment,
  type RuleGroup,
  type QueryLike,
} from "../smart-list-query";

function makeQueryStub() {
  const calls: Array<[string, ...unknown[]]> = [];
  const stub: QueryLike = {
    in: (col, vals) => (calls.push(["in", col, vals]), stub),
    eq: (col, val) => (calls.push(["eq", col, val]), stub),
    ilike: (col, val) => (calls.push(["ilike", col, val]), stub),
    gte: (col, val) => (calls.push(["gte", col, val]), stub),
    lte: (col, val) => (calls.push(["lte", col, val]), stub),
    lt: (col, val) => (calls.push(["lt", col, val]), stub),
    gt: (col, val) => (calls.push(["gt", col, val]), stub),
    is: (col, val) => (calls.push(["is", col, val]), stub),
    not: (col, op, val) => (calls.push(["not", col, op, val]), stub),
    or: (filters) => (calls.push(["or", filters]), stub),
  };
  return { stub, calls };
}

describe("smart-list-query", () => {
  describe("isRuleGroup", () => {
    it("identifica grupo vs regra simples", () => {
      expect(isRuleGroup({ combinator: "and", rules: [] })).toBe(true);
      expect(isRuleGroup({ field: "priority", operator: "in", value: ["high"] })).toBe(false);
    });
  });

  describe("applySmartListFilters (AND no topo)", () => {
    it("aplica priority IN, keyword ILIKE e done IS NOT NULL em sequência", () => {
      const { stub, calls } = makeQueryStub();
      const group: RuleGroup = {
        combinator: "and",
        rules: [
          { field: "priority", operator: "in", value: ["urgent", "high"] },
          { field: "keyword", operator: "contains", value: "sprint" },
          { field: "done", operator: "is", value: true },
        ],
      };
      applySmartListFilters(stub, group);
      expect(calls).toEqual([
        ["in", "priority", ["urgent", "high"]],
        ["ilike", "title", "%sprint%"],
        ["not", "done_at", "is", null],
      ]);
    });

    it("aplica due_at between via gte+lte", () => {
      const { stub, calls } = makeQueryStub();
      const group: RuleGroup = {
        combinator: "and",
        rules: [
          { field: "due_at", operator: "between", value: ["2026-05-01", "2026-05-31"] },
        ],
      };
      applySmartListFilters(stub, group);
      expect(calls).toEqual([
        ["gte", "due_at", "2026-05-01"],
        ["lte", "due_at", "2026-05-31"],
      ]);
    });

    it("usa pré-fetch de task ids para regra de tag", () => {
      const { stub, calls } = makeQueryStub();
      const group: RuleGroup = {
        combinator: "and",
        rules: [{ field: "tag", operator: "in", value: ["tag-1", "tag-2"] }],
      };
      applySmartListFilters(stub, group, ["task-a", "task-b"]);
      expect(calls).toEqual([["in", "id", ["task-a", "task-b"]]]);
    });
  });

  describe("applySmartListFilters (OR aninhado)", () => {
    it("converte grupo OR em string PostgREST passada para .or()", () => {
      const { stub, calls } = makeQueryStub();
      const group: RuleGroup = {
        combinator: "and",
        rules: [
          { field: "priority", operator: "in", value: ["urgent"] },
          {
            combinator: "or",
            rules: [
              { field: "keyword", operator: "contains", value: "urgente" },
              { field: "assignee", operator: "in", value: ["user-1"] },
            ],
          },
        ],
      };
      applySmartListFilters(stub, group);
      expect(calls[0]).toEqual(["in", "priority", ["urgent"]]);
      expect(calls[1][0]).toBe("or");
      expect(calls[1][1]).toContain("title.ilike.*urgente*");
      expect(calls[1][1]).toContain("assignee_id.in.(user-1)");
    });
  });

  describe("ruleToPostgrestFragment", () => {
    it("formata priority IN", () => {
      expect(
        ruleToPostgrestFragment({ field: "priority", operator: "in", value: ["high", "urgent"] }),
      ).toBe("priority.in.(high,urgent)");
    });
    it("formata done boolean", () => {
      expect(ruleToPostgrestFragment({ field: "done", operator: "is", value: false })).toBe(
        "done_at.is.null",
      );
    });
  });

  describe("collectTagIds", () => {
    it("acumula tag ids de regras aninhadas", () => {
      const group: RuleGroup = {
        combinator: "and",
        rules: [
          { field: "tag", operator: "in", value: ["t1", "t2"] },
          {
            combinator: "or",
            rules: [
              { field: "tag", operator: "in", value: "t3" },
              { field: "priority", operator: "in", value: ["urgent"] },
            ],
          },
        ],
      };
      expect(collectTagIds(group).sort()).toEqual(["t1", "t2", "t3"]);
    });
  });
});

// Garante que vi não fica como import não usado em build minimalista.
void vi;
