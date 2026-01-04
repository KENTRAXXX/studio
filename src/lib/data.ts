export type Product = {
  id: string;
  name: string;
  masterCost: number;
  retailPrice: number;
  stockLevel: number;
  imageId: string;
};

export const masterCatalog: Product[] = [
  { id: 'prod-001', name: 'Aethelred Watch', masterCost: 250, retailPrice: 650, stockLevel: 50, imageId: 'product-1' },
  { id: 'prod-002', name: 'Veridian Handbag', masterCost: 180, retailPrice: 499, stockLevel: 30, imageId: 'product-2' },
  { id: 'prod-003', name: 'Apex Sneakers', masterCost: 120, retailPrice: 350, stockLevel: 100, imageId: 'product-3' },
  { id: 'prod-004', name: 'Noir Elixir', masterCost: 80, retailPrice: 220, stockLevel: 75, imageId: 'product-4' },
  { id: 'prod-005', name: 'Starlight Necklace', masterCost: 400, retailPrice: 1200, stockLevel: 15, imageId: 'product-5' },
  { id: 'prod-006', name: 'Imperial Scarf', masterCost: 60, retailPrice: 180, stockLevel: 60, imageId: 'product-6' },
  { id: 'prod-007', name: 'Monarch Wallet', masterCost: 75, retailPrice: 200, stockLevel: 80, imageId: 'product-7' },
  { id: 'prod-008', name: 'Scribe Fountain Pen', masterCost: 150, retailPrice: 400, stockLevel: 40, imageId: 'product-8' },
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
