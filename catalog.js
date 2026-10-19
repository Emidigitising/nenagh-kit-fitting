// Nenagh AFC club shop, read from the Espir Sports Wix store (espirsports.ie) on 19 Oct 2026.
// Prices are euro incl. VAT, as on the store. Initials: max 5 characters, +€5 per garment.
const KIDS = ["Age 4", "Age 6", "Age 8", "Age 10"];
const YOUTH_ADULT = ["Age 12", "Age 14", "S", "M", "L", "XL", "XXL", "XXXL"];
const ALL_SIZES = [...KIDS, ...YOUTH_ADULT];
const ADULT = ["S", "M", "L", "XL", "XXL", "XXXL"];
const priced = (kids, adult) => Object.fromEntries([...KIDS.map(s => [s, kids]), ...YOUTH_ADULT.map(s => [s, adult])]);
const flat = (sizes, p) => Object.fromEntries(sizes.map(s => [s, p]));
const SOCKS_ALL = { "X-Small (12.5-2)": 7, "Small (2.5-5)": 7, "Medium (5.5-7.5)": 7.5, "Large (8.5-11)": 7.5 };
const INIT = 5; // € per initialled garment
const ONE = (label = "Initials") => [{ label, max: 5, add: INIT }];

window.CATALOG = [
  { group: "Packs", id: "pack1-kids", name: "Pack 1 Kids (T-shirt, Shorts, Socks)", price: 42,
    parts: [["T-shirt", KIDS], ["Shorts", KIDS], ["Socks", ["X-Small (12.5-2)", "Small (2.5-5)", "Medium (5.5-7.5)"]]],
    initials: ONE("T-shirt initials") },
  { group: "Packs", id: "pack1-adult", name: "Pack 1 Youth & Adult (T-shirt, Shorts, Socks)", price: 47,
    parts: [["T-shirt", YOUTH_ADULT], ["Shorts", YOUTH_ADULT], ["Socks", ["Small (2.5-5)", "Medium (5.5-7.5)", "Large (8.5-11)"]]],
    initials: ONE("T-shirt initials") },
  { group: "Packs", id: "pack2-kids", name: "Pack 2 Kids (T-shirt, ¼ Zip, Shorts, Socks)", price: 70,
    parts: [["T-shirt", KIDS], ["¼ Zip", KIDS], ["Shorts", KIDS], ["Socks", ["X-Small (12.5-2)", "Small (2.5-5)", "Medium (5.5-7.5)"]]],
    initials: [{ label: "T-shirt initials", max: 5, add: INIT }, { label: "¼ Zip initials", max: 5, add: INIT }] },
  { group: "Packs", id: "pack2-adult", name: "Pack 2 Adults (T-shirt, ¼ Zip, Shorts, Socks)", price: 79,
    parts: [["T-shirt", YOUTH_ADULT], ["¼ Zip", YOUTH_ADULT], ["Shorts", YOUTH_ADULT], ["Socks", ["Small (2.5-5)", "Medium (5.5-7.5)", "Large (8.5-11)"]]],
    initials: [{ label: "T-shirt initials", max: 5, add: INIT }, { label: "¼ Zip initials", max: 5, add: INIT }] },
  { group: "Packs", id: "pack-managers", name: "Managers Pack (T-shirt, ¼ Zip, Shorts, Socks)", price: 90,
    parts: [["T-shirt", ["XS", ...ADULT]], ["¼ Zip", ["XS", ...ADULT]], ["Shorts", ["XS", ...ADULT]], ["Socks", ["Small (2.5-5)", "Medium (5.5-7.5)", "Large (8.5-11)"]]],
    initials: [{ label: "T-shirt initials", max: 5, add: INIT }, { label: "¼ Zip initials", max: 5, add: INIT }] },

  { group: "Kit & clubwear", id: "tshirt", name: "T-shirt with crest", sizes: priced(21, 24), initials: ONE() },
  { group: "Kit & clubwear", id: "shorts", name: "Shorts with embroidered crest", sizes: priced(16, 18), note: "Age 4-6 is one size, Age 8-10 is one size" },
  { group: "Kit & clubwear", id: "socks", name: "Socks", sizes: SOCKS_ALL },
  { group: "Kit & clubwear", id: "zip", name: "¼ Zip Top with crest", sizes: priced(28, 32), initials: ONE() },
  { group: "Kit & clubwear", id: "hoodie", name: "Hoodie with crest", sizes: priced(38, 45), initials: ONE() },
  { group: "Kit & clubwear", id: "pants", name: "Pants with crest", sizes: priced(29, 33), initials: ONE() },
  { group: "Kit & clubwear", id: "rain", name: "Rain Jacket with crest", sizes: priced(27, 32), initials: ONE() },
  { group: "Kit & clubwear", id: "rain-hi", name: "High-end Rain Jacket with crest", sizes: priced(42, 50), initials: ONE() },
  { group: "Kit & clubwear", id: "bomber", name: "Bomber Jacket with crest", sizes: priced(55, 68), initials: ONE() },
  { group: "Kit & clubwear", id: "polo", name: "Polo shirt with crest", sizes: flat(ADULT, 32), colours: ["Blue", "White"], initials: ONE() },

  { group: "Managers", id: "mgr-tshirt", name: "Managers T-shirt with crest", sizes: flat(["XS", ...ADULT], 24), initials: ONE() },
  { group: "Managers", id: "mgr-zip", name: "Managers ¼ Zip Top with crest", sizes: flat(["Age 12", "Age 14", ...ADULT], 32), initials: ONE() },
  { group: "Managers", id: "mgr-coat", name: "Managers Winter Coat", sizes: flat(ADULT, 79), initials: ONE() },

  { group: "Bags", id: "players-bag", name: "Players Bag", price: 36, initials: ONE() },
  { group: "Bags", id: "backpack", name: "Backpack", price: 35, initials: ONE() },

  { group: "Other", id: "other", name: "Other (type it in)", other: true },
];
