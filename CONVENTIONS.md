# Konvencije projekta

Kratak vodič kroz to kako je projekat sastavljen i zašto. Cilj je da za svaku
stvar postoji **jedno očigledno mesto** gde se piše.

---

## 1. Struktura foldera

```
src/
├── main.js              # start aplikacije
├── config.js            # ime aplikacije, API adresa, mock prekidač
├── App.vue              # koren — samo router-view
├── router/index.js      # SVE rute + guard
├── i18n/                # t(), množina, ćirilica, messages/*.js
├── mocks/               # lažni backend (presreće fetch)
├── assets/
│   ├── scss/            # paleta, dizajn tokeni i globalni stilovi
│   └── css/vendor.css   # tuđi CSS (material-icons)
├── components/          # reusable komponente — V* prefiks
├── composables/         # reusable logika — use* prefiks
├── layouts/             # okviri strana (header, sidebar…)
├── stores/              # Pinia store-ovi
├── utils/               # čiste funkcije, bez Vue-a
└── views/               # ekrani (jedan folder = jedna ruta)
```

Pravilo: **`components/` ne sme da zna ni za jedan store.** Komponente primaju
podatke kroz propove i javljaju se kroz emit. Store se zove iz `views/` i
`layouts/`. Tako komponentu možeš preneti u drugi projekat kao fajl.

---

## 2. Imenovanje

| Šta                           | Kako                         | Primer                                      |
| ----------------------------- | ---------------------------- | ------------------------------------------- |
| Folder                        | kebab-case                   | `views/not-found/`                          |
| `.vue` fajl                   | PascalCase                   | `VButton.vue`, `Login.vue`                  |
| Reusable komponenta           | `V` + PascalCase             | `VButton`, `VInput`, `VIcon`                |
| View / layout komponenta      | PascalCase, bez prefiksa     | `Login.vue`, `MainLayout.vue`               |
| U templejtu                   | kebab-case tag               | `<v-button>`, `<content-renderer>`          |
| JS fajl                       | kebab-case                   | `stores/user-management.js`                 |
| Composable                    | `use` + camelCase            | `useApi`, `useDebounce`                     |
| Store composable              | `use` + PascalCase + `Store` | `useAuthStore`, `useExampleStore`           |
| **Promenljive, refs, state**  | **snake_case**               | `is_loading`, `local_value`, `input_ref`    |
| **Funkcije, akcije, propovi** | **camelCase**                | `focusInput()`, `getItems()`, `leadingIcon` |
| Konstante na nivou modula     | SCREAMING_SNAKE              | `BREAKPOINTS`, `SEMANTIC`                   |
| Ime rute                      | čitljiv tekst sa razmacima   | `"Not Found"`, `"Main layout"`              |

Zašto snake_case za promenljive a camelCase za funkcije: kad čitaš kod, po
obliku imena odmah znaš da li je nešto **vrednost** ili **radnja**.

Propovi se pišu `camelCase` u JS-u, a `kebab-case` u templejtu — Vue sam
prevodi između to dvoje:

```vue
<v-input leading-icon="search" />
<!-- templejt -->
props.leadingIcon // JS
```

---

## 3. SCSS

### 3.1 Fajlovi

```
assets/scss/
├── _variables.scss    # TOKENI (boje, razmaci, fontovi, breakpointi)
├── _mixins.scss       # mixini + generator klasa
├── _index.scss        # spaja variables + mixins (ulazna tačka za tokene)
├── main.scss          # JEDINI stylesheet koji main.js importuje
├── reset.scss         # @layer reset
├── global.scss        # @layer base — :root varijable, body, scrollbar
├── _transitions.scss  # @layer base — Vue transition klase
└── fonts.scss         # @font-face
```

Podvlaka na početku (`_variables.scss`) znači **partial** — Sass ga sam ne
kompajlira u CSS, služi samo da ga neko drugi učita.

### 3.2 Kako tokeni stižu u komponentu

U `vite.config.js` stoji:

```js
css: {
  preprocessorOptions: {
    scss: { additionalData: `@use "@/assets/scss/index" as *;` },
  },
},
```

