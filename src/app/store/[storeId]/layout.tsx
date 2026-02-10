'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, ShoppingCart, X, Loader2, Mail, Instagram, Twitter, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { doc, collection, query, where, limit, or, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SomaLogo from '@/components/logo';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/format';
import { useToast } from '@/hooks/use-toast';
import { sendSupportTicketCustomerEmail } from '@/ai/flows/send-support-ticket-customer-email';
import { sendSupportTicketOwnerEmail } from '@/ai/flows/send-support-ticket-owner-email';

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

function ContactSheet({ storeId, storeName, ownerEmail, trigger }: { storeId: string, storeName: string, ownerEmail?: string, trigger?: React.ReactNode }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !storeId) return;

        setIsSubmitting(true);
        try {
            const bundledMessage = `Customer: ${name}\nEmail: ${email}\n\n${message}`;
            
            const ticketsRef = collection(firestore, 'stores', storeId, 'supportTickets');
            const ticketDoc = await addDoc(ticketsRef, {
                subject,
                message: bundledMessage,
                status: 'OPEN',
                storeId,
                customerId: user?.uid || null,
                messages: [bundledMessage],
                createdAt: serverTimestamp(),
            });

            // Trigger Notifications
            const storeUrl = typeof window !== 'undefined' ? window.location.origin : `https://somatoday.com/store/${storeId}`;
            
            await sendSupportTicketCustomerEmail({
                to: email,
                customerName: name,
                storeName: storeName,
                ticketId: ticketDoc.id,
                storeUrl: storeUrl
            });

            if (ownerEmail) {
                await sendSupportTicketOwnerEmail({
                    to: ownerEmail,
                    customerName: name,
                    customerEmail: email,
                    subject: subject,
                    storeName: storeName
                });
            }

            setIsSuccess(true);
            toast({
                title: 'Inquiry Dispatched',
                description: 'Your strategic request has been logged in the boutique registry.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Transmission Failed',
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet onOpenChange={(open) => !open && setIsSuccess(false)}>
            <SheetTrigger asChild>
                {trigger || <Button variant="link" className="text-sm text-muted-foreground hover:text-primary p-0 h-auto">Contact Us</Button>}
            </SheetTrigger>
            <SheetContent className="bg-background border-primary/20 sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="text-primary font-headline text-2xl">Boutique Support</SheetTitle>
                </SheetHeader>
                
                {isSuccess ? (
                    <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-200">Request Logged</h3>
                            <p className="text-sm text-muted-foreground">The boutique curator has been notified. Check your email for a reference ID.</p>
                        </div>
                        <Button variant="outline" onClick={() => setIsSuccess(false)} className="border-primary/20">Send Another</Button>
                    </div>
                ) : (
                    <div className="py-8 space-y-8">
                        <div className="text-center space-y-2">
                            <Mail className="h-12 w-12 text-primary mx-auto opacity-50" aria-hidden="true" />
                            <h3 className="font-bold text-lg text-slate-200 uppercase tracking-widest">Strategic Inquiry</h3>
                            <p className="text-xs text-muted-foreground">Your request will be recorded in the store's executive ledger.</p>
                        </div>

                        <form onSubmit={handleSubmitTicket} className="space-y-4">
                            {!user && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Your Name</label>
                                        <Input 
                                            placeholder="John Doe" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="bg-primary/5 border-primary/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email Address</label>
                                        <Input 
                                            type="email"
                                            placeholder="john@example.com" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-primary/5 border-primary/10"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Subject</label>
                                <Input 
                                    placeholder="e.g., Private Viewing Request" 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    className="bg-primary/5 border-primary/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Detailed Message</label>
                                <Textarea 
                                    placeholder="Please provide specifics regarding your inquiry..." 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="min-h-[150px] bg-primary/5 border-primary/10 resize-none"
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full h-12 btn-gold-glow bg-primary font-bold">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                                Transmit Inquiry
                            </Button>
                        </form>

                        <Separator className="my-4 bg-primary/10"/>
                        
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Boutique Authority</p>
                            <p className="text-sm font-bold text-primary mt-1">{storeName}</p>
                        </div>
                    </div>
                )}
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

  const storeQuery = useMemoFirebase(() => {
    if (!firestore || !identifier) return null;
    
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const normalizedIdentifier = identifier.toLowerCase();
    
    let slug = normalizedIdentifier;
    if (normalizedIdentifier.endsWith(`.${rootDomain}`)) {
        slug = normalizedIdentifier.replace(`.${rootDomain}`, '');
    }
    if (slug.startsWith('www.')) {
        slug = slug.replace('www.', '');
    }

    return query(
        collection(firestore, 'stores'),
        or(
            where('userId', '==', slug),
            where('customDomain', '==', normalizedIdentifier),
            where('slug', '==', slug)
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
  const contactEmail = storeData?.contactEmail || ownerData?.email;

  const customStyles = themeColors ? {
    '--primary': themeColors.primary,
    '--background': themeColors.background,
    '--card': themeColors.background,
    '--accent': themeColors.accent,
    '--ring': themeColors.primary,
    '--border': `hsl(${themeColors.primary} / 0.2)`,
  } as React.CSSProperties : {};

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
                
                {storeId && (
                    <ContactSheet 
                        storeId={storeId}
                        storeName={storeName}
                        ownerEmail={contactEmail} 
                        trigger={
                            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/20">
                                <MessageSquare className="h-6 w-6" />
                            </Button>
                        }
                    />
                )}
                
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
                {storeId && <ContactSheet storeId={storeId} storeName={storeName} ownerEmail={contactEmail}/>}
              </div>
            </div>
          </footer>
        </div>
    </CartProvider>
  );
}
