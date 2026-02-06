export type Product = {
  id: string;
  name: string;
  description: string;
  masterCost: number;
  retailPrice: number;
  stockLevel: number;
  imageId: string;
  categories: string[];
  tags: string[];
};

export const masterCatalog: Product[] = [
  { 
    id: 'prod-001', 
    name: 'Aethelred Chronograph', 
    description: 'A masterpiece of horological engineering, featuring a brushed titanium casing and a sapphire crystal face. Water-resistant to 100 meters.',
    masterCost: 250, 
    retailPrice: 650, 
    stockLevel: 50, 
    imageId: 'product-1',
    categories: ['Watches'],
    tags: ['Luxury', 'Titanium', 'Precision']
  },
  { 
    id: 'prod-002', 
    name: 'Veridian Suede Handbag', 
    description: 'Hand-stitched from the finest Italian emerald suede, this statement piece features gold-plated hardware and a silk lining.',
    masterCost: 180, 
    retailPrice: 499, 
    stockLevel: 30, 
    imageId: 'product-2',
    categories: ['Leather Goods', 'Accessories'],
    tags: ['Handmade', 'Italian', 'Emerald']
  },
  { 
    id: 'prod-003', 
    name: 'Apex Carbon Sneakers', 
    description: 'The pinnacle of urban luxury. Lightweight carbon-fiber sole with premium calfskin leather uppers. Designed for the global traveler.',
    masterCost: 120, 
    retailPrice: 350, 
    stockLevel: 100, 
    imageId: 'product-3',
    categories: ['Apparel', 'Accessories'],
    tags: ['Urban', 'Calfskin', 'Carbon Fiber']
  },
  { 
    id: 'prod-004', 
    name: 'Noir Night Elixir', 
    description: 'A captivating fragrance with deep notes of sandalwood, amber, and dark chocolate. Bottled in hand-blown smoked glass.',
    masterCost: 80, 
    retailPrice: 220, 
    stockLevel: 75, 
    imageId: 'product-4',
    categories: ['Fragrance', 'Beauty & Skincare'],
    tags: ['Exclusive', 'Amber', 'Sensual']
  },
  { 
    id: 'prod-005', 
    name: 'Starlight Diamond Necklace', 
    description: 'Featuring 3.5 carats of ethically sourced brilliant-cut diamonds set in 18k white gold. A timeless heirloom piece.',
    masterCost: 400, 
    retailPrice: 1200, 
    stockLevel: 15, 
    imageId: 'product-5',
    categories: ['Jewelry'],
    tags: ['Diamond', 'White Gold', 'Heirloom']
  },
  { 
    id: 'prod-006', 
    name: 'Imperial Silk Scarf', 
    description: 'Woven in the tradition of ancient looms, this 100% silk scarf features an intricate hand-painted pattern of royal heritage.',
    masterCost: 60, 
    retailPrice: 180, 
    stockLevel: 60, 
    imageId: 'product-6',
    categories: ['Apparel', 'Accessories'],
    tags: ['Silk', 'Hand-Painted', 'Heritage']
  },
  { 
    id: 'prod-007', 
    name: 'Monarch Exotic Wallet', 
    description: 'Slim-profile bi-fold wallet crafted from sustainable exotic leather. Finished with RFID shielding and hand-burnished edges.',
    masterCost: 75, 
    retailPrice: 200, 
    stockLevel: 80, 
    imageId: 'product-7',
    categories: ['Leather Goods', 'Accessories'],
    tags: ['Minimalist', 'RFID', 'Exotic']
  },
  { 
    id: 'prod-008', 
    name: 'Scribe Gold Fountain Pen', 
    description: 'The executive writing instrument. Features a 14k gold nib and a marble resin barrel. Perfectly balanced for the strategic mind.',
    masterCost: 150, 
    retailPrice: 400, 
    stockLevel: 40, 
    imageId: 'product-8',
    categories: ['Accessories', 'Collectibles'],
    tags: ['Executive', 'Gold Nib', 'Resin']
  },
  { 
    id: 'prod-009', 
    name: 'Obsidian Smart Vision', 
    description: 'The future of wearable tech. Augmented reality glasses disguised as designer frames. Bone-conduction audio and 12hr battery life.',
    masterCost: 110, 
    retailPrice: 328, 
    stockLevel: 45, 
    imageId: 'demo-gadget-1',
    categories: ['Electronics'],
    tags: ['AR', 'Smart Tech', 'Designer']
  },
  { 
    id: 'prod-010', 
    name: 'Luxe Traveler Weekender', 
    description: 'Spacious yet compliant. Full-grain pebble leather with a dedicated compartment for fine footwear. The essential weekend companion.',
    masterCost: 220, 
    retailPrice: 550, 
    stockLevel: 25, 
    imageId: 'demo-fashion-1',
    categories: ['Leather Goods', 'Travel Gear'],
    tags: ['Leather', 'Weekender', 'Jetset']
  }
];

export type StorefrontProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageId: string;
}
export const storefrontData: StorefrontProduct[] = [
    { id: 'sf-001', name: 'Aethelred Watch', price: 650.00, description: 'An exquisite timepiece blending classic design with modern mechanics.', imageId: 'product-1'},
    { id: 'sf-002', name: 'Veridian Handbag', price: 499.00, description: 'A statement piece, crafted from the finest vegan leather.', imageId: 'product-2'},
    { id: 'sf-003', name: 'Apex Sneakers', price: 350.00, description: 'Ultimate comfort meets high-fashion. Perfect for the urban explorer.', imageId: 'product-3'},
    { id: 'sf-004', name: 'Noir Elixir', price: 220.00, description: 'A captivating fragrance with notes of sandalwood and dark chocolate.', imageId: 'product-4'},
];
