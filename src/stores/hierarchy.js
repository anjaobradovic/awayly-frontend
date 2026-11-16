import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { roleName } from "@/utils/role-name";

const fullName = (node) => [node.first_name, node.last_name].filter(Boolean).join(" ");

const initialsOf = (node) =>
  [node.first_name, node.last_name]
    .map((part) => part?.[0] ?? "")
    .join("")
    .toUpperCase();

// pretraga bez kvačica: "obradovic" nalazi "Obradović"
const normalize = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const byName = (a, b) => a.name.localeCompare(b.name, "sr");

// api: hierarchy/getHierarchy, ravna lista sa manager_id
const toNode = (node) => ({
  id: node.id,
  name: fullName(node),
  initials: initialsOf(node),
  email: node.email ?? "",
  status: node.status,
  position: node.position ?? "",
  manager_id: node.manager_id ?? null,
  team_id: node.team?.id ?? null,
  team: node.team?.name ?? "",
  role: roleName(node.role?.name)
});

// na početku su otvorena prva dva nivoa
const OPEN_LEVELS = 2;

export const useHierarchyStore = defineStore("hierarchy", {
  state: () => ({
    nodes: [],
    is_loading: false,
    error: null,
    request_token: 0,
    search: "",
    expanded_ids: [],
    selected_id: null
  }),

  getters: {
    by_id: (state) => new Map(state.nodes.map((node) => [node.id, node])),

    // { manager_id: [podređeni po imenu] }
    children_by_manager: (state) => {
      const map = new Map();

      for (const node of state.nodes) {
        if (node.manager_id == null) continue;

        if (!map.has(node.manager_id)) map.set(node.manager_id, []);
        map.get(node.manager_id).push(node);
      }

      map.forEach((list) => list.sort(byName));

      return map;
    },

    roots: (state) => state.nodes.filter((node) => node.manager_id == null).sort(byName),

    team_count: (state) => new Set(state.nodes.map((node) => node.team_id).filter(Boolean)).size,

    manager_count() {
      return this.children_by_manager.size;
    },

    // osobe koje odgovaraju pretrazi
    match_ids(state) {
      const query = normalize(state.search.trim());
      if (!query) return [];

      return state.nodes
        .filter((node) =>
          normalize(`${node.name} ${node.email} ${node.position} ${node.team}`).includes(query)
        )
        .map((node) => node.id);
    },

    // pogođene osobe i svi njihovi nadređeni, null kad nema pretrage
    visible_ids() {
      if (!this.search.trim()) return null;

      const visible = new Set();

      for (const id of this.match_ids) {
        for (const node of this.chainOf(id)) visible.add(node.id);
      }

      return visible;
    },

    selected_node() {
      return this.by_id.get(this.selected_id) ?? null;
    },

    // lanac od vrha do osobe, zaštita od kruga u podacima
    chainOf() {
      return (id) => {
        const chain = [];
        const seen = new Set();
        let node = this.by_id.get(id);

        while (node && !seen.has(node.id)) {
          seen.add(node.id);
          chain.unshift(node);
          node = this.by_id.get(node.manager_id);
        }

        return chain;
      };
    },

    reportsOf() {
      return (id) => this.children_by_manager.get(id) ?? [];
    },

    // djeca koja se vide uz pretragu
    visibleChildrenOf() {
      return (id) => {
        const children = this.reportsOf(id);

        return this.visible_ids ? children.filter((node) => this.visible_ids.has(node.id)) : children;
      };
    },

    visible_roots() {
      return this.visible_ids
        ? this.roots.filter((node) => this.visible_ids.has(node.id))
        : this.roots;
    }
  },

  actions: {
    // api: hierarchy/getHierarchy
    async fetchHierarchy() {
      const { get } = useApi();
      const token = ++this.request_token;

      this.is_loading = true;
      this.error = null;

      try {
        const { data, error } = await get("hierarchy/getHierarchy", { auth: true });
        if (token !== this.request_token) return;

        if (error) {
          this.error = error;
          return error;
        }

        this.nodes = (data?.data?.data?.nodes ?? []).map(toNode);
        this.expandToLevel(OPEN_LEVELS);
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    expandToLevel(levels) {
      const ids = [];
      let level = this.roots;

      for (let depth = 0; depth < levels - 1 && level.length; depth += 1) {
        ids.push(...level.map((node) => node.id));
        level = level.flatMap((node) => this.reportsOf(node.id));
      }

      this.expanded_ids = ids;
    },

    toggle(id) {
      this.expanded_ids = this.expanded_ids.includes(id)
        ? this.expanded_ids.filter((expanded) => expanded !== id)
        : [...this.expanded_ids, id];
    },

    expandAll() {
      this.expanded_ids = [...this.children_by_manager.keys()];
    },

    collapseAll() {
      this.expanded_ids = [];
    },

    // otvara sve nadređene da se osoba vidi u stablu
    reveal(id) {
      const ancestors = this.chainOf(id)
        .slice(0, -1)
        .map((node) => node.id);

      this.expanded_ids = [...new Set([...this.expanded_ids, ...ancestors])];
    },

    setSearch(value) {
      this.search = value ?? "";
      this.match_ids.forEach((id) => this.reveal(id));
    },

    select(id) {
      this.selected_id = id;
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
