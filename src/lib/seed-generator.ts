/**
 * @fileOverview SOMA Automated Seed Engine.
 * Translates Python generation logic into a high-performance TypeScript utility.
 */

const VAULT: Record<string, [string, [number, number], string][]> = {
    "Watches": [
        ["Sapphire Crystal Automatic Watch", [180, 550], "Japanese automatic movement with 40-hour power reserve and genuine leather deployment strap."],
        ["Titanium Precision Chronograph", [350, 950], "Lightweight aerospace-grade titanium with a ceramic bezel and sapphire crystal."]
    ],
    "Leather Goods": [
        ["Italian Grain Leather Briefcase", [250, 600], "Hand-stitched full-grain leather with a dedicated 16-inch laptop compartment and silk lining."],
        ["Minimalist Bifold Card Holder", [20, 55], "Top-grain Italian leather with a slim 0.4-inch profile and quick-access thumb slot."]
    ],
    "Jewelry": [
        ["1.0ct Diamond Stud Earrings", [1500, 4500], "Certified brilliant-cut diamonds set in 18k white gold. SOMA authenticity guaranteed."],
        ["Solid Gold Curb Chain", [600, 1800], "Hand-finished 14k yellow gold links with a high-polish shine and heavy-duty lobster clasp."]
    ],
    "Home Decor": [
        ["Hand-Carved Carrara Marble Bowl", [120, 350], "Unique organic edges carved from a single slab of Italian marble. A definitive centerpiece."],
        ["Artisan Crystal Decanter Set", [180, 450], "Mouth-blown crystal decanter with four matching tumblers, designed for optimal aeration."]
    ],
    "Wellness": [
        ["Professional Deep-Tissue Massager", [110, 290], "High-torque brushless motor with 6 interchangeable heads for targeted muscle recovery."],
        ["Smart Health & Metrics Scale", [30, 85], "Bio-impedance analysis tracking 13 essential metrics with cloud-synced app support."]
    ],
    "Apparel": [
        ["Mongolian Cashmere Throw", [150, 400], "100% sustainable cashmere woven for unparalleled softness and warmth in a neutral palette."],
        ["Hand-Printed Silk Scarf", [80, 220], "Mulberry silk featuring a bespoke geometric pattern with hand-rolled edges."]
    ],
    "Electronics": [
        ["Gasket-Mount Mechanical Keyboard", [85, 180], "Hot-swappable linear switches with a precision-milled aluminum frame and RGB backlighting."],
        ["Reference-Grade ANC Headphones", [250, 550], "Advanced active noise cancellation with 40mm high-fidelity drivers and 40-hour battery life."]
    ],
    "Fine Art": [
        ["Limited Edition Signed Lithograph", [300, 1200], "Contemporary abstract composition numbered and signed by the artist. Includes COA."],
        ["Modernist Bronze Desk Sculpture", [400, 1500], "Hand-cast bronze figure with a natural volcanic rock base. Part of a limited signature series."]
    ],
    "Travel Gear": [
        ["Executive Anti-Theft Backpack", [60, 150], "Water-resistant tech fabric with hidden zippers, RFID shielding, and integrated USB-C charging."],
        ["Japanese Hard-Shell Carry-On", [200, 450], "Aerospace polycarbonate shell with silent-spin dual wheels and integrated TSA-approved locks."]
    ],
    "Collectibles": [
        ["Graded Vintage Comic Book", [500, 2500], "Pristine CGC-certified golden age issue. A blue-chip collectible for the serious curator."],
        ["Investment-Grade Gold Coin", [800, 2200], "Historically significant currency asset in near-mint condition. Authenticity verified by SOMA."]
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
