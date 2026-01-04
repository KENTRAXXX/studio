
export type DemoProduct = {
    id: string;
    name: string;
    description: string;
    retailPrice: number;
    wholesalePrice: number;
    imageId: string;
    category: 'Gadgets' | 'Fashion' | 'Jewelry';
};

export const demoProducts: DemoProduct[] = [
    // Gadgets
    {
        id: 'demo-gadget-001',
        name: 'Smart Audio Glasses',
        description: 'Listen to music, take calls, and access voice assistants, all from your eyewear. A seamless blend of style and technology.',
        retailPrice: 228,
        wholesalePrice: 110,
        imageId: 'demo-gadget-1',
        category: 'Gadgets',
    },
    {
        id: 'demo-gadget-002',
        name: 'Portable Holographic Projector',
        description: 'Turn any space into a cinematic experience with this pocket-sized holographic projector. Stunning visuals anywhere, anytime.',
        retailPrice: 350,
        wholesalePrice: 180,
        imageId: 'demo-gadget-2',
        category: 'Gadgets',
    },
    {
        id: 'demo-gadget-003',
        name: 'Minimalist Smart Mug',
        description: 'Keep your coffee at the perfect temperature from the first sip to the last. Control with your smartphone for the ultimate experience.',
        retailPrice: 120,
        wholesalePrice: 65,
        imageId: 'demo-gadget-3',
        category: 'Gadgets',
    },
    // Fashion
    {
        id: 'demo-fashion-001',
        name: 'Leather Weekender',
        description: 'Crafted from full-grain Italian leather, this weekender bag is the perfect companion for short getaways. Timeless design, built to last.',
        retailPrice: 450,
        wholesalePrice: 220,
        imageId: 'demo-fashion-1',
        category: 'Fashion',
    },
    {
        id: 'demo-fashion-002',
        name: 'Cashmere Scarf',
        description: 'Woven from the finest Mongolian cashmere, this scarf offers unparalleled softness and warmth. A versatile luxury staple.',
        retailPrice: 185,
        wholesalePrice: 85,
        imageId: 'demo-fashion-2',
        category: 'Fashion',
    },
    {
        id: 'demo-fashion-003',
        name: 'Tech-Jacket',
        description: 'A sleek, water-resistant jacket with integrated heating elements and smart-cuff controls. The future of outerwear is here.',
        retailPrice: 220,
        wholesalePrice: 105,
        imageId: 'demo-fashion-3',
        category: 'Fashion',
    },
    // Jewelry
    {
        id: 'demo-jewelry-001',
        name: 'Braided Steel Bracelet',
        description: 'A modern and masculine bracelet crafted from interwoven surgical-grade steel. Features a secure magnetic clasp.',
        retailPrice: 95,
        wholesalePrice: 40,
        imageId: 'demo-jewelry-1',
        category: 'Jewelry',
    },
    {
        id: 'demo-jewelry-002',
        name: 'Gold Vermeil Rings',
        description: 'A set of three stackable rings in 18k gold vermeil. Minimalist design for everyday elegance and effortless style.',
        retailPrice: 150,
        wholesalePrice: 70,
        imageId: 'demo-jewelry-2',
        category: 'Jewelry',
    },
    {
        id: 'demo-jewelry-003',
        name: 'Skeleton Automatic Watch',
        description: 'Exposing the intricate, self-winding mechanical movement within, this skeleton watch is a masterpiece of horological art.',
        retailPrice: 1200,
        wholesalePrice: 650,
        imageId: 'demo-jewelry-3',
        category: 'Jewelry',
    }
];
