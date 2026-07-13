import type { Mc16Row } from "@/types";
import { stripTime } from "@/lib/utils/dates";
import { cell } from "./helpers";

/** Ported 1:1 from the legacy parseMC16 (positional columns, priorityCode===16 signature at col 14). */
export function parseMC16(sheetData: unknown[][]): Mc16Row[] {
  const rows: Mc16Row[] = [];
  for (let i = 2; i < sheetData.length; i++) {
    const r = sheetData[i];
    if (!r || r.length < 16) continue;
    const code = parseInt(String(r[14]), 10);
    if (code !== 16) continue;
    const artNum = cell(r, 10);
    if (!artNum || artNum === "NaN") continue;
    rows.push({
      articleNumber: artNum,
      articleName: cell(r, 11),
      articleDescription: cell(r, 12),
      priorityCode: 16,
      outOfStockDate: stripTime(r[15]),
      comment: "",
      status: "Active",
    });
  }
  return rows;
}
