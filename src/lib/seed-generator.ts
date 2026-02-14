/**
 * @fileOverview SOMA Automated Seed Engine.
 * Translates Python generation logic into a high-performance TypeScript utility.
 * Features a deep vault of 200 luxury blueprints across 20 elite categories.
 */

const VAULT: Record<string, [string, [number, number], string][]> = {
    "Watches": [
        ["Sapphire Crystal Automatic Watch", [180, 550], "Japanese automatic movement with 40-hour power reserve and genuine leather deployment strap."],
        ["Titanium Precision Chronograph", [350, 950], "Lightweight aerospace-grade titanium with a ceramic bezel and sapphire crystal."],
        ["Deep-Sea Professional Diver", [450, 1200], "Helium escape valve, 300m water resistance, and luminous indices for absolute clarity."],
        ["Executive GMT Dual-Time", [280, 750], "Track two time zones simultaneously with a dedicated red hand and bi-directional bezel."],
        ["Minimalist Bauhaus Dress Watch", [120, 350], "Ultra-slim profile with a clean dial and Milanese mesh bracelet. Timeless elegance."],
        ["Aviator Pilot Chronograph", [220, 600], "Large legible dial with slide rule markings and oversized crown for gloved operation."],
        ["Skeleton Mechanical Masterpiece", [800, 2500], "Intricate open-heart movement exposing the gold-plated gears and escapement."],
        ["Solar-Powered Explorer", [95, 280], "Eco-friendly movement charged by any light source with a high-impact composite case."],
        ["Heritage Manual-Wind Timepiece", [550, 1800], "Classic manual caliber with a vintage-inspired domed crystal and sunburst dial."],
        ["Digital Luxury Command", [150, 450], "Smart-integrated digital interface with a traditional stainless steel aesthetic."]
    ],
    "Leather Goods": [
        ["Italian Grain Leather Briefcase", [250, 600], "Hand-stitched full-grain leather with a dedicated 16-inch laptop compartment and silk lining."],
        ["Minimalist Bifold Card Holder", [20, 55], "Top-grain Italian leather with a slim 0.4-inch profile and quick-access thumb slot."],
        ["Saffiano Leather Tote Bag", [180, 450], "Cross-hatch textured leather resistant to scratches and stains. An essential daily companion."],
        ["Hand-Burnished Leather Belt", [45, 120], "Solid brass buckle with a leather strap that develops a unique patina over time."],
        ["Executive Messenger Satchel", [150, 380], "Classic silhouette with modern organizational pockets and a comfortable padded strap."],
        ["All-Day Urban Backpack", [130, 320], "Water-resistant treated leather with hidden security pockets and sleek hardware."],
        ["Slim Accordion Card Case", [35, 85], "Expands to hold up to 15 cards while remaining elegant and compact in the pocket."],
        ["Luxury Suede Clutch", [90, 240], "Soft-touch emerald suede with a gold-link detachable chain for evening versatility."],
        ["Elite Weekender Duffle", [350, 850], "Generous capacity for short getaways, featuring reinforced corners and a separate shoe pocket."],
        ["Leather Passport & Tech Folio", [65, 160], "Securely holds travel documents and a tablet with dedicated slots for cables and pens."]
    ],
    "Jewelry": [
        ["1.0ct Diamond Stud Earrings", [1500, 4500], "Certified brilliant-cut diamonds set in 18k white gold. SOMA authenticity guaranteed."],
        ["Solid Gold Curb Chain", [600, 1800], "Hand-finished 14k yellow gold links with a high-polish shine and heavy-duty lobster clasp."],
        ["Infinity Diamond Band", [800, 2200], "A continuous circle of channel-set diamonds representing enduring commitment and power."],
        ["Pearl & White Gold Necklace", [250, 750], "Ethically sourced South Sea pearls paired with a delicate white gold adjustable chain."],
        ["Sapphire Halo Pendant", [450, 1350], "Deep blue sapphire surrounded by a brilliant diamond halo. A centerpiece of heritage."],
        ["Platinum Wedding Band", [500, 1500], "The ultimate symbol of durability and purity. Polished platinum with a comfort-fit interior."],
        ["Engraved Onyx Signet Ring", [120, 400], "Bold black onyx stone set in sterling silver. Can be customized with brand initials."],
        ["Diamond Tennis Bracelet", [1200, 3800], "Over 3 carats of handset diamonds in a flexible white gold setting. Iconic luxury."],
        ["Emerald Cut Citrine Earrings", [180, 550], "Vibrant citrine stones in a sophisticated emerald cut, set in brushed gold-plated silver."],
        ["Braided Rose Gold Bangle", [300, 950], "Intricate metalwork featuring 18k rose gold strands interwoven for a textured aesthetic."]
    ],
    "Home Decor": [
        ["Hand-Carved Carrara Marble Bowl", [120, 350], "Unique organic edges carved from a single slab of Italian marble. A definitive centerpiece."],
        ["Artisan Crystal Decanter Set", [180, 450], "Mouth-blown crystal decanter with four matching tumblers, designed for optimal aeration."],
        ["Hand-Poured Soy Wax Candle", [25, 75], "Luxury scent profile of aged oak and leather. Housed in a custom ceramic vessel."],
        ["Abstract Bronze Sculpture", [400, 1500], "Limited edition cast bronze figure on a polished granite base. Signed by the artist."],
        ["Linen-Wrapped Decorative Boxes", [45, 120], "Set of three stacking boxes for organizational elegance. Neutral earth tones."],
        ["Hand-Woven Silk Rug", [800, 3500], "Intricate Persian-inspired patterns woven with genuine silk for a luminous sheen."],
        ["Gilded Round Wall Mirror", [150, 480], "Hand-applied gold leaf frame with a minimalist thin edge. Expands any living space."],
        ["Ceramic Table Lamp", [110, 320], "Matte-finish ceramic base with a textured linen shade. Provides soft atmospheric lighting."],
        ["Geometric Bookend Set", [60, 180], "Heavy-duty brushed steel blocks with felt-lined bases to protect fine surfaces."],
        ["Minimalist Desktop Clock", [40, 110], "Solid walnut frame with a silent sweep movement and brushed metal hands."]
    ],
    "Wellness": [
        ["Professional Deep-Tissue Massager", [110, 290], "High-torque brushless motor with 6 interchangeable heads for targeted muscle recovery."],
        ["Smart Health & Metrics Scale", [30, 85], "Bio-impedance analysis tracking 13 essential metrics with cloud-synced app support."],
        ["Non-Slip Natural Rubber Yoga Mat", [50, 130], "High-density cushioning with a laser-etched alignment grid for precise practice."],
        ["Portable Infrared Sauna Tent", [250, 650], "Full-body detox at home. Features carbon fiber heating panels and remote control."],
        ["Biometric Sleep Tracking Ring", [180, 450], "Monitors HRV, temperature, and sleep cycles. Titanium construction with 7-day battery."],
        ["Medical-Grade Air Purifier", [300, 850], "HEPA-13 filtration removing 99.97% of particles. Whisper-quiet night mode."],
        ["Smart UV Water Bottle", [65, 150], "Self-cleaning technology using UVC light to eliminate bacteria and viruses in seconds."],
        ["Meditation Headband (EEG)", [220, 550], "Real-time brainwave feedback to help calm your mind and improve focus during sessions."],
        ["Red Light Therapy Panel", [150, 400], "Targeted skin and joint therapy with dual-wavelength LEDs for professional results."],
        ["Luxury Essential Oil Kit", [45, 120], "Set of 10 organic, cold-pressed oils curated for focus, relaxation, and immunity."]
    ],
    "Apparel": [
        ["Mongolian Cashmere Throw", [150, 400], "100% sustainable cashmere woven for unparalleled softness and warmth in a neutral palette."],
        ["Hand-Printed Silk Scarf", [80, 220], "Mulberry silk featuring a bespoke geometric pattern with hand-rolled edges."],
        ["Double-Breasted Wool Overcoat", [350, 950], "Premium wool blend with a structured silhouette and hand-finished lapels."],
        ["Luxury Silk Pajama Set", [180, 450], "Highest grade 22-momme silk for ultimate night-time comfort and temperature regulation."],
        ["Custom-Fit Cotton Oxford", [65, 160], "Non-iron Egyptian cotton with a refined button-down collar and mother-of-pearl buttons."],
        ["Merino Wool Turtleneck", [90, 240], "Extra-fine merino wool that is breathable and soft. An essential layering piece."],
        ["Silk-Lined Leather Gloves", [55, 140], "Nappa leather construction with a warm silk interior. Touchscreen compatible."],
        ["Hand-Stitched Silk Tie", [45, 110], "Dense jacquard weave featuring a subtle micro-pattern. Classic width."],
        ["Felted Beaver Fur Fedora", [150, 400], "Traditional craftsmanship with a wide brim and grosgrain ribbon detail. Water-resistant."],
        ["Cashmere House Robe", [250, 650], "Full-length lounge luxury with a shawl collar and waist tie. Unrivaled softness."]
    ],
    "Electronics": [
        ["Gasket-Mount Mechanical Keyboard", [85, 180], "Hot-swappable linear switches with a precision-milled aluminum frame and RGB backlighting."],
        ["Reference-Grade ANC Headphones", [250, 550], "Advanced active noise cancellation with 40mm high-fidelity drivers and 40-hour battery life."],
        ["Ultra-Wide 4K External Monitor", [450, 1200], "Color-accurate panel for creatives. 99% sRGB coverage with a minimalist thin bezel."],
        ["Carbon Fiber Tablet Stand", [35, 90], "Lightweight and adjustable for the perfect viewing angle. Folds flat for travel."],
        ["High-Fidelity Bookshelf Speakers", [300, 850], "Hand-finished wood cabinets with integrated Bluetooth 5.0 and analog inputs."],
        ["Professional Streaming Webcam", [80, 220], "4K resolution at 60fps with auto-focus and integrated privacy shutter. Dual mics."],
        ["Thunderbolt 4 Productivity Hub", [120, 350], "12 ports of connectivity in a compact metal chassis. Supports dual 4K displays."],
        ["Augmented Reality Smart Frames", [400, 950], "Discrete AR interface for notifications and navigation. Prescription lens compatible."],
        ["Tactile Wireless Mouse", [60, 150], "Ergonomic design with a precision scroll wheel and programmable gesture buttons."],
        ["Smart Home Voice Assistant", [110, 280], "Integrated high-end audio with a discrete OLED display and localized privacy controls."]
    ],
    "Fine Art": [
        ["Limited Edition Signed Lithograph", [300, 1200], "Contemporary abstract composition numbered and signed by the artist. Includes COA."],
        ["Modernist Bronze Desk Sculpture", [400, 1500], "Hand-cast bronze figure with a natural volcanic rock base. Part of a limited signature series."],
        ["Original Oil on Canvas", [1200, 5000], "Textured landscape work by an emerging SOMA-curated artist. Museum-grade framing."],
        ["Fine Art Photography Print", [250, 850], "Large format monochrome cityscape on archival luster paper. Signed and numbered."],
        ["Digital Masterpiece (Physical Frame)", [550, 1800], "Ultra-thin high-res screen pre-loaded with curated motion art. Changes with the light."],
        ["Hand-Blown Glass Installation", [600, 2200], "Vibrant multi-piece glass sculpture for wall or table. Each piece is unique."],
        ["Antique Map Reproduction", [150, 450], "Gold-leaf detailed rendering of the ancient world on aged parchment. Custom framed."],
        ["Sculpted Glass Paperweight", [80, 220], "Intricate internal bubble and color swirls. A weighted artistic functional piece."],
        ["Embroidered Textile Mural", [450, 1300], "Hand-stitched silk threads on a heavy linen backing. Mounted on a cedar frame."],
        ["Kinetic Metal Mobile", [200, 650], "Perfectly balanced steel elements that rotate with the slightest air current."]
    ],
    "Travel Gear": [
        ["Executive Anti-Theft Backpack", [60, 150], "Water-resistant tech fabric with hidden zippers, RFID shielding, and integrated USB-C charging."],
        ["Japanese Hard-Shell Carry-On", [200, 450], "Aerospace polycarbonate shell with silent-spin dual wheels and integrated TSA-approved locks."],
        ["Luxury Memory Foam Neck Pillow", [35, 85], "Ergonomic 360-degree support with a breathable cooling cover and storage bag."],
        ["Leather Tech Organizer Kit", [50, 130], "Compact zip-around case for cables, chargers, and small devices. Elastic straps."],
        ["High-Capacity Portable Power", [80, 220], "20,000mAh with 65W PD output. Capable of charging a laptop and phone simultaneously."],
        ["Global Universal Travel Adapter", [30, 75], "Supports 150+ countries with 4 USB ports and 1 USB-C PD port. Safe and durable."],
        ["Monogrammed Leather Passport Cover", [25, 65], "Premium calfskin with slots for boarding passes and cards. RFID lined."],
        ["Aero-Grade Aluminum Suitcase", [550, 1200], "Indestructible frame with a brushed metallic finish and corner reinforcements."],
        ["Waterproof Hanging Toiletry Bag", [40, 110], "Multiple clear compartments for easy visibility and a secure stow-away hook."],
        ["Compact Travel Steam Iron", [45, 120], "Dual voltage for international use. Rapid heating for crisp clothing anywhere."]
    ],
    "Collectibles": [
        ["Graded Vintage Comic Book", [500, 2500], "Pristine CGC-certified golden age issue. A blue-chip collectible for the serious curator."],
        ["Investment-Grade Gold Coin", [800, 2200], "Historically significant currency asset in near-mint condition. Authenticity verified by SOMA."],
        ["First Edition Rare Novel", [1200, 4500], "Signed by the author with a pristine original dust jacket. Housed in a custom case."],
        ["Authentic Movie Prop (Framed)", [600, 1800], "Significant artifact from a major production. Includes a certificate of provenance."],
        ["Limited Series Designer Toy", [150, 450], "Hand-painted vinyl figure by a renowned streetwear artist. Numbered edition."],
        ["Vintage Mechanical Camera", [300, 950], "Fully operational classic 35mm rangefinder with a leather case and lens set."],
        ["Autographed Sport Memorabilia", [450, 1500], "Game-used equipment signed by a hall-of-famer. Authenticated via SOMA Shield."],
        ["Numismatic Error Coin", [200, 750], "A rare minting anomaly, graded and sealed. A fascinating piece of currency history."],
        ["Vintage Fountain Pen (Restored)", [180, 550], "Iconic model from the 1950s with a flexible 14k gold nib. Fully functional."],
        ["Original Soundtrack Vinyl (Rare)", [110, 320], "Limited color-press release of an iconic film score. Factory sealed."]
    ],
    "Spirits & Wine": [
        ["Single Malt Highland Whiskey", [120, 450], "Aged 18 years in sherry casks. Notes of dried fruit and dark chocolate."],
        ["Small-Batch Botanical Gin", [45, 120], "Infused with 12 rare aromatics including yuzu and wild lavender. Hand-bottled."],
        ["Vintage Reserve Champagne", [150, 600], "Exceptional cuvée from a top-rated year. Fine bubbles and a long, crisp finish."],
        ["Aged Oak Wine Decanter", [85, 220], "Unique wood-and-glass hybrid designed to mellow tannins and enhance bouquets."],
        ["Executive Leather Flask Set", [60, 150], "Stainless steel body wrapped in genuine pebbled leather. Includes two shot cups."],
        ["Crystalline Wine Glass Set (6)", [110, 280], "Ultra-thin stems with a specialized bowl shape for maximum varietal expression."],
        ["Professional Sommelier Tool Kit", [75, 180], "Includes a precision foil cutter, double-hinged corkscrew, and aerator."],
        ["Marble Wine Chilling Sleeve", [40, 110], "Solid marble cylinder that holds temperature for hours. Felt base."],
        ["Limited Edition Tequila Añejo", [180, 550], "Aged for 3 years in charred French oak. Presented in a hand-painted ceramic jug."],
        ["Wall-Mounted Walnut Wine Rack", [120, 350], "Sleek vertical storage for 8 bottles. Floating design with hidden hardware."]
    ],
    "Automotive": [
        ["Tailored Indoor Car Cover", [150, 400], "Breathable satin-stretch fabric that protects against dust and moisture."],
        ["Professional Detailing Vault", [85, 220], "Includes ceramic coating, luxury leather conditioner, and microfiber tools."],
        ["4K Dual-Channel Dash Cam", [180, 450], "Front and rear coverage with Sony Starvis sensors and integrated GPS logging."],
        ["OBD-II Diagnostic Hub", [60, 150], "Real-time performance metrics delivered to your smartphone. Aluminum casing."],
        ["Executive Leather Trunk Organizer", [95, 240], "Rigid structure with adjustable dividers and a non-slip weighted base."],
        ["Designer Scented Air Diffuser", [30, 85], "Solid aluminum housing with replaceable high-end fragrance cartridges."],
        ["Machined Aluminum Key Fob Cover", [45, 110], "Aerospace-grade protection for your proximity key. Signal-transparent design."],
        ["Precision Portable Tire Inflator", [70, 160], "Digital pressure preset with a high-torque motor and emergency LED light."],
        ["Deep-Pile Luxury Floor Mats", [200, 550], "Custom-cut for your model with a waterproof backing and plush top layer."],
        ["1:18 Scale Collector Model", [110, 320], "Exacting detail with opening parts and genuine paint codes. A desktop icon."]
    ],
    "Beauty & Skincare": [
        ["Active Revitalizing Serum", [80, 220], "High-concentration Vitamin C and Peptides for rapid skin brightness and repair."],
        ["24k Gold Hydrating Mask", [120, 350], "Infused with genuine gold leaf to lock in moisture and reduce inflammation."],
        ["Nano-Sonic Cleansing Tool", [95, 240], "Ultrasonic pulsations through soft silicone bristles for deep pore purification."],
        ["Cold-Pressed Rosehip Oil", [40, 110], "100% organic, harvested from the Andes. Rich in Vitamin A and fatty acids."],
        ["Silk Sleep & Skin Protection Kit", [150, 400], "Includes a silk pillowcase and eye mask to prevent friction damage."],
        ["Cryo-Therapy Facial Rollers", [65, 160], "Stainless steel rollers designed to be kept in the freezer for depuffing."],
        ["Advanced Sun Defense Spf 50", [35, 90], "Non-greasy mineral formula with blue-light protection for modern lifestyles."],
        ["Botanical Hair Growth Elixir", [55, 140], "Stimulating scalp treatment with rosemary and caffeine. Sustainable glass bottle."],
        ["Professional Makeup Brush Set", [180, 450], "12 brushes with synthetic silk fibers and ergonomic weighted handles."],
        ["Home Aesthetic LED Mask", [350, 850], "Dual-spectrum light therapy for acne and aging. FDA-cleared technology."]
    ],
    "Fragrance": [
        ["Oud & Sandalwood Parfum", [180, 550], "Dense, long-lasting scent profile with rare resins and smoked wood notes."],
        ["Celestial White Floral Eau", [120, 350], "Light and airy jasmine and tuberose balanced by a crisp musk base."],
        ["Dark Cacao Room Spray", [45, 110], "Instantly transforms a space with notes of bitter chocolate and vanilla."],
        ["Volcanic Rock Scent Diffuser", [85, 220], "Naturally porous rocks that absorb and slowly release concentrated fragrance."],
        ["Signature Discovery Set", [60, 150], "Ten 2ml vials of the SOMA legacy collection for scent exploration."],
        ["Beeswax Scented Candle", [50, 130], "Burn time of 60 hours with a lead-free cotton wick and complex layering."],
        ["Solid Perfume Bronze Compact", [75, 180], "Concentrated scent in a hand-crafted metal case. Perfect for travel."],
        ["Wild Lavender Sachet Set", [30, 85], "Three silk sachets filled with organic French lavender for linens."],
        ["Fresh Linen Body Mist", [40, 110], "A subtle, clean scent designed for all-day use. Alcohol-free formula."],
        ["Leather & Tobacco Reed Diffuser", [90, 240], "Architectural glass vessel with natural reeds. Lasts for up to 6 months."]
    ],
    "Digital Assets": [
        ["Premium .com Domain", [800, 5000], "Highly brandable, single-word domain name for your next digital empire."],
        ["Metaverse Luxury Penthouse", [1200, 4500], "Fully rendered 3D architectural asset for decentralized virtual worlds."],
        ["AI-Generated Art Collection", [250, 850], "Unique algorithmic compositions with full commercial rights transferred."],
        ["High-Yield Arbitrage Script", [600, 1800], "Professional trading bot code optimized for major exchanges. Clean documentation."],
        ["Curated Strategic Data Set", [450, 1500], "Anonymized consumer behavior data for market research and trend prediction."],
        ["3D Product Rendering Pack", [300, 950], "Set of 50 photorealistic assets for your e-commerce storefront."],
        ["Exclusive Beat & Audio Loops", [150, 450], "Professional studio recordings with full royalty-free licensing."],
        ["Custom Typography Font Pack", [80, 220], "Five unique, high-fidelity typefaces for luxury brand identification."],
        ["Digital Marketing Strategy (PDF)", [110, 320], "100-page comprehensive guide to scaling luxury commerce via social."],
        ["Virtual Wearable Asset", [200, 650], "Exquisite digital garment for avatars, compatible with top-tier platforms."]
    ],
    "Gourmet Food": [
        ["Artisan Cold-Pressed Honey", [25, 85], "Harvested from a single remote grove. Unfiltered and rich in enzymes."],
        ["Black Truffle Oil (Italian)", [40, 110], "Infused with genuine Tuber melanosporum. A transformative kitchen asset."],
        ["Dark Single-Origin Chocolate", [30, 75], "85% cacao from sustainable farms in Ecuador. Notes of fruit and earth."],
        ["Rare Spices Discovery Chest", [120, 350], "Collection of 12 hand-picked spices from around the globe in glass jars."],
        ["Imperial Loose Leaf Tea", [50, 130], "First-flush Darjeeling harvested at the peak of the season. Floral profile."],
        ["Specialty Grade Coffee Beans", [35, 90], "Small-batch roasted Arabica with a cupping score of 90+. Ethically sourced."],
        ["Aged Balsamic of Modena", [80, 220], "Traditional PGI vinegar aged for 12 years in various wood casks."],
        ["Ethically Sourced Caviar", [150, 450], "Pristine sturgeon roe with a buttery texture and delicate sea salt finish."],
        ["Ancient Grain Cracker Assortment", [20, 55], "Hand-made with sourdough starter and sea salt. Perfect for cheese pairings."],
        ["Infused Himalayan Sea Salt", [25, 65], "Smoked over applewood for a complex, savory finishing flavor."]
    ],
    "Furniture": [
        ["Minimalist Marble Coffee Table", [450, 1200], "A single slab of white marble on a recessed black steel base."],
        ["Ergonomic Velvet Task Chair", [220, 550], "High-density foam with a brass base and silent-glide casters."],
        ["Wall-Mounted Floating Shelves", [110, 280], "Solid walnut with integrated hidden mounting hardware for a clean look."],
        ["Mid-Century Modern Sideboard", [600, 1800], "Oak construction with tapered legs and hand-carved handle details."],
        ["Modular Ottoman Seating", [150, 450], "High-performance tech fabric that is stain-resistant and soft-touch."],
        ["Brushed Steel Stool Set (2)", [180, 450], "Industrial elegance with a comfortable contoured seat and footrest."],
        ["Solid Wood Bedside Pedestal", [130, 320], "Clean lines with a single soft-close drawer and open storage shelf."],
        ["Glass & Metal Display Cabinet", [350, 950], "Tempered glass shelves with internal LED lighting to showcase assets."],
        ["Architectural Dining Table", [800, 2500], "Seating for 8. Tempered glass top on a sculptural metal frame."],
        ["Linen-Upholstered Bench", [200, 550], "Perfect for entryways or foot of bed. Features a solid ash wood frame."]
    ],
    "Accessories": [
        ["Wind-Resistant Travel Umbrella", [45, 120], "Double-canopy construction with a fiberglass frame and auto-open."],
        ["Polarized Luxury Sunglasses", [150, 400], "Acetate frames with Zeiss lenses. Provides 100% UVA/UVB protection."],
        ["Gold-Nib Fountain Pen", [180, 550], "Balanced weight with a 14k gold nib for effortless long-form writing."],
        ["Hard-Shell Tech Notebook", [25, 65], "Grid-lined archival paper with a linen cover and secure elastic closure."],
        ["Solid Brass Key Carabiner", [35, 90], "Machined from a single block of brass. Develops a unique aged finish."],
        ["Refillable Leather Lighter Case", [50, 130], "Fits standard inserts. Hand-stitched leather with a metal base."],
        ["Anti-Blue Light Eyewear", [65, 160], "Protects eyes during long digital sessions. Lightweight titanium frames."],
        ["Carbon Fiber Phone Armor", [40, 110], "MagSafe compatible. Impact protection in a thin, 12g silhouette."],
        ["Suede Eyewear Pouch", [20, 55], "Microfiber lined to clean and protect lenses. Magnetic snap closure."],
        ["Lapel Pin (Executive Series)", [30, 85], "Subtle silver-plated geometric design for brand identification."]
    ],
    "Fitness": [
        ["Adjustable Steel Dumbbells", [250, 650], "Replace a full rack with a single pair. Quick-change weight plates."],
        ["Competition Kettlebell Set", [150, 400], "Consistent sizing across weights. Smooth powder-coat finish for grip."],
        ["High-Performance Resistance Bands", [45, 120], "Snap-resistant latex with padded handles and door anchor system."],
        ["Weighted Speed Jump Rope", [35, 90], "Ball-bearing handles for smooth rotation. Includes 1lb handle weights."],
        ["Flat-Fold Weight Bench", [180, 450], "Stable steel construction with multiple incline positions. Stores flat."],
        ["Cork Fitness Roller", [40, 110], "Sustainable and antimicrobial. Provides firm pressure for myofascial release."],
        ["Tactical Weighted Vest", [110, 280], "Adjustable from 5lb to 20lb. Breathable mesh with secure strap system."],
        ["Boxing Glove & Wrap Set", [95, 240], "Multi-layer padding with wrist support. Genuine leather construction."],
        ["Smart Jump Rope (Digital)", [65, 160], "Integrated counter and calorie tracker synced to your fitness app."],
        ["Deep-Core Abdominal Roller", [30, 85], "Wide-track wheel for stability with ergonomic non-slip handles."]
    ],
    "Hobbies": [
        ["Refractor Telescope (Entry-Level)", [180, 450], "Fully coated optics with a stable tripod and smartphone adapter."],
        ["Home Science Microscope", [120, 350], "Up to 1000x magnification with dual lighting and prepared slides."],
        ["Walnut & Maple Chess Set", [150, 400], "Hand-carved pieces with a weighted base. Folding magnetic board."],
        ["1000-Piece Luxury Puzzle", [25, 65], "Fine art reproduction on thick, non-reflective cardboard. Matte finish."],
        ["Designer Board Game Collection", [80, 220], "Includes classic games with modern, minimalist aesthetics. Wood case."],
        ["Premium Acrylic Paint Set", [65, 160], "24 vibrant pigments with high light-fastness. Includes 5 professional brushes."],
        ["Ergonomic Gardening Tool Kit", [55, 140], "Stainless steel with ash wood handles. Housed in a durable tote."],
        ["Beginner's Acoustic Guitar", [250, 650], "Full-size spruce top with a warm tone. Includes a gig bag and tuner."],
        ["Professional Pottery Starter Kit", [110, 280], "Includes a desktop wheel, tools, and a guide to ceramics."],
        ["Remote Control Yacht (Model)", [200, 550], "Scale reproduction with dual motors and a 2.4GHz control system."]
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
