'use client';

import { useState, createContext, useContext, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, ShoppingCart, X, Loader2, Mail, Instagram, Twitter, MessageSquare } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, limit, or } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import SomaLogo from '@/components/logo';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/format';

type CartItem = {
  product: any;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  getCartTotal: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: React.PropsWithChildren<{}>['children'] }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
        const price = item.product.suggestedRetailPrice || item.product.price;
        return total + price * item.quantity;
    }, 0);
  };
  
  const value = { cart, addToCart, removeFromCart, getCartTotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}


const getPlaceholderImage = (id: string): ImagePlaceholder | undefined => {
    return PlaceHolderImages.find(img => img.id === id);
}

function CartSheet({storeId}: {storeId: string}) {
    const { cart, removeFromCart, getCartTotal } = useCart();
    
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-primary hover:bg-primary/20">
                    <ShoppingCart className="h-6 w-6" aria-label={`Shopping Cart, ${cart.reduce((acc, item) => acc + item.quantity, 0)} items`} />
                    {cart.length > 0 && (
                        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-background border-primary/20">
                <SheetHeader>
                    <SheetTitle className="text-primary font-headline text-2xl">My Cart</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full py-4">
                    {cart.length > 0 ? (
                        <>
                            <div className="flex-1 overflow-y-auto pr-4">
                                <ul className="space-y-4">
                                    {cart.map(item => {
                                        const price = item.product.suggestedRetailPrice || item.product.price;
                                        return (
                                        <li key={item.product.id} className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 rounded-md overflow-hidden border border-primary/20">
                                                <Image src={getPlaceholderImage(item.product.imageId)?.imageUrl || item.product.imageUrl || ''} alt={item.product.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{item.product.name}</h3>
                                                <p className="text-sm text-muted-foreground">{formatCurrency(Math.round(price * 100))} x {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold">{formatCurrency(Math.round(price * item.quantity * 100))}</p>
                                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)} aria-label={`Remove ${item.product.name} from cart`}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    )})}
                                </ul>
                            </div>
                            <Separator className="my-4 bg-primary/20" />
                            <div className="space-y-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(Math.round(getCartTotal() * 100))}</span>
                                </div>
                                <Button asChild className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Link href={storeId ? `/store/${storeId}/checkout` : '/checkout'}>Checkout</Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">Your cart is empty</h3>
                            <p className="text-muted-foreground">Add some products to get started.</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ContactSheet({ ownerEmail, trigger }: { ownerEmail?: string, trigger?: React.ReactNode }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger || <Button variant="link" className="text-sm text-muted-foreground hover:text-primary p-0 h-auto">Contact Us</Button>}
            </SheetTrigger>
            <SheetContent className="bg-background border-primary/20">
                <SheetHeader>
                    <SheetTitle className="text-primary font-headline text-2xl">Boutique Support</SheetTitle>
                </SheetHeader>
                <div className="py-8 text-center space-y-6">
                     <Mail className="h-12 w-12 text-primary mx-auto" aria-hidden="true" />
                     <div className="space-y-2">
                        <h3 className="font-bold text-lg text-slate-200 uppercase tracking-widest">Strategic Inquiry</h3>
                        <p className="text-sm text-muted-foreground">Direct access to the curator of this boutique.</p>
                        <div className="pt-4">
                            <a 
                                href={ownerEmail ? `mailto:${ownerEmail}` : '#'} 
                                className="inline-flex items-center gap-2 font-bold text-primary text-lg hover:underline decoration-primary/30"
                            >
                                {ownerEmail || (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Resolving Curator...</span>
                                    </div>
                                )}
                            </a>
                        </div>
                     </div>
                     <Separator className="my-4 bg-primary/10"/>
                     <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 italic text-[10px] text-slate-500 leading-relaxed">
                        <p>Our curation team typically responds to premium inquiries within 24 business hours.</p>
                     </div>
                     <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] pt-8">
                        <p>Powered by <span className="font-black text-primary">SOMA Executive</span></p>
                     </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}


export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const identifier = (params.storeId || params.domain || params.site) as string;
  const firestore = useFirestore();

  // Robust Boutique Resolution: Normalizes hostnames and UIDs for theme and owner context
  const storeQuery = useMemoFirebase(() => {
    if (!firestore || !identifier) return null;
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const normalized = identifier.toLowerCase().replace(`.${rootDomain}`, '').replace('www.', '');

    return query(
        collection(firestore, 'stores'),
        or(
            where('userId', '==', identifier), // Case-sensitive UID check
            where('userId', '==', normalized),
            where('customDomain', '==', identifier.toLowerCase()),
            where('slug', '==', normalized)
        ),
        limit(1)
    );
  }, [firestore, identifier]);

  const { data: storeDocs, loading: storeLoading } = useCollection<any>(storeQuery);
  const storeData = storeDocs?.[0];
  const storeId = storeData?.userId;
  
  const ownerRef = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return doc(firestore, 'users', storeId);
  }, [firestore, storeId]);
  const { data: ownerData } = useDoc<any>(ownerRef);

  const storeName = storeData?.storeName || "Boutique";
  const logoUrl = storeData?.logoUrl;
  const themeColors = storeData?.themeConfig?.colors;

  // Luxury Contrast Protocol: Ensures high readability across all themes
  const customStyles = useMemo(() => {
    if (!themeColors) return {};
    
    // Determine if the background is "Light" or "Dark" based on standard theme IDs
    const isLightBackground = storeData?.themeConfig?.id === 'ivory';
    
    return {
        '--primary': themeColors.primary,
        '--background': themeColors.background,
        '--card': themeColors.background,
        '--accent': themeColors.accent,
        '--ring': themeColors.primary,
        '--border': `hsl(${themeColors.primary} / 0.2)`,
        // Contrast Logic
        '--foreground': isLightBackground ? '0 0% 10%' : '0 0% 90%',
        '--primary-foreground': isLightBackground ? '0 0% 100%' : '0 0% 5%',
    } as React.CSSProperties;
  }, [themeColors, storeData?.themeConfig?.id]);

  const socials = ownerData?.socials;

  return (
    <CartProvider>
        <div 
            className="min-h-screen bg-background text-foreground font-body selection:bg-primary/30"
            style={customStyles}
        >
          <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b border-primary/20">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href={identifier ? (params.domain ? '/' : `/store/${identifier}`) : '/'} className="flex items-center gap-2 group">
                {storeLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : logoUrl ? (
                    <div className="relative h-10 w-auto">
                        <img src={logoUrl} alt={storeName} className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
                    </div>
                ) : (
                    <SomaLogo className="h-8 w-8 text-primary" aria-hidden="true" />
                )}
                <h1 className="font-headline text-2xl font-bold text-primary tracking-tighter transition-colors group-hover:text-primary/80">
                    {storeLoading ? 'Loading...' : storeName}
                </h1>
              </Link>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    placeholder="Search products..."
                    aria-label="Search products"
                    className="h-10 w-full min-w-[200px] rounded-md border border-primary/30 bg-transparent pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:ring-primary"
                  />
                </div>
                
                <ContactSheet 
                    ownerEmail={ownerData?.email} 
                    trigger={
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/20">
                            <MessageSquare className="h-6 w-6" />
                        </Button>
                    }
                />
                
                <CartSheet storeId={storeId} />
              </div>
            </div>
          </header>
          <main id="main-content" className="animate-in fade-in duration-700" tabIndex={-1}>{children}</main>
          <footer className="bg-card border-t border-primary/10">
            <div className="container mx-auto flex flex-col items-center justify-between gap-6 py-12 px-4 sm:flex-row sm:px-6 lg:px-8">
              <div className="space-y-4 text-center sm:text-left">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {storeName}. All Rights Reserved.</p>
                {socials && (
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                        {socials.instagram && (
                            <Link href={`https://instagram.com/${socials.instagram}`} target="_blank" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Visit our Instagram">
                                <Instagram className="h-5 w-5" />
                            </Link>
                        )}
                        {socials.tiktok && (
                            <Link href={`https://tiktok.com/@${socials.tiktok}`} target="_blank" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Visit our TikTok">
                                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.83 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.33 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
                            </Link>
                        )}
                        {socials.x && (
                            <Link href={`https://x.com/${socials.x}`} target="_blank" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Visit our X (Twitter)">
                                <Twitter className="h-5 w-5" />
                            </Link>
                        )}
                    </div>
                )}
              </div>
              <div className="flex gap-6">
                <Link href="/legal/terms" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
                <ContactSheet ownerEmail={ownerData?.email}/>
              </div>
            </div>
          </footer>
        </div>
    </CartProvider>
  );
}
