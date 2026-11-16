//pozovi funkciju kada korisnik klikne van elementa
import { onMounted, onUnmounted, toValue } from "vue";

export const useClickOutside = (target, handler) => {
  const onPointDown = (event) => {
    const element = toValue(target);

    //ako je klik unutar elementa, ne radis nista
    if (!element || element.contains(event.target)) return;

    handler(event);
  };

  onMounted(() => document.addEventListener("pointerdown", onPointDown));
  onUnmounted(() => document.removeEventListener("pointerdown", onPointDown));
};
