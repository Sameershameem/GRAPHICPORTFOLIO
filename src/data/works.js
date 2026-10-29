import atlas from './atlas.json'

// Every graphic in the portfolio. `w`/`h` are the original pixel sizes,
// used for aspect ratios so layouts never shift while images load.
const list = [
  { id: 'barkaas-mango-sunrise', title: 'Mango Sunrise', client: 'Barkaas', tag: 'Restaurant', w: 1706, h: 2250 },
  { id: 'barkaas-lamb-chops', title: 'Lamb Chops', client: 'Barkaas', tag: 'Restaurant', w: 1706, h: 2250 },
  { id: 'barkaas-kunafa', title: 'Creamy Kunafa', client: 'Barkaas', tag: 'Restaurant', w: 1706, h: 2250 },
  { id: 'playplace-curious', title: 'Learn to be Curious', client: 'Play Place', tag: 'Education', w: 1687, h: 2109 },
  { id: 'gravity-neet-results', title: 'RE-NEET Results', client: 'Gravity', tag: 'Education', w: 1687, h: 2109 },
  { id: 'islamic-mission-school', title: 'Every Step Today', client: 'Islamic Mission School', tag: 'Education', w: 1687, h: 2109 },
  { id: 'rakesh-bangles', title: 'Exclusive Variety', client: 'Rakesh Jewellers', tag: 'Jewellery', w: 1687, h: 2109 },
  { id: 'brandsway-hiring', title: 'We are Hiring', client: 'Brandsway', tag: 'Agency', w: 1687, h: 2109 },
  { id: 'playplace-learn-grow', title: 'Learn & Grow', client: 'Play Place', tag: 'Education', w: 1687, h: 2109 },
  { id: 'rakesh-22-karat', title: '22 Karat', client: 'Rakesh Jewellers', tag: 'Jewellery', w: 1687, h: 2109 },
  { id: 'brandsway-results', title: 'Serving Results', client: 'Brandsway', tag: 'Agency', w: 1687, h: 2109 },
  { id: 'rakesh-diamonds', title: 'Natural Diamonds', client: 'Rakesh Jewellers', tag: 'Jewellery', w: 1687, h: 2109 },
  { id: 'alayham-window', title: 'Discover the World', client: 'Al Ayham Travel', tag: 'Travel', w: 1600, h: 1600 },
  { id: 'alayham-best-price', title: 'Best Fare Flights', client: 'Al Ayham Travel', tag: 'Travel', w: 1600, h: 1600 },
  { id: 'alayham-suitcase', title: 'Travel & Relax', client: 'Al Ayham Travel', tag: 'Travel', w: 1600, h: 1600 },
  { id: 'alayham-visa', title: 'Visa Made Easy', client: 'Al Ayham Travel', tag: 'Travel', w: 1600, h: 1600 },
  { id: 'alayham-dream-destination', title: 'Dream Destination', client: 'Al Ayham Travel', tag: 'Travel', w: 1600, h: 1600 },
  { id: 'alayham-anywhere', title: 'Fly Anywhere', client: 'Al Ayham Travel', tag: 'Travel', w: 1600, h: 1600 },
  { id: 'kernello-packaging', title: 'Kernello Box', client: 'Kernello', tag: 'Packaging', w: 1400, h: 980 },
  { id: 'growth-journey-pouches', title: 'Spice Pouches', client: 'Growth Journey', tag: 'Packaging', w: 1240, h: 863 },
]

// Relative to the deployed base path, so the site works at a domain root or
// under a sub-path such as GitHub Pages' /<repo>/.
const base = `${import.meta.env.BASE_URL}works/`

export const works = list.map((w, i) => ({
  ...w,
  index: i,
  ratio: w.w / w.h,
  xs: `${base}${w.id}-xs.webp`,
  sm: `${base}${w.id}-sm.webp`,
  lg: `${base}${w.id}-lg.webp`,
  // Cards: lets phones pick the 240px file when that's sharp enough.
  srcSet: `${base}${w.id}-xs.webp 240w, ${base}${w.id}-sm.webp 520w`,
  rect: atlas.rects[w.id],
}))

export const byId = Object.fromEntries(works.map((w) => [w.id, w]))
export const atlasInfo = { src: `${base}atlas.webp`, w: atlas.w, h: atlas.h }

export const clients = [
  { name: 'Barkaas', note: 'Indo Arabic Restaurant' },
  { name: 'Play Place', note: 'International School' },
  { name: 'Gravity', note: 'Orienting Intelligence' },
  { name: 'Islamic Mission', note: 'School' },
  { name: 'Rakesh', note: 'Jewellers' },
  { name: 'Brandsway', note: 'Agency' },
  { name: 'Al Ayham', note: 'Travel & Tourism' },
]
