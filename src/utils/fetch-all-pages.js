import { useApi } from "@/composables/useApi";

// skuplja sve strane jer tabele same filtriraju i paginiraju
// list_key je ime niza u odgovoru
const PAGE_SIZE = 100;

export const fetchAllPages = async (endpoint, list_key, filters = {}) => {
  const { get } = useApi();
  const items = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await get(endpoint, {
      auth: true,
      filters: { ...filters, page: { value: page }, page_size: { value: PAGE_SIZE } }
    });

    if (error) return { items, error };

    const payload = data?.data?.data;
    const page_items = payload?.[list_key] ?? [];

    items.push(...page_items);

    // kraj: prazna strana ili smo skupili sve
    if (!page_items.length || items.length >= (payload?.total_count ?? 0)) break;
  }

  return { items, error: null };
};
