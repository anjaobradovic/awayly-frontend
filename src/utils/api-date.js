// Backend datume prima samo sa vremenom: "%Y-%m-%dT%H:%M:%SZ"
export const toApiDate = (date) => (date ? `${String(date).slice(0, 10)}T00:00:00Z` : date);

// kraj dana, da posljednji dan bude uključen u filter
export const toApiDateEnd = (date) => (date ? `${String(date).slice(0, 10)}T23:59:59Z` : date);
