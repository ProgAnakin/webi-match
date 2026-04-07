export interface Store {
  id: string;
  name: string;
  shortName: string;
}

export const STORES: Store[] = [
  { id: "corso-vercelli", name: 'Webidoo Store "Corso Vercelli"', shortName: "Corso Vercelli" },
  { id: "5-giornate",     name: 'Webidoo Store "5 Giornate"',    shortName: "5 Giornate"    },
  { id: "verona",         name: 'Webidoo Store "Verona"',         shortName: "Verona"        },
  { id: "bergamo",        name: 'Webidoo Store "Bergamo"',        shortName: "Bergamo"       },
];

export const STORE_LS_KEY = "wb_store_id";

export function getStoredStoreId(): string | null {
  try { return localStorage.getItem(STORE_LS_KEY); } catch { return null; }
}

export function setStoredStoreId(id: string): void {
  try { localStorage.setItem(STORE_LS_KEY, id); } catch {}
}

export function getStoreById(id: string): Store | undefined {
  return STORES.find((s) => s.id === id);
}
