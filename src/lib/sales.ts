import "server-only";

/** Units sold on non-cancelled orders, keyed by slug. Null when the order store cannot be read from this process. */
export async function loadSoldUnits(): Promise<Map<string, number> | null> {
  return null;
}
