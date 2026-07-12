import { reactive } from 'vue'

const LOCALE_STORAGE_KEY = 'beerAppLocaleV1'

const availableLocales = [
  { code: 'cs', label: 'Čeština' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' }
]

const localeState = reactive({
  locale: 'cs'
})

const translations = {
  cs: {
    language: 'Jazyk',
    currency: 'Kč',
    app: {
      title: '🍻 Pivní lístek',
      tableTotal: 'Útrata stolu',
      warningTitle: '⚠️ Upozornění:',
      warningBody: 'Promile je čistě orientační. Neslouží pro posouzení schopnosti řídit! (V ČR platí 0.0 ‰).'
    },
    theme: {
      light: '☀️ Světlý režim',
      dark: '🌙 Tmavý režim'
    },
    tabs: {
      beers: '🍺 Piva na stole',
      admin: '⚙️ Nabídka a stůl',
      people: '👥 Kamarádi a útrata'
    },
    beerTab: {
      manage: '⚙️ Správa piv',
      empty: 'Na stole zatím neleží žádné pivo.',
      emptyHint: 'Přidejte ho v administraci piv.'
    },
    admin: {
      addBeer: 'Přidat pivo z nabídky',
      beerNamePlaceholder: 'Začni psát název...',
      beerStylePlaceholder: 'Styl piva...',
      pricePlaceholder: 'Cena Kč',
      volumePlaceholder: 'Objem (l)',
      abvPlaceholder: 'Alkohol %',
      addBeerToTable: '+ Přidat pivo na stůl',
      bulkImport: 'Hromadný import piv ze seznamu',
      importFormat: 'Formát:',
      importFormatValue: 'Název - Styl - Cena - Objem - Alk(%)',
      importPlaceholder: 'Např:\nPilsner Urquell - Ležák - 65 - 0.5 - 4.4',
      importButton: 'Naimportovat',
      timeAndPayment: 'Čas a platba',
      eventStart: 'Začátek akce (první pivo):',
      resetPaid: '🔄 Zaplaceno (vynulovat čárky)',
      clearAll: '🗑️ Smazat úplně vše',
      importedBeers: 'Naimportováno {count} piv.',
      resetConfirm: 'Vynulovat všem pijákům vypitá piva (vynuluje se útrata i promile)?',
      clearConfirm: 'Smazat VŠECHNO a začít od nuly?'
    },
    beer: {
      deleteConfirm: 'Opravdu trvale smazat toto pivo z lístku?',
      namePlaceholder: 'Název',
      stylePlaceholder: 'Styl piva...',
      pricePlaceholder: 'Kč',
      save: 'Uložit',
      cancel: 'Zrušit',
      delete: '🗑️ Smazat pivo',
      addSelected: '+ Vybraným',
      removeSelected: '- Vybraným'
    },
    people: {
      editTitle: 'Upravit kamaráda',
      soberIn: 'Čistý za ~{hours} h',
      hasWhat: '📋 Co má {name}',
      empty: 'Zatím nemá nic vypito.',
      beer: 'Pivo',
      count: 'Ks',
      pricePerUnit: 'Cena/ks',
      total: 'Celkem',
      add: '+ Přidat kamaráda'
    },
    userModal: {
      title: '⚙️ Nastavení kamaráda',
      name: 'Jméno:',
      weight: 'Váha (kg):',
      gender: 'Pohlaví:',
      male: 'Muž',
      female: 'Žena',
      delete: '🗑️ Smazat kamaráda',
      mustHaveOne: 'Někdo to pít musí!',
      deleteConfirm: 'Opravdu smazat kamaráda "{name}" ze stolu?'
    },
    defaults: {
      unknownBeer: 'Neznámé pivo',
      friend: 'Kámoš {number}',
      me: 'Já'
    }
  },
  en: {
    language: 'Language',
    currency: 'CZK',
    app: {
      title: '🍻 Beer menu',
      tableTotal: 'Table total',
      warningTitle: '⚠️ Warning:',
      warningBody: 'BAC is only approximate. Do not use it to assess driving ability! The legal limit in the Czech Republic is 0.0 ‰.'
    },
    theme: {
      light: '☀️ Light mode',
      dark: '🌙 Dark mode'
    },
    tabs: {
      beers: '🍺 Beers on table',
      admin: '⚙️ Menu and table',
      people: '👥 Drinkers and totals'
    },
    beerTab: {
      manage: '⚙️ Beer administration',
      empty: 'There are no beers on the table yet.',
      emptyHint: 'Add them in beer administration.'
    },
    admin: {
      addBeer: 'Add beer from menu',
      beerNamePlaceholder: 'Start typing a name...',
      beerStylePlaceholder: 'Beer style...',
      pricePlaceholder: 'Price CZK',
      volumePlaceholder: 'Volume (l)',
      abvPlaceholder: 'Alcohol %',
      addBeerToTable: '+ Add beer to table',
      bulkImport: 'Bulk import beers from list',
      importFormat: 'Format:',
      importFormatValue: 'Name - Style - Price - Volume - ABV(%)',
      importPlaceholder: 'Example:\nPilsner Urquell - Lager - 65 - 0.5 - 4.4',
      importButton: 'Import',
      timeAndPayment: 'Time and payment',
      eventStart: 'Start time (first beer):',
      resetPaid: '🔄 Paid (reset tallies)',
      clearAll: '🗑️ Delete everything',
      importedBeers: 'Imported {count} beers.',
      resetConfirm: 'Reset consumed beers for all drinkers (this also resets totals and BAC)?',
      clearConfirm: 'Delete EVERYTHING and start from scratch?'
    },
    beer: {
      deleteConfirm: 'Do you really want to permanently delete this beer from the menu?',
      namePlaceholder: 'Name',
      stylePlaceholder: 'Beer style...',
      pricePlaceholder: 'CZK',
      save: 'Save',
      cancel: 'Cancel',
      delete: '🗑️ Delete beer',
      addSelected: '+ Add to selected',
      removeSelected: '- Remove from selected'
    },
    people: {
      editTitle: 'Edit drinker',
      soberIn: 'Sober in ~{hours} h',
      hasWhat: '📋 {name} has',
      empty: 'Nothing consumed yet.',
      beer: 'Beer',
      count: 'Qty',
      pricePerUnit: 'Price/unit',
      total: 'Total',
      add: '+ Add drinker'
    },
    userModal: {
      title: '⚙️ Drinker settings',
      name: 'Name:',
      weight: 'Weight (kg):',
      gender: 'Gender:',
      male: 'Male',
      female: 'Female',
      delete: '🗑️ Delete drinker',
      mustHaveOne: 'Someone has to drink!',
      deleteConfirm: 'Do you really want to remove "{name}" from the table?'
    },
    defaults: {
      unknownBeer: 'Unknown beer',
      friend: 'Friend {number}',
      me: 'Me'
    }
  },
  de: {
    language: 'Sprache',
    currency: 'CZK',
    app: {
      title: '🍻 Bierkarte',
      tableTotal: 'Tischsumme',
      warningTitle: '⚠️ Hinweis:',
      warningBody: 'Der Promillewert ist nur ein Richtwert. Er darf nicht zur Beurteilung der Fahrtüchtigkeit verwendet werden! In Tschechien gilt 0,0 ‰.'
    },
    theme: {
      light: '☀️ Heller Modus',
      dark: '🌙 Dunkler Modus'
    },
    tabs: {
      beers: '🍺 Biere auf dem Tisch',
      admin: '⚙️ Angebot und Tisch',
      people: '👥 Trinker und Kosten'
    },
    beerTab: {
      manage: '⚙️ Bierverwaltung',
      empty: 'Auf dem Tisch liegt noch kein Bier.',
      emptyHint: 'Füge es in der Bierverwaltung hinzu.'
    },
    admin: {
      addBeer: 'Bier aus dem Angebot hinzufügen',
      beerNamePlaceholder: 'Name eingeben...',
      beerStylePlaceholder: 'Bierstil...',
      pricePlaceholder: 'Preis CZK',
      volumePlaceholder: 'Volumen (l)',
      abvPlaceholder: 'Alkohol %',
      addBeerToTable: '+ Bier auf den Tisch',
      bulkImport: 'Biere gesammelt aus Liste importieren',
      importFormat: 'Format:',
      importFormatValue: 'Name - Stil - Preis - Volumen - Alkohol(%)',
      importPlaceholder: 'Beispiel:\nPilsner Urquell - Lager - 65 - 0.5 - 4.4',
      importButton: 'Importieren',
      timeAndPayment: 'Zeit und Bezahlung',
      eventStart: 'Beginn der Runde (erstes Bier):',
      resetPaid: '🔄 Bezahlt (Striche zurücksetzen)',
      clearAll: '🗑️ Alles löschen',
      importedBeers: '{count} Biere importiert.',
      resetConfirm: 'Getrunkene Biere für alle Trinker zurücksetzen (setzt auch Kosten und Promille zurück)?',
      clearConfirm: 'ALLES löschen und von vorne anfangen?'
    },
    beer: {
      deleteConfirm: 'Möchtest du dieses Bier wirklich dauerhaft aus der Karte löschen?',
      namePlaceholder: 'Name',
      stylePlaceholder: 'Bierstil...',
      pricePlaceholder: 'CZK',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: '🗑️ Bier löschen',
      addSelected: '+ Zu Ausgewählten',
      removeSelected: '- Von Ausgewählten'
    },
    people: {
      editTitle: 'Trinker bearbeiten',
      soberIn: 'Nüchtern in ~{hours} Std.',
      hasWhat: '📋 {name} hat',
      empty: 'Bisher noch nichts getrunken.',
      beer: 'Bier',
      count: 'Stk',
      pricePerUnit: 'Preis/Stk',
      total: 'Gesamt',
      add: '+ Trinker hinzufügen'
    },
    userModal: {
      title: '⚙️ Trinkereinstellungen',
      name: 'Name:',
      weight: 'Gewicht (kg):',
      gender: 'Geschlecht:',
      male: 'Mann',
      female: 'Frau',
      delete: '🗑️ Trinker löschen',
      mustHaveOne: 'Jemand muss es trinken!',
      deleteConfirm: 'Möchtest du "{name}" wirklich vom Tisch entfernen?'
    },
    defaults: {
      unknownBeer: 'Unbekanntes Bier',
      friend: 'Freund {number}',
      me: 'Ich'
    }
  }
}

const beerGroupTranslations = {
  en: {
    'Česká klasika (Spodně kvašená)': 'Czech classics (bottom-fermented)',
    'Craft & Ale (Svrchně kvašená)': 'Craft & ale (top-fermented)',
    'Ostatní': 'Other'
  },
  de: {
    'Česká klasika (Spodně kvašená)': 'Tschechische Klassiker (untergärig)',
    'Craft & Ale (Svrchně kvašená)': 'Craft & Ale (obergärig)',
    'Ostatní': 'Sonstiges'
  }
}

const beerStyleTranslations = {
  en: {
    'Světlé výčepní (10°)': 'Light draft beer (10°)',
    'Světlý ležák (11°)': 'Pale lager (11°)',
    'Světlý ležák (12°)': 'Pale lager (12°)',
    'Polotmavý ležák (Jantar)': 'Amber lager',
    'Tmavý ležák / Černé': 'Dark lager / dark beer',
    'Světlý speciál (13° a více)': 'Strong pale special (13°+)',
    'Pšeničné (Weissbier)': 'Wheat beer (Weissbier)',
    'Kyselé (Sour / Gose)': 'Sour (Sour / Gose)',
    'Ovocné pivo / Radler': 'Fruit beer / Radler',
    'Nealkoholické pivo': 'Non-alcoholic beer'
  },
  de: {
    'Světlé výčepní (10°)': 'Helles Schankbier (10°)',
    'Světlý ležák (11°)': 'Helles Lager (11°)',
    'Světlý ležák (12°)': 'Helles Lager (12°)',
    'Polotmavý ležák (Jantar)': 'Bernsteinlager',
    'Tmavý ležák / Černé': 'Dunkles Lager / Schwarzbier',
    'Světlý speciál (13° a více)': 'Helles Spezialbier (13° und mehr)',
    'Pšeničné (Weissbier)': 'Weizenbier (Weissbier)',
    'Kyselé (Sour / Gose)': 'Sauerbier (Sour / Gose)',
    'Ovocné pivo / Radler': 'Fruchtbier / Radler',
    'Nealkoholické pivo': 'Alkoholfreies Bier'
  }
}

function getValueByPath(source, path) {
  return path.split('.').reduce((current, key) => current?.[key], source)
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`)
}

function loadLocale() {
  try {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (availableLocales.some(locale => locale.code === savedLocale)) {
      localeState.locale = savedLocale
    }
  } catch (e) {}
}

function setLocale(locale) {
  if (!availableLocales.some(item => item.code === locale)) return
  localeState.locale = locale
  try { localStorage.setItem(LOCALE_STORAGE_KEY, locale) } catch (e) {}
}

function t(path, params = {}) {
  const template =
    getValueByPath(translations[localeState.locale], path) ??
    getValueByPath(translations.cs, path) ??
    path

  return interpolate(template, params)
}

function translateBeerGroupLabel(label) {
  return beerGroupTranslations[localeState.locale]?.[label] || label
}

function translateBeerStyle(style) {
  return beerStyleTranslations[localeState.locale]?.[style] || style
}

loadLocale()

export function useI18n() {
  return {
    localeState,
    availableLocales,
    t,
    setLocale,
    translateBeerGroupLabel,
    translateBeerStyle
  }
}
