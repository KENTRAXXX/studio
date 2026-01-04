'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ShoppingCart, X, Loader2 } from 'lucide-react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import SomaLogo from '@/components/logo';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { storefrontData, type StorefrontProduct } from '@/lib/data';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

type CartItem = {
  product: any; // Using 'any' as product structure might vary
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

export function CartProvider({ children }: { children: React.ReactNode }) {
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
                <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary/20 hover:text-primary">
                    <ShoppingCart className="h-6 w-6" />
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
                                                <Image src={getPlaceholderImage(item.product.imageId)?.imageUrl || ''} alt={item.product.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{item.product.name}</h3>
                                                <p className="text-sm text-muted-foreground">${price.toFixed(2)} x {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold">${(price * item.quantity).toFixed(2)}</p>
                                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
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
                                    <span>${getCartTotal().toFixed(2)}</span>
                                </div>
                                <Button asChild className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Link href={`/store/${storeId}/checkout`}>Checkout</Link>
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


export default function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeId: string };
}) {
  const firestore = useFirestore();
  const storeRef = firestore ? doc(firestore, 'stores', params.storeId) : null;
  const { data: storeData, loading: storeLoading } = useDoc(storeRef);
  
  const storeName = storeData?.storeName || "SOMA Store";
  const logoUrl = storeData?.logoUrl;

  return (
    <CartProvider>
        <div className="min-h-screen bg-background text-foreground font-body">
          <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b border-primary/20">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href={`/store/${params.storeId}`} className="flex items-center gap-2">
                {storeLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : logoUrl ? (
                    <Image src={logoUrl} alt={storeName} width={40} height={40} className="rounded-full" data-ai-hint="logo" />
                ) : (
                    <SomaLogo className="h-8 w-8" />
                )}
                <span className="font-headline text-2xl font-bold text-primary">{storeLoading ? 'Loading...' : storeName}</span>
              </Link>
              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    placeholder="Search products..."
                    className="h-10 w-full rounded-md border border-primary/30 bg-transparent pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:ring-primary"
                  />
                </div>
                <CartSheet storeId={params.storeId} />
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="bg-card border-t border-primary/20">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-8 px-4 sm:flex-row sm:px-6 lg:px-8">
              <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {storeName}. All Rights Reserved.</p>
              <div className="flex gap-6">
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link>
              </div>
            </div>
          </footer>
        </div>
    </CartProvider>
  );
}
