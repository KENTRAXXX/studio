/**
 * @fileOverview SOMA Automated Seed Engine.
 * Translates Python generation logic into a high-performance TypeScript utility.
 */

const VAULT: Record<string, [string, [number, number], string][]> = {
    "Home & Kitchen": [
        ["Self-Heating Electric Lunchbox", [35, 75], "Portable 1.5L capacity with 304 stainless steel tray. Includes 110V/24V dual power for home and car use."],
        ["Precision Electric Gooseneck Kettle", [65, 140], "1200W rapid boil with ±1°F temperature control and built-in brew stopwatch for pour-over coffee."],
        ["Dual-Basket Air Fryer", [120, 220], "8-quart capacity with independent cooking zones and 6-in-1 functionality including dehydrate and roast."]
    ],
    "Tech & Accessories": [
        ["Mechanical Keyboard (Hot-Swappable)", [85, 180], "75% layout with gasket mount design and pre-lubed linear switches. RGB backlit with aluminum frame."],
        ["4K Ultra-Wide External Webcam", [50, 130], "90-degree field of view with dual noise-reducing microphones and privacy shutter. Optimized for Zoom and Teams."],
        ["Carbon Fiber Laptop Stand", [25, 60], "Ultra-lightweight foldable design with 6 adjustable height levels for improved ergonomic posture."]
    ],
    "Wellness & Care": [
        ["Smart Body Composition Scale", [30, 85], "Syncs with health apps to track 13 essential metrics including BMI, Body Fat, and Muscle Mass via Bio-impedance."],
        ["Red Light Therapy Wand", [70, 160], "Combines therapeutic warmth, facial massage, and red light to improve skin elasticity and reduce fine lines."],
        ["Deep-Tissue Percussion Massager", [110, 290], "Professional-grade motor with 5 speeds and 14mm amplitude for intense muscle recovery."]
    ],
    "Watches & Apparel": [
        ["Sapphire Crystal Automatic Watch", [180, 550], "Japanese automatic movement with 40-hour power reserve and genuine leather deployment strap."],
        ["Anti-Theft Commuter Backpack", [60, 150], "Water-resistant recycled polyester with hidden zippers, RFID-blocking pockets, and integrated USB charging port."],
        ["Minimalist Bifold Card Holder", [20, 55], "Top-grain Italian leather with a slim 0.4-inch profile and quick-access thumb slot."]
    ],
    "Outdoor & Leisure": [
        ["Insulated 40oz Adventure Tumbler", [25, 55], "Double-wall vacuum insulation keeps drinks cold for 48 hours. Fits standard car cup holders."],
        ["Ultra-Bright 2000LM Headlamp", [30, 75], "Rechargeable LED with motion sensor activation and 5 light modes. IPX6 waterproof for hiking."],
        ["Portable Power Station 240Wh", [180, 350], "Compact lithium battery backup with AC outlet, USB-C PD, and solar charging compatibility."]
    ]
};

export function generateCatalog(numItems: number = 1000) {
    const items = [];
    const categories = Object.keys(VAULT);
    
    for (let i = 1; i <= numItems; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const variants = VAULT[cat];
        const [name, priceBounds, description] = variants[Math.floor(Math.random() * variants.length)];
        
        // Calculate deterministic but random pricing
        const retail = Number((Math.random() * (priceBounds[1] - priceBounds[0]) + priceBounds[0]).toFixed(2));
        // Wholesale is a realistic 40% - 55% of retail
        const wholesale = Number((retail * (Math.random() * (0.55 - 0.40) + 0.40)).toFixed(2));
        
        items.push({
            id: `seed-${String(i).padStart(4, '0')}`,
            name: name,
            description: description,
            masterCost: wholesale,
            retailPrice: retail,
            stockLevel: Math.floor(Math.random() * (250 - 10 + 1) + 10),
            categories: [cat],
            imageId: `demo-${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}-${Math.floor(Math.random() * 10) + 1}`,
            tags: [cat, "Market Leading", "Verified", "Investment Grade"],
            vendorId: "admin",
            productType: "INTERNAL",
            status: "active",
            isActive: true,
            createdAt: new Date().toISOString()
        });
    }
    
    return items;
}
