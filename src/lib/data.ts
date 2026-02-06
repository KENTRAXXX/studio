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
  },
  {
    id: 'prod-011',
    name: 'Aetherial Glass Decanter',
    description: 'Hand-blown by artisans in Murano, this crystalline decanter features a gold-leaf stopper and a weighted base for perfect aeration.',
    masterCost: 95,
    retailPrice: 285,
    stockLevel: 40,
    imageId: 'product-4',
    categories: ['Spirits & Wine', 'Home Decor'],
    tags: ['Murano', 'Gold Leaf', 'Artisan']
  },
  {
    id: 'prod-012',
    name: 'Zenith Marble Coffee Table',
    description: 'A single slab of Calacatta gold marble suspended on a minimalist steel frame. Each piece features unique natural veining.',
    masterCost: 450,
    retailPrice: 1450,
    stockLevel: 10,
    imageId: 'storefront-product-1',
    categories: ['Furniture', 'Home Decor'],
    tags: ['Marble', 'Minimalist', 'Calacatta']
  },
  {
    id: 'prod-013',
    name: 'Solaris 4K Audio Array',
    description: 'Immersive soundscapes delivered via 12 precision-tuned drivers. Encased in reclaimed oak with a touch-sensitive interface.',
    masterCost: 320,
    retailPrice: 899,
    stockLevel: 35,
    imageId: 'demo-gadget-2',
    categories: ['Electronics'],
    tags: ['Audio', 'Oak', 'Smart Home']
  },
  {
    id: 'prod-014',
    name: 'Vanguard Cashmere Coat',
    description: 'Double-breasted excellence. 100% Loro Piana cashmere with hand-sewn buttonholes and a structured silhouette.',
    masterCost: 550,
    retailPrice: 1800,
    stockLevel: 20,
    imageId: 'demo-fashion-2',
    categories: ['Apparel'],
    tags: ['Cashmere', 'Loro Piana', 'Executive']
  },
  {
    id: 'prod-015',
    name: 'Dynasty Jade Cufflinks',
    description: 'Rare imperial green jade set in 24k gold. A subtle nod to heritage and enduring power.',
    masterCost: 120,
    retailPrice: 450,
    stockLevel: 50,
    imageId: 'demo-jewelry-2',
    categories: ['Jewelry', 'Accessories'],
    tags: ['Jade', 'Gold', 'Heritage']
  },
  {
    id: 'prod-016',
    name: 'Eclipse Matte Gin',
    description: 'Small-batch botanical gin with hints of yuzu and black pepper. Bottled in a signature matte black ceramic flask.',
    masterCost: 45,
    retailPrice: 125,
    stockLevel: 100,
    imageId: 'product-4',
    categories: ['Spirits & Wine'],
    tags: ['Small Batch', 'Botanical', 'Ceramic']
  },
  {
    id: 'prod-017',
    name: 'Prism Light Sculpture',
    description: 'Interactive lighting that reacts to the time of day. Features dichroic glass panels that cast evolving color spectrums.',
    masterCost: 280,
    retailPrice: 750,
    stockLevel: 15,
    imageId: 'storefront-product-2',
    categories: ['Fine Art', 'Home Decor'],
    tags: ['Interactive', 'Light', 'Modern']
  },
  {
    id: 'prod-018',
    name: 'Nomad Carbon Fiber Bike',
    description: 'Ultra-lightweight frame designed for the urban elite. Integrated GPS and electronic shifting. Weight: 6.8kg.',
    masterCost: 1200,
    retailPrice: 3800,
    stockLevel: 5,
    imageId: 'demo-gadget-1',
    categories: ['Automotive', 'Electronics'],
    tags: ['Carbon Fiber', 'GPS', 'High Performance']
  },
  {
    id: 'prod-019',
    name: 'Origin Cold-Pressed Honey',
    description: 'Harvested from a single remote grove in the Highlands. Unfiltered, enzyme-rich, and packaged in a limited edition stoneware crock.',
    masterCost: 25,
    retailPrice: 85,
    stockLevel: 200,
    imageId: 'product-4',
    categories: ['Gourmet Food'],
    tags: ['Organic', 'Highlands', 'Limited']
  },
  {
    id: 'prod-020',
    name: 'Oracle Smart Mirror',
    description: 'Vanity redefined. Integrated skin-health analysis and professional lighting control. Disappears into a standard mirror when inactive.',
    masterCost: 350,
    retailPrice: 950,
    stockLevel: 30,
    imageId: 'demo-gadget-2',
    categories: ['Electronics', 'Beauty & Skincare'],
    tags: ['Smart Mirror', 'Analysis', 'Vanity']
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
