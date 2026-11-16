// breakpointi u JS-u, vrijednosti moraju da prate $breakpoints iz _variables.scss
// svi isti media query dijele jedan matchMedia listener

import { getCurrentInstance, onUnmounted, readonly, ref } from "vue";

export const BREAKPOINTS = {
  "mobile-sm": 400,
  mobile: 640,
  "tablet-sm": 768,
  tablet: 1000,
  "laptop-sm": 1200,
  "laptop-md": 1300,
  laptop: 1440,
  desktop: 1600
};

// query string -> { matches, readonly_matches, media_query_list, onChange, count }
const registry = new Map();

const acquire = (query) => {
  let entry = registry.get(query);

  if (!entry) {
    const media_query_list = window.matchMedia(query);
    const matches = ref(media_query_list.matches);
    const onChange = (event) => {
      matches.value = event.matches;
    };

    media_query_list.addEventListener("change", onChange);

    entry = {
      matches,
      readonly_matches: readonly(matches),
      media_query_list,
      onChange,
      count: 0
    };

    registry.set(query, entry);
  }

  entry.count += 1;

  return entry;
};

const release = (query) => {
  const entry = registry.get(query);

  if (!entry) return;

  entry.count -= 1;

  // Poslednji korisnik gasi svetlo.
  if (entry.count <= 0) {
    entry.media_query_list.removeEventListener("change", entry.onChange);
    registry.delete(query);
  }
};

export const useMediaQuery = (query) => {
  const entry = acquire(query);

  if (getCurrentInstance()) onUnmounted(() => release(query));

  return entry.readonly_matches;
};

const maxWidth = (name) => `(max-width: ${BREAKPOINTS[name]}px)`;

export const useBreakpoint = () => ({
  is_mobile_sm: useMediaQuery(maxWidth("mobile-sm")),
  is_mobile: useMediaQuery(maxWidth("mobile")),
  is_tablet_sm: useMediaQuery(maxWidth("tablet-sm")),
  is_tablet: useMediaQuery(maxWidth("tablet")),
  is_laptop_sm: useMediaQuery(maxWidth("laptop-sm")),
  is_laptop: useMediaQuery(maxWidth("laptop")),
  is_desktop: useMediaQuery(maxWidth("desktop"))
});
