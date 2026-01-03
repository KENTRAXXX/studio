import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ShoppingCart } from 'lucide-react';
import { storefrontProducts } from '@/lib/data';
import { Input } from '@/components/ui/input';

const StorefrontHeader = () => (
  <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 items-center">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
        <span className="font-bold font-headline text-foreground">SOMA STORE</span>
      </Link>
      <div className="flex-1 items-center space-x-4 hidden md:flex">
         <div className="relative w-full max-w-sm">
            <Input type="search" placeholder="Search products..." className="pl-10" />
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
          </div>
      </div>
      <div className="flex flex-1 items-center justify-end space-x-4">
        <nav className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="sr-only">Shopping Cart</span>
          </Button>
           <Button asChild className="hidden md:inline-flex">
             <Link href="/dashboard">Dashboard</Link>
           </Button>
        </nav>
      </div>
    </div>
  </header>
);

const StorefrontFooter = () => (
    <footer className="border-t border-primary/20">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                <p className="text-center text-sm leading-loose md:text-left text-muted-foreground">
                    Built by SOMA. The future of luxury e-commerce.
                </p>
            </div>
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                <Link href="#" className="hover:text-primary">Contact Us</Link>
            </div>
        </div>
    </footer>
);


export default function StorefrontHome() {
  const heroImage = PlaceHolderImages.find(img => img.id === "storefront-hero");

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="container relative flex h-full flex-col items-center justify-center text-center text-white">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-headline text-primary">
                    Curated Luxury
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-300 sm:text-xl">
                    Discover exclusive pieces, hand-selected for the discerning collector.
                </p>
                <Button size="lg" className="mt-8 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                    Shop The Collection
                </Button>
            </div>
        </section>

        <section className="py-12 md:py-24">
            <div className="container">
                <h2 className="mb-8 text-3xl font-bold text-center font-headline text-foreground">Featured Products</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {storefrontProducts.map((product) => {
                       const productImage = PlaceHolderImages.find(p => p.id === product.imageId);
                       return (
                        <Card key={product.id} className="overflow-hidden bg-card border-primary/20 hover:border-primary transition-all duration-300 group">
                           <CardContent className="p-0">
                            <div className="relative aspect-[4/5] w-full">
                                {productImage && (
                                     <Image
                                        src={productImage.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={productImage.imageHint}
                                     />
                                )}
                            </div>
                            <div className="p-4">
                               <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                               <p className="text-primary font-bold mt-2 text-xl">${product.price.toFixed(2)}</p>
                               <Button className="w-full mt-4 bg-primary/10 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 btn-gold-glow">
                                   Add to Cart
                               </Button>
                            </div>
                           </CardContent>
                        </Card>
                       )
                    })}
                </div>
            </div>
        </section>
      </main>
      <StorefrontFooter />
    </div>
  );
}
