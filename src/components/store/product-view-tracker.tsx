
'use client';

import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export function ProductViewTracker({ storeId, productId }: { storeId: string; productId: string }) {
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !storeId || storeId === 'demo' || !productId) {
      return;
    }

    const sessionKey = `soma-viewed-${productId}-${storeId}`;
    const hasViewed = sessionStorage.getItem(sessionKey);

    if (!hasViewed) {
      // 1. Update Global Store Metric
      const storeRef = doc(firestore, 'stores', storeId);
      updateDoc(storeRef, {
        productViewCount: increment(1)
      }).catch(console.error);

      // 2. Update Specific Product Metric
      const productRef = doc(firestore, 'stores', storeId, 'products', productId);
      updateDoc(productRef, {
        viewCount: increment(1)
      }).catch(console.error);

      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [firestore, storeId, productId]);

  return null;
}