To znači: **na vrh svakog `<style lang="scss">` bloka Vite sam zalepi taj red.**
Zato u komponenti pišeš `$space-16`, `$primary`, `@include flex(...)` bez
ijednog importa.

`_index.scss` koristi `@forward` (ne `@use`), jer `@forward` prosleđuje članove
dalje, a `@use` bi ih zadržao samo za sebe:

```scss
@forward "variables";
@forward "mixins";
```

> **Pravilo:** u `additionalData` sme samo ono što **ne proizvodi CSS**
> (varijable, mixini, funkcije). Da tamo staviš fajl sa pravim stilovima,
> on bi se prekopirao u svaku komponentu i CSS bi eksplodirao.

Jedini `@use` koji se piše u komponenti su ugrađeni Sass moduli, i to samo kad
zatrebaju:

```scss
@use "sass:map"; // map.get()
@use "sass:list"; // list.nth()
@use "sass:color"; // color.mix()
```

### 3.3 Tokeni — pravila

- **Nikad sirov hex ili px u komponenti.** Uvek token: `$primary`, `$space-16`.
- Ime govori px, vrednost je rem: `$space-16: 1rem`, `$text-14: 0.875rem`.
  Zato se sve proporcionalno smanji kad na mobilnom spustimo `html { font-size: 14px }`
  (jedan blok u `App.vue`, umesto media queryja po komponenti).
- `$breakpoints` su **max-width** vrednosti (desktop-first).
- Ako menjaš `BREAKPOINTS` u `composables/useBreakpoint.js`, promeni i
  `$breakpoints` u `_variables.scss` — održavaju se ručno.

### 3.4 Mixini

```scss
@include flex(space-between, center, $space-8);   // flex kontejner
@include respond-to("tablet") { ... }             // media query <= 1000px
@include truncate;                                // tekst u jedan red sa "…"
@include accent-vars("v-field");                  // generiše grupu klasa
```

`respond-to` puca sa `@error` ako ime breakpointa ne postoji — bolje da build
stane nego da media query tiho ne radi.

### 3.5 Petlje (`@each`) — tri mesta gde se koriste

**1) `global.scss` — mapa boja u CSS varijable**

```scss
:root {
  @each $name, $value in $colors {
    --c-#{$name}: #{$value};
  }
}
```

`#{...}` je interpolacija — "ubaci vrednost ovde". Rezultat:
`--c-primary: #7c57fb; --c-success: #0ea050; ...` (trenutno 40 varijabli).

Ovo postoji zato što **Sass promenljive ne postoje u browseru** — nestanu pri
kompajliranju. CSS varijable žive u browseru, pa im JS može pristupiti. Zbog te
petlje radi ovo:

```vue
<v-button color="success" />
```

`resolveColor("success")` u `utils/color.js` napravi `var(--c-success, success)`.
**Dodaš boju u `$colors` → odmah je možeš proslediti kao `color` prop.**

**2) `VButton.vue` — generisanje varijanti**

```scss
@each $name, $c in $variants {
  .v-btn--#{$name} {
    --v-btn-color: #{list.nth($c, 1)}; // base
    --v-btn-hover: #{list.nth($c, 2)}; // hover
    --v-btn-pressed: #{list.nth($c, 3)}; // pressed
  }
}
```

`$variants` je mapa **trojki** `(base, hover, pressed)`. Petlja napravi
`.v-btn--primary`, `.v-btn--secondary`, `.v-btn--neutral`. Dodaš stavku u mapu
→ nova varijanta dugmeta postoji, bez izmene u komponenti.

**3) `_mixins.scss` — `accent-vars` generator**

```scss
@include accent-vars("v-field");
```

Jedan red napiše pet klasa:

```css
.v-field--primary {
  --v-accent: #7c57fb;
}
.v-field--info {
  --v-accent: #0077e4;
}
.v-field--success {
  --v-accent: #0ea050;
}
.v-field--warning {
  --v-accent: #ff910a;
}
.v-field--error {
  --v-accent: #e74141;
}
```

