import { nextTick, ref } from "vue";

// otvara padajući panel ispod ili iznad polja, ili ga pomjeri da cijeli stane
// granica je najbliži roditelj koji siječe sadržaj, ne cijeli ekran
const SCREEN_GAP = 8;

export const useDropdownPlacement = (root_ref, panel_height) => {
  const opens_up = ref(false);
  const shift_y = ref(0);

  const visibleBounds = () => {
    let top = 0;
    let bottom = window.innerHeight;

    for (let element = root_ref.value?.parentElement; element; element = element.parentElement) {
      const { overflowX, overflowY } = getComputedStyle(element);

      if (overflowY !== "visible" || overflowX !== "visible") {
        const rect = element.getBoundingClientRect();
        top = Math.max(top, rect.top);
        bottom = Math.min(bottom, rect.bottom);
        break;
      }
    }

    return { top: top + SCREEN_GAP, bottom: bottom - SCREEN_GAP };
  };

  // pozvati odmah poslije is_open = true, getPanel se čita poslije nextTick
  const place = async (field, getPanel) => {
    const bounds = visibleBounds();
    const rect = field.getBoundingClientRect();
    const space_below = bounds.bottom - rect.bottom;

    opens_up.value = space_below < panel_height && rect.top - bounds.top > space_below;
    shift_y.value = 0;

    await nextTick();
    const panel = getPanel()?.getBoundingClientRect();
    if (!panel) return;

    if (panel.top < bounds.top) shift_y.value = bounds.top - panel.top;
    else if (panel.bottom > bounds.bottom) shift_y.value = bounds.bottom - panel.bottom;
  };

  return { opens_up, shift_y, place };
};
