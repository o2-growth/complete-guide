import { describe, expect, it } from "vitest";
import { SLASH_COMMANDS, filterSlashCommands } from "../slash-commands-data";

describe("filterSlashCommands", () => {
  it("retorna a lista completa quando query é vazia", () => {
    expect(filterSlashCommands("")).toHaveLength(SLASH_COMMANDS.length);
    expect(filterSlashCommands("   ")).toHaveLength(SLASH_COMMANDS.length);
  });

  it("filtra por título em pt-BR", () => {
    const result = filterSlashCommands("título");
    expect(result.some((c) => c.id === "h2")).toBe(true);
  });

  it("filtra por keywords (case-insensitive)", () => {
    const result = filterSlashCommands("CHECKLIST");
    expect(result.map((c) => c.id)).toContain("checklist");
  });

  it("limita a 8 resultados quando há query", () => {
    const result = filterSlashCommands("a");
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it("retorna lista vazia quando nada bate", () => {
    expect(filterSlashCommands("xyz-zzzzz-no-match")).toHaveLength(0);
  });

  it("encontra divisor por keyword 'hr'", () => {
    expect(filterSlashCommands("hr").map((c) => c.id)).toContain("divider");
  });

  it("inclui os 4 comandos novos do TickTick", () => {
    const ids = SLASH_COMMANDS.map((c) => c.id);
    expect(ids).toContain("attachment");
    expect(ids).toContain("subtask");
    expect(ids).toContain("tag");
    expect(ids).toContain("linked");
  });

  it("filtra anexo por palavra-chave 'arquivo'", () => {
    expect(filterSlashCommands("arquivo").map((c) => c.id)).toContain("attachment");
  });

  it("filtra tag por sinônimo 'etiqueta'", () => {
    expect(filterSlashCommands("etiqueta").map((c) => c.id)).toContain("tag");
  });
});