Sve unutra koristi `var(--v-accent)`, pa promena `color` propa preboji i ivicu
i pomoćni tekst odjednom.

> Namerno **nema** generatora utility klasa (`.mt-16`, `.p-24`). Razmaci se
> pišu tokenima unutar BEM bloka komponente.

### 3.6 CSS cascade layers — najvažniji deo

U `index.html`, pre svega ostalog:

```html
<style>
  @layer reset, vendor, base, components;
</style>
```

Redosled: `reset < vendor < base < components < (neulojeno)`.

Ko je gde:

| Sloj         | Šta ide                                                          |
| ------------ | ---------------------------------------------------------------- |
| `reset`      | `reset.scss`                                                     |
| `vendor`     | `vendor.css` → `@import "..." layer(vendor)`                     |
| `base`       | `global.scss`, `_transitions.scss`                               |
| `components` | **svaka `V*` komponenta** obavije stil u `@layer components { }` |
| neulojeno    | **view-ovi i layout-i** — bez ijednog `@layer`                   |

Ključno pravilo CSS-a: **neulojeni CSS uvek pobeđuje ulojeni, bez obzira na
specifičnost.** Zato iz view-a možeš nadjačati bilo koji stil `V*` komponente
običnom klasom:

```scss
/* u Login.vue */
.login__submit {
  width: 100%;
} /* radi — bez !important, bez :deep() */
```

Zato u ovom projektu **nema `!important`** i skoro nema `:deep()`.

Redosled mora u `index.html`, a ne u SCSS-u: pozicija sloja se fiksira čim ga
browser prvi put vidi, a Vite ne garantuje da li će prvo ubaciti `main.scss`
ili `<style>` blok neke komponente.

### 3.7 BEM i stanja

```
.v-btn            blok       = ime komponente
.v-btn__label     element    = deo bloka  (__)
.v-btn--outlined  modifier   = varijanta  (--)
.is-loading       STANJE     = nije BEM, namerno
```

Stanja (`is-loading`, `is-disabled`, `is-open`, `is-active`) imaju `is-` prefiks
i kače se objektom:

```js
const classes = computed(() => [
  "v-btn",
  `v-btn--${props.variant}`,
  { "is-pressed": pressed.value, "is-loading": props.loading }
]);
```

Modifier opisuje **kakva komponenta jeste** (trajno), stanje opisuje **šta joj se
trenutno dešava** (prolazno).

Uz to: svaka komponenta koja nešto animira dobija i

```scss
@media (prefers-reduced-motion: reduce) { ... }
```

---

## 4. Komponente

Recept za svaku `V*` komponentu:

1. `<script setup>`, obavezno JS (bez TypeScripta)
2. `defineProps` objekat sa `type`, `default` i **`validator`** gde ima smisla
3. `defineEmits(["click"])`
4. `defineModel()` za `v-model`
5. tema kroz **CSS varijable komponente** (`--v-btn-color`), ne kroz hardkodovane boje
6. `<style scoped lang="scss">` obavijen u `@layer components`
7. `prefers-reduced-motion` blok ako se nešto animira

### Prop za boju — dva režima

```js
const SEMANTIC = new Set(["primary", "secondary", "neutral"]);

const color_style = computed(() => {
  const style = {};
  if (!SEMANTIC.has(props.color)) style["--v-btn-color"] = resolveColor(props.color);
  return style;
});
```

- `"primary"` → koristi klasu koju je napravila `@each` petlja
- `"success"`, `"#e91e63"`, `"gold"` → inline CSS varijabla preko `resolveColor()`

### `inheritAttrs: false` — kada

Podrazumevano Vue kači sve neprepoznate atribute na koreni element. To je
tačno za `VButton` (`class` treba da padne na `<button>`), pa on ništa ne radi.

`VInput` je slučaj gde ne valja: koren je `VField`, a `<input>` je unutra.
Tamo se atributi ručno razdvajaju:

```js
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const input_attrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest; // maxlength, name, autofocus… -> na <input>
});
// class i style -> na VField
```

### Ikone

