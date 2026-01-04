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

export const storefrontProducts = [
  { id: 'sf-001', name: 'Elysian Chair', price: 1250.00, imageId: 'storefront-product-1' },
  { id: 'sf-002', name: 'Terran Vase Set', price: 380.00, imageId: 'storefront-product-2' },
  { id: 'sf-003', name: 'Chronos Minimalist', price: 890.00, imageId: 'storefront-product-3' },
  { id: 'sf-004', name: 'The Cartographer', price: 210.00, imageId: 'storefront-product-4' },
];

export type Order = {
    date: string;
    orderId: string;
    customerEmail: string;
    totalAmount: number;
    fulfillmentStatus: 'Processing' | 'Shipped' | 'Delivered';
};

export const myOrders: Order[] = [
    { date: '2023-10-26', orderId: '#SOMA-8432', customerEmail: 'jane.doe@example.com', totalAmount: 400, fulfillmentStatus: 'Processing'},
    { date: '2023-10-25', orderId: '#SOMA-8431', customerEmail: 'john.smith@example.com', totalAmount: 1200, fulfillmentStatus: 'Shipped'},
    { date: '2023-10-23', orderId: '#SOMA-8429', customerEmail: 'emily.white@example.com', totalAmount: 650, fulfillmentStatus: 'Delivered'},
    { date: '2023-10-22', orderId: '#SOMA-8428', customerEmail: 'michael.brown@example.com', totalAmount: 220, fulfillmentStatus: 'Delivered'},
];

export type StoreOwner = {
    id: string;
    name: string;
    email: string;
    storeUrl: string;
    status: 'Active' | 'Inactive';
};

export const storeOwners: StoreOwner[] = [
    { id: 'user_1', name: 'Alice Johnson', email: 'alice.j@e-com.co', storeUrl: 'alicej.soma.com', status: 'Active' },
    { id: 'user_2', name: 'Bob Williams', email: 'bob.w@e-com.co', storeUrl: 'bobw.soma.com', status: 'Active' },
    { id: 'user_3', name: 'Charlie Davis', email: 'charlie.d@e-com.co', storeUrl: 'charlied.soma.com', status: 'Inactive' },
    { id: 'user_4', name: 'Diana Miller', email: 'diana.m@e-com.co', storeUrl: 'dianam.soma.com', status: 'Active' },
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

export type TrainingVideo = {
  id: string;
  title: string;
  duration: number;
  category: 'The Foundation: Setting up your Brand' | 'Traffic Secrets: Mastering TikTok & IG Ads' | 'Conversion: Turning Visitors into Buyers';
  thumbnailId: string;
};

export const trainingVideos: TrainingVideo[] = [
  { id: 'vid-001', title: 'Crafting Your Brand Identity', duration: 12, category: 'The Foundation: Setting up your Brand', thumbnailId: 'training-thumb-1' },
  { id: 'vid-002', title: 'Launch Wizard Deep Dive', duration: 8, category: 'The Foundation: Setting up your Brand', thumbnailId: 'training-thumb-2' },
  { id: 'vid-003', title: 'Connecting a Custom Domain', duration: 5, category: 'The Foundation: Setting up your Brand', thumbnailId: 'training-thumb-3' },
  { id: 'vid-004', title: 'Your First TikTok Ad Campaign', duration: 18, category: 'Traffic Secrets: Mastering TikTok & IG Ads', thumbnailId: 'training-thumb-4' },
  { id: 'vid-005', title: 'Secrets of the Instagram Algorithm', duration: 22, category: 'Traffic Secrets: Mastering TikTok & IG Ads', thumbnailId: 'training-thumb-5' },
  { id: 'vid-006', title: 'Analyzing Your Ad Performance', duration: 10, category: 'Traffic Secrets: Mastering TikTok & IG Ads', thumbnailId: 'training-thumb-6' },
  { id: 'vid-007', title: 'Optimizing Product Pages for Sales', duration: 15, category: 'Conversion: Turning Visitors into Buyers', thumbnailId: 'training-thumb-7' },
  { id: 'vid-008', title: 'The Psychology of Luxury Pricing', duration: 13, category: 'Conversion: Turning Visitors into Buyers', thumbnailId: 'training-thumb-8' },
];
