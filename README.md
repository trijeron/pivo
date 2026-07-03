# pivo 🍻

Pivní lístek pro partu — Vue 3 + Vite app.

Sleduje kdo pil co, kolik utratil každý piják a orientačně počítá promile.

## Vývoj

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Struktura

```
src/
  App.vue                    # Kořenová komponenta (taby, hlavička)
  main.js                    # Vstupní bod
  assets/main.css            # Globální styly
  data/beerCatalog.js        # Katalog piv pro našeptávač
  composables/useAppData.js  # Reaktivní stav, localStorage, výpočty
  components/
    BeerTab.vue              # Tab 1 – Piva na stole
    BeerCard.vue             # Karta jednoho piva
    AdminTab.vue             # Tab 2 – Nabídka a Stůl
    PeopleTab.vue            # Tab 3 – Pijáci a Útrata
    UserModal.vue            # Modál pro editaci pijáka
    RatingModal.vue          # Modál pro hodnocení piva
```
