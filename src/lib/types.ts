
export type PendingProduct = {
  id: string;
  productName: string;
  description: string;
  imageUrl: string;
  imageGallery?: string[];
  wholesalePrice: number;
  suggestedRetailPrice: number;
  stockLevel: number;
  vendorId: string;
  isApproved: boolean | 'approved' | 'rejected';
  submittedAt: any; // Firestore Timestamp
  categories: string[];
  tags: string[];
};

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  storeId: string;
  customerId?: string;
  messages: string[];
  createdAt: any; // Firestore Timestamp or ISO string
};
