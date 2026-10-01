'use strict';
// Single product source for every view. Prices are PKR numbers.
// DEMO INVENTORY: sizes and stock are examples, not verified availability.
// Replace these before launch. Add only genuine alternate photos to images[].
window.CATEGORIES = [
  { id: 'summer-edit', name: "Summer Edit '26" },
  { id: 'unstitched', name: 'Unstitched' },
  { id: 'ready-to-wear', name: 'Ready to Wear' },
  { id: 'formals', name: 'Formals' },
  { id: 'shop-the-look', name: 'Shop the Look' }
];
window.PRODUCTS = {
  "1": {
    "id": "1",
    "name": "NOOR-E-ZAR",
    "price": 8890,
    "salePrice": 7112,
    "images": [
      "./public/summer1.webp"
    ],
    "description": "Embroidered Lawn Suit",
    "category": "summer-edit",
    "subcategory": "Lawn",
    "gender": "women",
    "fabric": "Lawn",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": true,
    "isSale": true,
    "featuredRank": 0,
    "collections": [
      "summer-edit"
    ],
    "colors": []
  },
  "2": {
    "id": "2",
    "name": "GUL BAREEN",
    "price": 22000,
    "salePrice": 15400,
    "images": [
      "./public/summer2.webp"
    ],
    "description": "Chiffon Formal",
    "category": "formals",
    "subcategory": "Chiffon",
    "gender": "women",
    "fabric": "Chiffon",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": true,
    "isSale": true,
    "featuredRank": 1,
    "collections": [
      "summer-edit"
    ],
    "colors": []
  },
  "3": {
    "id": "3",
    "name": "MEHMAL",
    "price": 19800,
    "salePrice": null,
    "images": [
      "./public/summer3.webp"
    ],
    "description": "Jacquard Co-ord",
    "category": "ready-to-wear",
    "subcategory": "Co-ords",
    "gender": "women",
    "fabric": "Jacquard",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": true,
    "isSale": false,
    "featuredRank": 2,
    "collections": [
      "summer-edit"
    ],
    "colors": []
  },
  "4": {
    "id": "4",
    "name": "ZAMDA",
    "price": 8000,
    "salePrice": 6800,
    "images": [
      "./public/summer4.webp"
    ],
    "description": "Embroidered Kurti",
    "category": "ready-to-wear",
    "subcategory": "Kurtis",
    "gender": "women",
    "fabric": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": true,
    "isSale": true,
    "featuredRank": 3,
    "collections": [
      "summer-edit"
    ],
    "colors": []
  },
  "5": {
    "id": "5",
    "name": "Gulabi Lawn 3-Piece Unstitched",
    "price": 7200,
    "salePrice": null,
    "images": [
      "./public/best1.webp"
    ],
    "description": "Gulabi Lawn 3-Piece Unstitched",
    "category": "unstitched",
    "subcategory": "3-Piece",
    "gender": "women",
    "fabric": "Lawn",
    "sizes": [
      "Unstitched"
    ],
    "stock": {
      "Unstitched": 8
    },
    "inventoryIsDemo": true,
    "isNew": false,
    "isSale": false,
    "featuredRank": 4,
    "collections": [],
    "colors": [
      {
        "name": "Rose",
        "hex": "#f4c2c2"
      },
      {
        "name": "Ivory",
        "hex": "#fff5e4"
      },
      {
        "name": "Sky",
        "hex": "#a8d5e2"
      }
    ]
  },
  "6": {
    "id": "6",
    "name": "Shahtoot Silk Dupatta Set",
    "price": 30000,
    "salePrice": 24500,
    "images": [
      "./public/best2.webp"
    ],
    "description": "Shahtoot Silk Dupatta Set",
    "category": "formals",
    "subcategory": "Dupatta Sets",
    "gender": "women",
    "fabric": "Silk",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": false,
    "isSale": true,
    "featuredRank": 5,
    "collections": [],
    "colors": [
      {
        "name": "Wine",
        "hex": "#722f37"
      },
      {
        "name": "Forest",
        "hex": "#2c5f2e"
      }
    ]
  },
  "7": {
    "id": "7",
    "name": "Nargis Organza Party Wear",
    "price": 32000,
    "salePrice": null,
    "images": [
      "./public/best3.webp"
    ],
    "description": "Nargis Organza Party Wear",
    "category": "formals",
    "subcategory": "Party Wear",
    "gender": "women",
    "fabric": "Organza",
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": false,
    "isSale": false,
    "featuredRank": 6,
    "collections": [],
    "colors": [
      {
        "name": "Blush",
        "hex": "#e8d5c4"
      },
      {
        "name": "Navy",
        "hex": "#1a1a2e"
      },
      {
        "name": "Bronze",
        "hex": "#5a4a3a"
      }
    ]
  },
  "8": {
    "id": "8",
    "name": "Jasmine Printed Casual Kurta",
    "price": 5500,
    "salePrice": 4200,
    "images": [
      "./public/best4.webp"
    ],
    "description": "Jasmine Printed Casual Kurta",
    "category": "ready-to-wear",
    "subcategory": "Kurtas",
    "gender": "women",
    "fabric": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": false,
    "isSale": true,
    "featuredRank": 7,
    "collections": [],
    "colors": [
      {
        "name": "Peach",
        "hex": "#e8d5c4"
      },
      {
        "name": "Mint",
        "hex": "#a8d5e2"
      }
    ]
  },
  "look1": {
    "id": "look1",
    "name": "SEHRZAT",
    "price": 7112,
    "salePrice": null,
    "images": [
      "./public/look1.webp"
    ],
    "description": "SEHRZAT from the Shop the Look collection.",
    "category": "shop-the-look",
    "subcategory": "Looks",
    "gender": "women",
    "fabric": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": false,
    "isSale": false,
    "featuredRank": 8,
    "collections": [],
    "colors": []
  },
  "look2": {
    "id": "look2",
    "name": "MAHROSH",
    "price": 8450,
    "salePrice": null,
    "images": [
      "./public/look2.webp"
    ],
    "description": "MAHROSH from the Shop the Look collection.",
    "category": "shop-the-look",
    "subcategory": "Looks",
    "gender": "women",
    "fabric": null,
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 8,
      "L": 8
    },
    "inventoryIsDemo": true,
    "isNew": false,
    "isSale": false,
    "featuredRank": 9,
    "collections": [],
    "colors": []
  }
};

// Compatibility aliases keep the original storefront formatting in one place.
Object.values(PRODUCTS).forEach(product => {
  product.raw = product.salePrice ?? product.price;
  product.img = product.images[0];
  product.original = product.isSale ? 'PKR ' + product.price.toLocaleString('en-PK') : '';
  product.badge = product.isSale ? Math.round((1 - product.raw / product.price) * 100) + '% Off' : (product.isNew ? 'New' : '');
});
