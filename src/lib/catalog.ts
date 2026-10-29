export interface Product {
  id: string;
  name: string;
  color: string;
  title: string;
  group: 'roots' | 'designs';
  image?: string;
  back?: string;
  description: string;
}

export interface LookbookItem {
  image: string;
  title: string;
  number: string;
}

export interface BagItem {
  id: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
}

export const STORE_INFO = {
  name: 'Esteem Gallery',
  tagline: 'Wear Your Vision',
  phone: '+263788554277',
  phoneFormatted: '+263 788 554 277',
  whatsappUrl: 'https://wa.me/263788554277',
  instagram: 'https://www.instagram.com/call_me_vashe/?utm_source=qr&r=nametag',
  tiktok: 'https://www.tiktok.com/@im_vashe?_r=1&_t=ZS-9AaIshfvs9a',
  location: 'Harare, Zimbabwe',
  established: '2025',
};

const ROOTS_DESC =
  'A familiar silhouette. A different perspective. Vintage-washed cotton, a relaxed drop shoulder, and raw-edge distressing. Made to wear your way.';

export const ROOTS_COLLECTION: Product[] = [
  {
    id: 'washed-black',
    name: 'Washed Black',
    color: '#292825',
    title: 'Signature Distressed Tee',
    group: 'roots',
    back: '/images/back.webp',
    description: ROOTS_DESC,
  },
  {
    id: 'vintage-grey',
    name: 'Vintage Grey',
    color: '#77736d',
    title: 'Signature Distressed Tee',
    group: 'roots',
    description: ROOTS_DESC,
  },
  {
    id: 'sand-beige',
    name: 'Sand Beige',
    color: '#b9a48a',
    title: 'Signature Distressed Tee',
    group: 'roots',
    description: ROOTS_DESC,
  },
  {
    id: 'olive-green',
    name: 'Olive Green',
    color: '#54563d',
    title: 'Signature Distressed Tee',
    group: 'roots',
    description: ROOTS_DESC,
  },
  {
    id: 'off-white',
    name: 'Off White',
    color: '#e2dcd0',
    title: 'Signature Distressed Tee',
    group: 'roots',
    description: ROOTS_DESC,
  },
];

export const DESIGNS_COLLECTION: Product[] = [
  {
    id: 'sza-brush',
    name: 'SZA / Brush',
    color: '#292825',
    title: 'Brush Script Tee',
    group: 'designs',
    description:
      'Expressive brush lettering on a washed black oversized silhouette. A design study from our SZA reference series; availability confirmed on WhatsApp.',
  },
  {
    id: 'sza-portrait',
    name: 'SZA / Portrait',
    color: '#e2dcd0',
    title: 'Portrait Graphic Tee',
    group: 'designs',
    back: '/images/sza-portrait-back.webp',
    description:
      'A portrait-led graphic with elegant serif lettering on off-white cotton. Supplied front and worn back reference; final print placement and availability confirmed on WhatsApp.',
  },
  {
    id: 'sza-graffiti',
    name: 'SZA / Graffiti',
    color: '#292825',
    title: 'Graffiti Graphic Tee',
    group: 'designs',
    description:
      'Raw linework, expressive lettering and butterfly details. A street-culture graphic study on a relaxed black tee; availability confirmed on WhatsApp.',
  },
  {
    id: 'sza-moon',
    name: 'SZA / Moon',
    color: '#292825',
    title: 'Moon Graphic Tee',
    group: 'designs',
    back: '/images/sza-moon-back.webp',
    description:
      'A moonlit portrait with “Same Dream, Different Day” detailing. Supplied graphic and worn back references; availability confirmed on WhatsApp.',
  },
  {
    id: 'eg-future',
    name: 'EG / Future',
    color: '#292825',
    title: 'Futurist Logo Tee',
    group: 'designs',
    description:
      'A sleek, forward-facing Esteem wordmark on washed black. An alternate identity study; availability confirmed on WhatsApp.',
  },
  {
    id: 'eg-gothic',
    name: 'EG / Gothic',
    color: '#292825',
    title: 'Old English Logo Tee',
    group: 'designs',
    description:
      'Old-English lettering meets a modern oversized silhouette. An alternate Esteem identity study; availability confirmed on WhatsApp.',
  },
  {
    id: 'eg-outline',
    name: 'EG / Outline',
    color: '#e2dcd0',
    title: 'Outline Logo Tee',
    group: 'designs',
    description:
      'A fine outlined wordmark and signature four-point star on off-white. An alternate Esteem identity study; availability confirmed on WhatsApp.',
  },
];

export const ALL_PRODUCTS: Product[] = [...ROOTS_COLLECTION, ...DESIGNS_COLLECTION];

export const LOOKBOOK_ITEMS: LookbookItem[] = [
  { image: 'look-01', title: 'Quiet confidence.', number: '01' },
  { image: 'look-03', title: 'No permission needed.', number: '02' },
  { image: 'look-02', title: 'The detail is the difference.', number: '03' },
  { image: 'look-04', title: 'Your city. Your canvas.', number: '04' },
];

export const LOGO_STUDY_LABELS = [
  'Bold street',
  'Classic serif',
  'Brush script',
  'Modern futurist',
  'Old English',
  'Outline / sporty',
];

export const NAV_LINKS = [
  ['Shop', '#collection'],
  ['Collections', '#collection'],
  ['Lookbook', '#lookbook'],
  ['Our Story', '#story'],
  ['Other Designs', '#designs'],
] as const;

export const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
export type ShirtSize = (typeof AVAILABLE_SIZES)[number];

export function findProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}
