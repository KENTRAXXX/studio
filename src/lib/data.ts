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

export type Transaction = {
    date: string;
    description: string;
    amount: number;
    type: 'Sale' | 'Fee' | 'Withdrawal';
};

export const walletTransactions: Transaction[] = [
    { date: '2023-10-26', description: 'Sale Earnings from #SOMA-8432', amount: 150, type: 'Sale' },
    { date: '2023-10-25', description: 'Platform Fee (October)', amount: -29, type: 'Fee' },
    { date: '2023-10-20', description: 'Withdrawal to Bank Account', amount: -1500, type: 'Withdrawal' },
    { date: '2023-10-19', description: 'Sale Earnings from #SOMA-8420', amount: 450, type: 'Sale' },
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