`VIcon` radi u dva režima, sam bira:

```vue
<v-icon name="close" />
<!-- material-icons ligatura -->
<v-icon name="/icons/logo.svg" color="primary" />
<!-- SVG preko CSS maske -->
```

Ako `name` sadrži `.` `/` ili `:` → tretira se kao putanja. SVG se ubacuje kao
maska, a boju daje `background-color` — zato je **obojiv tokenima** i jedan
fajl služi za sve boje. Imena ikona: <https://fonts.google.com/icons>

---

## 5. Ruter

### Layout se bira preko rute

Dve rute na vrhu dele `path: "/"`. Svaka renderuje svoj layout, a layout unutra
ima `<router-view>`:

```
/  →  MainLayout  →  /home, /example     (zaštićeno)
/  →  AuthLayout  →  /login              (javno)
/:catchAll(.*)  →  NotFound              (poslednja!)
```

Nema `layout` propa ni `v-if` u `App.vue` — **ruta odlučuje.**

### Lazy loading

```js
component: () => import("@/views/home/Home.vue");
```

Strelica znači: Vite napravi zaseban chunk koji se skida tek kad korisnik prvi
put ode na tu rutu.

### Guard

```js
router.beforeEach((to) => {
  const store = useAuthStore();
  const is_auth_route = to.matched.some((r) => r.meta.auth_route);
  const requires_auth = to.matched.some((r) => r.meta.requires_auth);

  if (is_auth_route && store.token) {
    store.resetAllStores();
    return true;
  }
  if (requires_auth && !store.token) return { name: "Login" };
});
```

Tri stvari vredi zapamtiti:

1. **`to.matched`** je niz svih poklopljenih ruta — i roditelja i deteta. Zato
   `meta` napisan na roditelju pokriva svu decu i ne mora da se ponavlja.
2. **Vraća se vrednost, ne zove se `next()`.** `undefined`/`true` = pusti,
   objekat = preusmeri, `false` = otkaži. (Stari `next()` se lako zaboravi
   pozvati, što zamrzne ruter.)
3. **`useAuthStore()` se zove UNUTAR guarda.** Izvan bi se izvršio pre nego što
   `main.js` registruje Pinia-u. Iz istog razloga u `main.js` ide
   `app.use(createPinia())` **pre** `app.use(router)`.

### `meta` polja

| Polje           | Značenje                                               |
| --------------- | ------------------------------------------------------ |
| `requires_auth` | bez tokena → redirect na Login                         |
| `auth_route`    | stranica za neulogovane; ulazak sa tokenom čisti store |

Dodaješ novo pravilo (npr. `requires_admin`)? Jedno polje u `meta` + jedan `if`
u guardu.

---

## 6. Pinia store-ovi

Koristimo **options** stil (`state` / `getters` / `actions`), isti kao Options
API u komponenti. Unutar akcije `this` je sam store.

```js
export const useExampleStore = defineStore("example", {
  state: () => ({ ... }),
  getters: { ... },
  actions: { ... },
});
```

Ime fajla = id store-a. `example.js` → `defineStore("example", ...)`.

### Obavezni obrasci

**Loading kao boolean u state-u**, gašen u `finally`:

```js
this.is_loading = true;
try { ... } finally { this.is_loading = false; }
```

**Filteri uvek u obliku `{ value, label, type }`:**

```js
filters: {
  search:    { value: null, label: null, type: "string" },
  page:      { value: 1,    label: null, type: "number" },
  page_size: { value: 15,   label: null, type: "number" },
}
```

`useApi` zna ovaj oblik: preskače prazne vrednosti, niz spaja zarezima, iz
objekta izvuče `.id` ili `.value`. Zato se ceo objekat prosleđuje odjednom:

```js
await get("example/getAllItems", { auth: true, filters: this.filters });
```

**`request_token` protiv trke.** Korisnik brzo kuca: krene zahtev za `"ab"`, pa
za `"abc"`. Ako `"ab"` stigne posle, prikazao bi pogrešne rezultate. Zato:

