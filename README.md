# Zurane storefront

Existing HTML, CSS and vanilla JavaScript storefront, with responsive shopping, product details, cart, checkout and locally saved orders.

## Run

Serve this folder with a static server (recommended for consistent storage across pages):

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/index.html`.

## Catalog and pages

- `products.js`: single product catalog, categories, PKR prices, images, colors, sizes, stock and collection flags. Product names, photos and selling prices come from the existing site. Discount badges are calculated from actual listed prices.
- `catalog.js`: shared product cards and matching helpers.
- `shop.html` / `shop.js`: reusable listing, category/collection/search routes, filters, sorting and browser back/forward support.
- `product.html` / `product.js`: standalone product details, size selection, quantity, gallery/zoom, product information and related products.
- `store.js`: cart storage, validation, stock checks and totals.
- `commerce.js`: navigation, quick-add options, cart drawer, checkout and confirmation.
- `style.css`: existing storefront styles and responsive corrections. `commerce.css`: purchase/listing views using the existing visual identity.

Example routes:

```text
shop.html
shop.html?collection=new
shop.html?collection=sale
shop.html?category=unstitched
shop.html?category=ready-to-wear
shop.html?category=formals
shop.html?q=lawn
product.html?id=1
```

Only categories supported by the existing catalog are linked. Original winter categories with no product data are not offered as empty destinations. Men and T-shirts were examples in the request, not present in this catalog.

## Values to configure before launch

- **Demo inventory:** the source had no sizes or stock. `sizes`, `stock` and `inventoryIsDemo` in `products.js` are explicitly marked sample values. Stock is pooled by product and size across color variants. Replace with verified values before launch. Product category/fabric mappings use the existing names and descriptions and should also be reviewed.
- Only one genuine image per product was supplied. Add alternate photos to `images[]` to enable gallery arrows and additional thumbnails. Zoom works with the existing image. No unrelated or duplicate photos are presented as alternate product views.
- Shipping is **PKR 250 at or below PKR 5,000**, free above PKR 5,000, following the original banner's threshold. Edit `Store.SHIPPING` in `store.js` to change the provisional shipping fee.
- Website contact email is `hello@zurane.com`; this does not provision or verify that mailbox. The original placeholder phone number remains to be replaced. Social and policy destinations require the store's actual URLs/content.
- Checkout saves orders **only in this browser**. It does not send orders to the store, reserve real stock, send email, or collect payment. Cash on Delivery is recorded as unpaid. Online payment is disabled until a gateway is connected.
- Local order records include customer contact and delivery information. Clearing site storage removes them. For a live store, use a backend that validates prices, stock and orders and implements payment/notification services.
- Newsletter signup is not connected; the UI says so rather than claiming a subscription was created.

Storage uses `Zurane_cart`, `Zurane_wish` and `Zurane_orders`. Existing legacy store records are copied to the new keys when the new key is absent. Old order numbers stay valid; new orders use `ZUR-` references.

## Validation

```powershell
node test-store.cjs
```

The dependency-free integration test uses the installed Microsoft Edge executable in a separate headless profile and a temporary local HTTP server. It checks 320, 375, 390, 430, 768, 1024, 1280 and 1920px layouts, navigation/category/search/filter/sort flows, size-specific cart lines, quantity controls, shipping, persistence, form validation, stock restrictions, local checkout/confirmation, and corrupt or unavailable storage. Screenshots and results are saved to `.qa/`.

The original archive `syedCollection.zip` is retained unchanged as a backup. `.qa/` and test scripts are development artifacts and are not needed for deployment.
