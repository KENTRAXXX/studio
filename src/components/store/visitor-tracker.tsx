
'use client';

import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function StoreVisitorTracker({ storeId }: { storeId: string }) {
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !storeId || storeId === 'demo') {
      return;
    }

    const sessionKey = `soma-visited-${storeId}`;
    const hasVisited = sessionStorage.getItem(sessionKey);

    if (!hasVisited) {
      // 1. Increment total count
      const storeRef = doc(firestore, 'stores', storeId);
      updateDoc(storeRef, {
        visitorCount: increment(1)
      }).catch(console.error);

      // 2. Detect and log traffic source
      const detectSource = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref')?.toLowerCase();
        
        if (refParam === 'ig') return 'Instagram';
        if (refParam === 'tt') return 'TikTok';
        if (refParam === 'x') return 'X (Twitter)';
        if (refParam === 'fb') return 'Facebook';
        
        const referrer = document.referrer.toLowerCase();
        if (referrer.includes('instagram.com')) return 'Instagram';
        if (referrer.includes('tiktok.com')) return 'TikTok';
        if (referrer.includes('t.co') || referrer.includes('twitter.com')) return 'X (Twitter)';
        if (referrer.includes('facebook.com')) return 'Facebook';
        if (referrer.includes('google.com')) return 'Google';
        
        return 'Direct';
      };

      const source = detectSource();
      const trafficLogsRef = collection(firestore, 'stores', storeId, 'traffic_logs');
      
      addDoc(trafficLogsRef, {
        source,
        timestamp: serverTimestamp(),
      }).catch(console.error);

      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [firestore, storeId]);

  return null;
}