```js
const token = ++this.request_token;
// ...
if (token !== this.request_token) return; // zastareo odgovor — odbaci ga
```

**`resetStore()`**, koji view zove u `onUnmounted`. `request_token` se pritom
**povećava** (ne nulira) — time se odbacuje odgovor zahteva koji je bio u letu
kad si napustio ekran.

**Sve što treba da nestane pri odjavi mora biti deklarisano u `state()`.**
`$reset()` vraća state na ono što vraća funkcija `state()`; polje dodato kasnije
(`this.nesto = ...`) ne vidi.

### Auth

Token živi **samo u memoriji** — nema `localStorage`. Refresh stranice znači
ponovnu prijavu; guard to vidi (`store.token` je `null`) i vrati te na `/login`.

Odjava svih store-ova odjednom:

```js
getActivePinia()?._s.forEach((store) => store.$reset());
```

---

## 7. `useApi`

```js
const { get, post, put, patch, del } = useApi();
```

**`useApi()` se poziva unutar akcije, ne na vrhu fajla** — inače bi se izvršio
pre nego što Pinia postoji.

**Nikad ne baca izuzetak.** Uvek vraća isti oblik:

```js
const { data, error } = await post("auth/login", credentials, { auth: false });
if (error) return error;
```

Opcije:

| Opcija            | Značenje                                     |
| ----------------- | -------------------------------------------- |
| `auth: false`     | bez `Authorization` headera                  |
| `auth: true`      | zakači `Bearer <token>` iz auth store-a      |
| `auth: "<token>"` | zakači baš taj token (privremeni tokeni)     |
| `filters`         | objekat filtera → query parametri            |
| `body`            | automatski JSON, osim ako je `FormData`      |
| `responseType`    | `"json"` (podrazumevano), `"blob"`, `"text"` |
| `signal`          | `AbortController` za otkazivanje             |

Endpointi se pišu **bez vodeće kose crte**, jer se lepe na `VITE_API_BASE_URL`:

```js
get("auth/login"); // ✅
get("/auth/login"); // ❌
```

Zato `VITE_API_BASE_URL` u `.env` **mora da se završava kosom crtom.**

> Globalno rukovanje greškama (snackbar, katalog poruka po kodu, automatska
> odjava na 401) još nije uvedeno — u `useApi.js` stoje zakomentarisane kuke za
> to. Za sada se greška vraća pozivaocu i prikazuje lokalno, kao u `Login.vue`.

---

## 8. Kad dodaješ novi ekran

1. `src/views/<ime-ekrana>/ImeEkrana.vue`
2. Ako ima podatke sa servera → `src/stores/<ime>.js` (obrasci su u sekciji 6)
3. Rutu dodaj u `router/index.js`, pod `Main layout` ili `Auth layout`
4. U view-u: `onMounted` → povuci, `onUnmounted` → `store.resetStore()`
5. Stilovi u view-u **bez** `@layer`, sa BEM klasama i tokenima

---

## 9. Prevodi i teme

**Prevodi.** Svaki tekst ide kroz `t("oblast.kljuc")` (u šablonu `$t(...)`). Poruke su u
`src/i18n/messages/<oblast>.js` sa `sr` i `en` delom — ime fajla je prvi deo ključa. Ćirilica
se ne piše ručno, pravi se iz latinice. Množina: `t("common.days", { count })`, a poruka je
`"jedan | par | više"` (`"{count} dan | {count} dana | {count} dana"`). Konstante na nivou
modula čuvaju **ključ**, a prevode se tek pri crtanju — inače ne prate promenu jezika.
Datumi idu kroz `Intl` sa `intlLocale()`.

**Teme.** Sirove boje su u `_palette.scss` (svetla, tamna i pet boja akcenta), a tokeni u
`_variables.scss` su `var(--c-ime)`. `stores/theme.js` postavlja `data-theme` i `data-accent`
na `<html>`, pa se sve menja bez rebuilda. Zbog toga `rgba($token, x)` ne radi na tokenima —
koristi `alpha($token, x)`, a umesto `lighten/darken` ide `tint/shade`.

