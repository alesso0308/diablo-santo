export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  accent: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "nocturnal-silk-ss",
    name: "Nocturnal Silk S/S",
    tagline: "Hand-finished seams · Limited run",
    description: "Ultra-heavy silk blend with a restrained drape.",
    longDescription:
      "Cut for a elongated silhouette with dropped shoulders and a tactile matte finish. Each piece is individually pressed and inspected. Part of our shadow capsule.",
    price: 420,
    currency: "USD",
    category: "Tops",
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "Ivory stitching",
  },
  {
    id: "2",
    slug: "obsidian-tailored-trousers",
    name: "Obsidian Tailored Trousers",
    tagline: "Structured wool blend",
    description: "Architectural tailoring with invisible hardware.",
    longDescription:
      "High-rise, straight leg with a whisper of break at the shoe. Concealed fasteners and satin-faced waistband lining. Dyed in small batches for depth of black.",
    price: 580,
    currency: "USD",
    category: "Bottoms",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "Bone interior tape",
  },
  {
    id: "3",
    slug: "veil-layer-hood",
    name: "Veil Layer Hood",
    tagline: "Double-shell construction",
    description: "Sculptural hood with modular face panel.",
    longDescription:
      "Designed as a movable sculpture: interior shell in brushed fleece, exterior in weathered nylon. Detachable veil layer for tonal contrast and anonymity on command.",
    price: 640,
    currency: "USD",
    category: "Outerwear",
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc067748c31?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "Waxed cords",
  },
  {
    id: "4",
    slug: "sanctum-leather-derby",
    name: "Sanctum Leather Derby",
    tagline: "Vegetable-tanned calf",
    description: "Monolithic sole, whisper-quiet step.",
    longDescription:
      "Lasted on an elongated almond toe with a stacked leather heel wrapped in tonal rubber. Lined in bone suede. Patinas uniquely with wear.",
    price: 890,
    currency: "USD",
    category: "Footwear",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d281d8532?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "Hand-burnished toe",
  },
  {
    id: "5",
    slug: "midnight-maquette-coat",
    name: "Midnight Maquette Coat",
    tagline: "Cashmere-wool infusion",
    description: "Floor-skimming silhouette, sculptural collar.",
    longDescription:
      "A cinematic outer layer with exaggerated lapels that can be worn open like a cloak or folded for a sharper line. Magnetic closures hidden along the front.",
    price: 1280,
    currency: "USD",
    category: "Outerwear",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1525450824786-227cbfea31be?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "Horsehair canvassing",
  },
  {
    id: "6",
    slug: "ritual-band-ring",
    name: "Ritual Band Ring",
    tagline: "Sterling silver / obsidian inlay",
    description: "Substantial band with a fractured stone surface.",
    longDescription:
      "Cast and finished by hand in our atelier partnership. Matte silver exterior with fractured obsidian inlay that catches light unpredictably.",
    price: 240,
    currency: "USD",
    category: "Objects",
    images: [
      "https://images.unsplash.com/photo-1611591437281-469bfaea6d9f?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1605100804763-247f67b3517e?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "Numbered edition",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
