/**
 * Sample data for DEVELOPMENT and demos. Everything here is made up.
 * Real products come from the admin panel. Run `npm run seed:destroy` before you launch.
 *
 * There are no photos: product pictures are uploaded in the admin panel (Cloudinary), and until then the
 * store shows its gold placeholder. Descriptions and specifications are sample text, so edit them freely.
 */

const specs = (...pairs) => pairs.map(([key, value]) => ({ key, value }));

export const CATEGORIES = [
  { name: 'Earrings', description: 'Hoops, studs and drops to frame your face.' },
  { name: 'Rings', description: 'Statement and stackable rings for every finger.' },
  { name: 'Lockets', description: 'Necklaces and pendants that hold something close to your heart.' },
  { name: 'Watches', description: 'Elegant timepieces that finish any outfit.' },
  { name: 'Bracelets', description: 'Charms, crystals and beads for your wrist.' },
  { name: 'Bangles', description: 'Festive and everyday bangles, singles and sets.' },
  { name: 'Bags', description: 'Crossbodies, clutches and totes for every occasion.' },
];

export const PRODUCTS = [
  // ---------------------------------------------------------------- Earrings
  {
    sku: 'ER-001',
    name: 'Gold Hoop Earrings',
    category: 'Earrings',
    price: 1800,
    salePrice: 1400,
    stock: 24,
    featured: true,
    bestSeller: true,
    soldCount: 62,
    tags: ['hoops', 'gold', 'everyday', 'earrings'],
    specifications: specs(['Material', 'Gold-plated alloy'], ['Diameter', '30 mm'], ['Closure', 'Post and butterfly back']),
    description:
      'Classic gold-tone hoops with a smooth, polished finish. Light enough to wear from morning to night and simple enough to match everything in your wardrobe.',
  },
  {
    sku: 'ER-002',
    name: 'Pearl Drop Earrings',
    category: 'Earrings',
    price: 2200,
    salePrice: null,
    stock: 15,
    newArrival: true,
    soldCount: 18,
    tags: ['pearl', 'drop', 'party', 'earrings'],
    specifications: specs(['Material', 'Faux pearl, gold-plated alloy'], ['Drop length', '45 mm'], ['Closure', 'Post and butterfly back']),
    description:
      'A single faux pearl hangs from a delicate gold-tone setting. An elegant choice for weddings, dinners and festive evenings.',
  },
  {
    sku: 'ER-003',
    name: 'Crystal Stud Set',
    category: 'Earrings',
    price: 1500,
    salePrice: 1200,
    stock: 3,
    soldCount: 41,
    tags: ['studs', 'crystal', 'set', 'earrings'],
    specifications: specs(['Material', 'Crystal, silver-tone alloy'], ['Pairs in set', '3'], ['Stud size', '6 mm, 8 mm and 10 mm']),
    description:
      'Three pairs of sparkling crystal studs in graduated sizes, so you can wear them one at a time or together. A small set that goes a long way.',
  },

  // ---------------------------------------------------------------- Rings
  {
    sku: 'RG-001',
    name: 'Solitaire Crystal Ring',
    category: 'Rings',
    price: 1600,
    salePrice: 1300,
    stock: 18,
    featured: true,
    soldCount: 33,
    tags: ['solitaire', 'crystal', 'ring', 'gift'],
    specifications: specs(['Material', 'Gold-plated alloy, cubic zirconia'], ['Stone size', '8 mm'], ['Sizes', 'Adjustable']),
    description:
      'A bright round crystal in a classic four-claw setting. Simple, timeless and a lovely gift for someone special.',
  },
  {
    sku: 'RG-002',
    name: 'Adjustable Leaf Ring',
    category: 'Rings',
    price: 1200,
    salePrice: null,
    stock: 30,
    newArrival: true,
    soldCount: 12,
    tags: ['leaf', 'adjustable', 'ring', 'minimal'],
    specifications: specs(['Material', 'Gold-plated alloy'], ['Sizes', 'Adjustable'], ['Style', 'Open band']),
    description:
      'A delicate open ring shaped like a leaf, finished in warm gold tone. The adjustable band fits most fingers comfortably.',
  },
  {
    sku: 'RG-003',
    name: 'Stackable Ring Set of Five',
    category: 'Rings',
    price: 2400,
    salePrice: 1999,
    stock: 0,
    soldCount: 27,
    tags: ['stackable', 'set', 'ring', 'trending'],
    specifications: specs(['Material', 'Gold-plated alloy'], ['Pieces in set', '5'], ['Sizes', 'Adjustable']),
    description:
      'Five slim rings in different textures that look beautiful worn together or mixed with your own. Currently sold out, so message us to hear when it is back.',
  },

  // ---------------------------------------------------------------- Lockets
  {
    sku: 'LK-001',
    name: 'Heart Locket Necklace',
    category: 'Lockets',
    price: 2800,
    salePrice: 2300,
    stock: 12,
    featured: true,
    bestSeller: true,
    soldCount: 58,
    tags: ['heart', 'locket', 'necklace', 'gift'],
    specifications: specs(['Material', 'Gold-plated alloy'], ['Chain length', '45 cm with 5 cm extender'], ['Locket size', '22 mm']),
    description:
      'A romantic heart-shaped locket that opens to hold two small photos. A thoughtful gift for birthdays, anniversaries and Eid.',
  },
  {
    sku: 'LK-002',
    name: 'Initial Letter Pendant',
    category: 'Lockets',
    price: 1900,
    salePrice: null,
    stock: 20,
    newArrival: true,
    soldCount: 15,
    tags: ['initial', 'pendant', 'necklace', 'personal'],
    specifications: specs(['Material', 'Gold-plated alloy'], ['Chain length', '42 cm with 5 cm extender'], ['Letters', 'Message us for your initial']),
    description:
      'A fine chain with a polished letter pendant. Wear your own initial, or give the letter of someone you love.',
  },
  {
    sku: 'LK-003',
    name: 'Vintage Oval Locket',
    category: 'Lockets',
    price: 3200,
    salePrice: null,
    stock: 7,
    soldCount: 9,
    tags: ['vintage', 'oval', 'locket', 'necklace'],
    specifications: specs(['Material', 'Antique gold-tone alloy'], ['Chain length', '60 cm'], ['Locket size', '30 mm']),
    description:
      'An oval locket with a detailed engraved front and an antique gold-tone finish, hung on a long chain for layering.',
  },

  // ---------------------------------------------------------------- Watches
  {
    sku: 'WT-001',
    name: 'Rose Gold Mesh Watch',
    category: 'Watches',
    price: 4500,
    salePrice: 3800,
    stock: 10,
    featured: true,
    bestSeller: true,
    soldCount: 44,
    tags: ['watch', 'rose gold', 'mesh', 'women'],
    specifications: specs(['Case size', '32 mm'], ['Strap', 'Stainless steel mesh, adjustable'], ['Movement', 'Quartz']),
    description:
      'A slim rose gold dial on a soft mesh strap that adjusts to any wrist. Dressy enough for occasions and light enough for every day.',
  },
  {
    sku: 'WT-002',
    name: 'Classic Leather Strap Watch',
    category: 'Watches',
    price: 3900,
    salePrice: null,
    stock: 14,
    soldCount: 21,
    tags: ['watch', 'leather', 'classic', 'women'],
    specifications: specs(['Case size', '34 mm'], ['Strap', 'Faux leather, 16 mm'], ['Movement', 'Quartz']),
    description:
      'A clean white dial with gold-tone markers on a soft brown strap. A timeless everyday watch that never goes out of style.',
  },
  {
    sku: 'WT-003',
    name: 'Mini Dial Bracelet Watch',
    category: 'Watches',
    price: 4200,
    salePrice: null,
    stock: 4,
    newArrival: true,
    soldCount: 16,
    tags: ['watch', 'mini', 'bracelet', 'gift'],
    specifications: specs(['Case size', '24 mm'], ['Strap', 'Gold-tone chain bracelet'], ['Movement', 'Quartz']),
    description:
      'A tiny dial on a fine chain bracelet that looks more like jewellery than a watch. Small, sparkling and easy to wear.',
  },

  // ---------------------------------------------------------------- Bracelets
  {
    sku: 'BR-001',
    name: 'Charm Bracelet',
    category: 'Bracelets',
    price: 2100,
    salePrice: 1750,
    stock: 22,
    bestSeller: true,
    soldCount: 39,
    tags: ['charm', 'bracelet', 'gift', 'gold'],
    specifications: specs(['Material', 'Gold-plated alloy'], ['Length', '17 cm with 4 cm extender'], ['Charms', 'Heart, star and moon']),
    description:
      'A delicate chain bracelet with three little charms: a heart, a star and a moon. A sweet, easy gift for friends and family.',
  },
  {
    sku: 'BR-002',
    name: 'Crystal Tennis Bracelet',
    category: 'Bracelets',
    price: 3500,
    salePrice: null,
    stock: 9,
    featured: true,
    soldCount: 19,
    tags: ['tennis', 'crystal', 'bracelet', 'party'],
    specifications: specs(['Material', 'Cubic zirconia, silver-tone alloy'], ['Length', '18 cm'], ['Closure', 'Box clasp with safety catch']),
    description:
      'A continuous line of sparkling crystals that catches the light with every movement. Beautiful on its own or stacked with a watch.',
  },
  {
    sku: 'BR-003',
    name: 'Beaded Layered Bracelet',
    category: 'Bracelets',
    price: 1400,
    salePrice: null,
    stock: 40,
    newArrival: true,
    soldCount: 8,
    tags: ['beaded', 'layered', 'bracelet', 'casual'],
    specifications: specs(['Material', 'Glass beads, elastic cord'], ['Layers', '3'], ['Fit', 'Stretch, fits most wrists']),
    description:
      'Three strands of small glass beads in soft neutral shades that stack into one easy, relaxed bracelet.',
  },

  // ---------------------------------------------------------------- Bangles
  {
    sku: 'BG-001',
    name: 'Kundan Bangle Set of Four',
    category: 'Bangles',
    price: 3600,
    salePrice: 2999,
    stock: 11,
    featured: true,
    bestSeller: true,
    soldCount: 52,
    tags: ['kundan', 'bangles', 'wedding', 'festive'],
    specifications: specs(['Material', 'Alloy with kundan-style stones'], ['Pieces in set', '4'], ['Sizes', '2.4, 2.6 and 2.8 available']),
    description:
      'A festive set of four bangles with sparkling kundan-style stones and a rich gold-tone finish. Made for weddings, Eid and every celebration.',
  },
  {
    sku: 'BG-002',
    name: 'Gold-Tone Kada Bangle',
    category: 'Bangles',
    price: 2600,
    salePrice: null,
    stock: 16,
    soldCount: 14,
    tags: ['kada', 'bangle', 'gold', 'statement'],
    specifications: specs(['Material', 'Gold-plated brass'], ['Width', '12 mm'], ['Sizes', '2.4, 2.6 and 2.8 available']),
    description:
      'A bold, polished kada with a clean finish that works with traditional and western outfits alike.',
  },
  {
    sku: 'BG-003',
    name: 'Pearl Bangle Pair',
    category: 'Bangles',
    price: 3000,
    salePrice: null,
    stock: 2,
    soldCount: 22,
    tags: ['pearl', 'bangles', 'pair', 'bridal'],
    specifications: specs(['Material', 'Faux pearl, gold-plated alloy'], ['Pieces', '2'], ['Sizes', '2.4 and 2.6 available']),
    description:
      'Two bangles lined with creamy faux pearls and gold-tone edges. Soft, graceful and lovely with bridal and festive outfits.',
  },

  // ---------------------------------------------------------------- Bags
  {
    sku: 'BA-001',
    name: 'Mini Crossbody Bag',
    category: 'Bags',
    price: 4800,
    salePrice: 3999,
    stock: 8,
    featured: true,
    bestSeller: true,
    soldCount: 47,
    tags: ['crossbody', 'mini', 'bag', 'chain'],
    specifications: specs(['Material', 'Faux leather'], ['Size', '20 x 14 x 7 cm'], ['Strap', 'Gold-tone chain, adjustable']),
    description:
      'A compact crossbody with room for your phone, wallet and keys. The chain strap and gold-tone clasp add a polished finish.',
  },
  {
    sku: 'BA-002',
    name: 'Quilted Chain Clutch',
    category: 'Bags',
    price: 3800,
    salePrice: null,
    stock: 13,
    newArrival: true,
    soldCount: 11,
    tags: ['clutch', 'quilted', 'bag', 'party'],
    specifications: specs(['Material', 'Faux leather'], ['Size', '24 x 13 x 5 cm'], ['Strap', 'Removable chain']),
    description:
      'A softly quilted clutch that carries the essentials for an evening out. Use the removable chain to wear it on your shoulder.',
  },
  {
    sku: 'BA-003',
    name: 'Everyday Tote Bag',
    category: 'Bags',
    price: 5200,
    salePrice: null,
    stock: 6,
    soldCount: 17,
    tags: ['tote', 'everyday', 'bag', 'work'],
    specifications: specs(['Material', 'Faux leather'], ['Size', '36 x 28 x 12 cm'], ['Closure', 'Magnetic snap, inner zip pocket']),
    description:
      'A roomy structured tote for work, university or weekends, with an inner zip pocket to keep small things safe.',
  },
];

