export const beerStyleGroups = [
  {
    label: 'Česká klasika (Spodně kvašená)',
    styles: [
      'Světlé výčepní (10°)',
      'Světlý ležák (11°)',
      'Světlý ležák (12°)',
      'Polotmavý ležák (Jantar)',
      'Tmavý ležák / Černé',
      'Světlý speciál (13° a více)',
    ],
  },
  {
    label: 'Craft & Ale (Svrchně kvašená)',
    styles: [
      'APA (American Pale Ale)',
      'IPA (India Pale Ale)',
      'NEIPA (New England IPA)',
      'Red IPA',
      'Stout / Porter',
      'Pšeničné (Weissbier)',
    ],
  },
  {
    label: 'Ostatní',
    styles: [
      'Kyselé (Sour / Gose)',
      'Ovocné pivo / Radler',
      'Nealkoholické pivo',
      'Cider',
    ],
  },
]

export const styleDefaultAbv = {
  'Světlé výčepní (10°)': 4.0,
  'Světlý ležák (11°)': 4.5,
  'Světlý ležák (12°)': 5.0,
  'Polotmavý ležák (Jantar)': 4.8,
  'Tmavý ležák / Černé': 4.8,
  'Světlý speciál (13° a více)': 6.5,
  'APA (American Pale Ale)': 5.0,
  'IPA (India Pale Ale)': 6.5,
  'NEIPA (New England IPA)': 6.5,
  'Red IPA': 6.5,
  'Stout / Porter': 5.5,
  'Pšeničné (Weissbier)': 5.0,
  'Kyselé (Sour / Gose)': 4.0,
  'Ovocné pivo / Radler': 2.5,
  'Nealkoholické pivo': 0.3,
  'Cider': 4.5
}

export const beerCatalog = [
  { name: 'Pilsner Urquell', style: 'Světlý ležák (12°)', price: 65, vol: 0.5, abv: 4.4 },
  { name: 'Radegast Rázná 10', style: 'Světlé výčepní (10°)', price: 45, vol: 0.5, abv: 4.1 },
  { name: 'Radegast Ryze Hořká 12', style: 'Světlý ležák (12°)', price: 55, vol: 0.5, abv: 5.1 },
  { name: 'Budvar 33', style: 'Světlý ležák (12°)', price: 55, vol: 0.5, abv: 4.6 },
  { name: 'Budweiser Budvar Original', style: 'Světlý ležák (12°)', price: 55, vol: 0.5, abv: 5.0 },
  { name: 'Kozel 11', style: 'Světlý ležák (11°)', price: 48, vol: 0.5, abv: 4.6 },
  { name: 'Svijanský Máz 11°', style: 'Světlý ležák (11°)', price: 45, vol: 0.5, abv: 4.8 },
  { name: 'Matuška California', style: 'APA (American Pale Ale)', price: 85, vol: 0.5, abv: 5.2 },
  { name: 'Matuška Raptor', style: 'IPA (India Pale Ale)', price: 95, vol: 0.5, abv: 6.3 },
  { name: 'Zichovec Nectar of Happiness', style: 'NEIPA (New England IPA)', price: 95, vol: 0.5, abv: 7.0 }
]
