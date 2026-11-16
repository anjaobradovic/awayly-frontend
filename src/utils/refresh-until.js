// backend odmah posle kreiranja nekad ne vraca novi zahtjev, pa ucitavamo ponovo par puta
const DELAYS = [300, 700, 1500];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function refreshUntil(load, isDone) {
  await load();

  for (const delay of DELAYS) {
    if (isDone()) return;

    await wait(delay);
    await load();
  }
}