// People who "wrote" the sample reviews. They cannot log in: the seed gives each a random password nobody sees.
export const DEMO_CUSTOMERS = [
  { email: 'sara@seed.crystalzone.test', name: 'Sara Khan', display: 'Sara K.', phone: '03001234501' },
  { email: 'ayesha@seed.crystalzone.test', name: 'Ayesha Malik', display: 'Ayesha M.', phone: '03001234502' },
  { email: 'hira@seed.crystalzone.test', name: 'Hira Tariq', display: 'Hira T.', phone: '03001234503' },
  { email: 'mehwish@seed.crystalzone.test', name: 'Mehwish Ali', display: 'Mehwish A.', phone: '03001234504' },
];

export const REVIEWS = [
  { sku: 'ER-001', email: 'sara@seed.crystalzone.test', rating: 5, comment: 'Beautiful hoops, light enough to wear all day. The gold colour looks lovely and they arrived neatly packed.' },
  { sku: 'ER-001', email: 'ayesha@seed.crystalzone.test', rating: 5, comment: 'Exactly like the pictures. I got so many compliments at a family function.' },
  { sku: 'ER-002', email: 'hira@seed.crystalzone.test', rating: 4, comment: 'Pretty pearl drops. A little smaller than I imagined but very elegant.' },
  { sku: 'LK-001', email: 'mehwish@seed.crystalzone.test', rating: 5, comment: 'Bought this as a gift for my sister and she loved it. Delivery was quick too.' },
  { sku: 'LK-001', email: 'sara@seed.crystalzone.test', rating: 4, comment: 'Nice finish and the locket opens smoothly. The chain is a good length.' },
  { sku: 'WT-001', email: 'ayesha@seed.crystalzone.test', rating: 5, comment: 'Looks far more expensive than it is. The mesh strap is very comfortable.' },
  { sku: 'BG-001', email: 'hira@seed.crystalzone.test', rating: 5, comment: 'The bangle set is stunning for weddings. All four pieces fit well.' },
  { sku: 'BG-001', email: 'mehwish@seed.crystalzone.test', rating: 4, comment: 'Lovely stones and sturdy. Please check your size before ordering.' },
  { sku: 'BA-001', email: 'sara@seed.crystalzone.test', rating: 5, comment: 'Perfect size for my phone, wallet and keys. The chain strap feels sturdy.' },
  { sku: 'BR-001', email: 'ayesha@seed.crystalzone.test', rating: 3, comment: 'Pretty bracelet but the clasp was a little tight at first. Fine after a few wears.' },
];