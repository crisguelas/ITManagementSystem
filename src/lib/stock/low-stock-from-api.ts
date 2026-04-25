/**
 * @file low-stock-from-api.ts
 * @description Derives low-stock rows from stock item list API data using the same rule as the inventory banner (`quantity <= minQuantity`).
 */

export interface LowStockNotificationRow {
  id: string;
  itemLabel: string;
  quantity: number;
  minQuantity: number;
}

/** True when current quantity should trigger a low-stock alert (inventory banner and header use the same rule). */
export const isAtOrBelowMinimumStock = (quantity: number, minQuantity: number): boolean =>
  quantity <= minQuantity;

/* Converts JSON quantity fields to integers so header notifications match server truth even if values deserialize as strings */
const toInt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Maps raw `/api/stock-items` list entries into low-stock notification rows (inventory page uses the same threshold logic).
 */
export const extractLowStockRowsFromItemsList = (
  items: unknown[],
): LowStockNotificationRow[] => {
  const rows: LowStockNotificationRow[] = [];

  for (const entry of items) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    if (typeof obj.id !== "string") continue;
    const brand = typeof obj.brand === "string" ? obj.brand : "";
    const model = typeof obj.model === "string" ? obj.model : "";
    const itemLabel = `${brand} ${model}`.trim();
    if (!itemLabel) continue;

    const quantity = toInt(obj.quantity);
    const minQuantity = toInt(obj.minQuantity);
    if (quantity === null || minQuantity === null) continue;

    if (isAtOrBelowMinimumStock(quantity, minQuantity)) {
      rows.push({ id: obj.id, itemLabel, quantity, minQuantity });
    }
  }

  return rows;
};
