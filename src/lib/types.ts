
export type PendingProduct = {
  id: string;
  productName: string;
  description: string;
  imageUrl: string;
  wholesalePrice: number;
  suggestedRetailPrice: number;
  stockLevel: number;
  vendorId: string;
  isApproved: boolean | 'approved' | 'rejected';
  submittedAt: any; // Firestore Timestamp
  categories: string[];
  tags: string[];
};
