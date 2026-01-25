
'use client';

import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export function StoreVisitorTracker({ storeId }: { storeId: string }) {
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !storeId || storeId === 'demo') {
      return;
    }

    const sessionKey = `soma-visited-${storeId}`;
    const hasVisited = sessionStorage.getItem(sessionKey);

    if (!hasVisited) {
      const storeRef = doc(firestore, 'stores', storeId);
      updateDoc(storeRef, {
        visitorCount: increment(1)
      }).catch(console.error); // Fire-and-forget, don't block UI

      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [firestore, storeId]);

  return null; // This component renders nothing
}
