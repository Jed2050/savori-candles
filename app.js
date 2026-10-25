// Savori Impact Candles — cart + Stripe Checkout (session created by app.savoriimpact.com)
const CHECKOUT_URL = "https://app.savoriimpact.com/api/public/candles/checkout";
const FREE_SHIPPING = 50;

const PRODUCTS = {
  "strawberry-element": {
    name: "Strawberry Element",
    variant: "Scented candle · 8 oz",
    price: 24.99,
    image: "img/product-white-thumb.webp",
    notes: ["Sweet", "Fruity", "Refreshing"],
    desc: "A bright, juicy strawberry scent with a soft floral sweetness — like a basket of fresh-picked berries on a sunny morning. Poured into a glossy white ceramic jar with a natural bamboo lid that looks beautiful on any shelf.",
    details: ["Net weight 8 oz (227 g)", "Premium coconut soy wax blend, phthalate free", "Single cotton wick", "White ceramic jar with bamboo lid", "Hand poured in the USA"],
    gallery: [
      ["product-white", "Strawberry Element candle with strawberries"],
      ["lid-rustic", "Candle with bamboo lid on a wooden board"],
      ["open-rustic", "Candle lit with the lid off"],
      ["side-label", "Close-up of the label"],
      ["back-label", "Back label with directions"],
      ["sunny-room", "Candle in a sunny living room"],
    ],
  },
  "coffee-shop": {
    name: "Coffee Shop",
    variant: "Scented candle · 8 oz",
    price: 25.99,
    image: "img/coffee-white-thumb.webp",
    paymentLink: "https://buy.stripe.com/bJe4gBceh4afenFcpl6AM00",
    shipNote: "<b>Free shipping on every order.</b> Ships from Salisbury, Maryland.",
    notes: ["Rich", "Aromatic", "Comforting"],
    desc: "A bold, rich and comforting coffee scent that brings the warmth of your favorite coffee shop into your home. Hand-poured in small batches with premium coconut apricot wax and a single cotton wick, in a glossy white ceramic jar with a natural bamboo lid. A perfect gift for coffee lovers.",
    details: ["Net weight 8 oz (227 g)", "Premium coconut apricot wax", "Single cotton wick", "Ingredients: coconut apricot wax, fragrance (coffee), essential oils, natural color", "White ceramic jar with bamboo lid", "Hand poured in Maryland, USA"],
    gallery: [
      ["coffee-white", "Coffee Shop scented candle lit with bamboo lid"],
      ["coffee-lid", "Coffee Shop candle with the bamboo lid on"],
      ["coffee-burlap", "Coffee Shop candle with coffee beans and a burlap sack"],
      ["coffee-wood", "Coffee Shop candle on a wood slice with a latte"],
      ["coffee-top", "Top view of the lit Coffee Shop candle"],
      ["coffee-latte", "Coffee Shop candle next to a latte and coffee beans"],
      ["coffee-back-label", "Back label with ingredients and directions"],
      ["coffee-living", "Coffee Shop candle glowing in a cozy living room"],
    ],
  },
};
const DEFAULT_ID = "strawberry-element";
const DEFAULT_SHIP_NOTE = "Get <b>free shipping</b> when you buy 3 or more. Ships from Salisbury, Maryland.";
let current = PRODUCTS[location.hash.slice(1)] ? location.hash.slice(1) : DEFAULT_ID;

const $ = (s) => document.querySelector(s);
const money = (n) => "$" + n.toFixed(2);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- storage (safe) ----------
function loadCart() {
  try { return JSON.parse(localStorage.getItem("savori-cart") || "{}") || {}; } catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem("savori-cart", JSON.stringify(cart)); } catch {}
}
let cart = loadCart();
for (const id of Object.keys(cart)) if (!PRODUCTS[id] || PRODUCTS[id].paymentLink) delete cart[id];

// ---------- scent picker ----------
const picker = $("#scentPicker");
picker.innerHTML = Object.entries(PRODUCTS).map(([id, p]) =>
  `<button type="button" class="scent" data-id="${id}" aria-pressed="false">
    <img src="${p.image}" alt="" width="56" height="56">
    <span><b>${esc(p.name)}</b><small>${money(p.price)}</small></span>
  </button>`).join("");
picker.addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]");
  if (b) selectProduct(b.dataset.id, true);
});
document.querySelectorAll("[data-product]").forEach((a) =>
  a.addEventListener("click", () => selectProduct(a.dataset.product, true)));

// ---------- gallery + product info ----------
const thumbs = $("#thumbs");
function showImage(file, alt) {
  const main = $("#mainImg");
  main.style.opacity = 0;
  setTimeout(() => { main.src = `img/${file}.webp`; main.alt = alt; main.style.opacity = 1; }, 150);
}
function selectProduct(id, updateHash) {
  if (!PRODUCTS[id]) return;
  current = id;
  const p = PRODUCTS[id];
  picker.querySelectorAll(".scent").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  $("#pVariant").textContent = p.variant;
  $("#pTitle").textContent = p.name;
  $("#price").textContent = money(p.price);
  $("#pNotes").innerHTML = p.notes.map((n) => `<span>${esc(n)}</span>`).join("");
  $("#pDesc").textContent = p.desc;
  $("#pDetails").innerHTML = p.details.map((d) => `<li>${esc(d)}</li>`).join("");
  const direct = !!p.paymentLink;
  $("#buyRow").hidden = direct;
  $("#buyNow").textContent = direct ? "Buy it now — free shipping" : "Buy it now";
  $("#shipNote").innerHTML = p.shipNote || DEFAULT_SHIP_NOTE;
  thumbs.innerHTML = "";
  thumbs.style.setProperty("--cols", p.gallery.length > 6 ? 4 : 6);
  p.gallery.forEach(([file, alt], i) => {
    const b = document.createElement("button");
    b.className = "thumb";
    b.type = "button";
    b.setAttribute("role", "listitem");
    b.setAttribute("aria-label", alt);
    b.setAttribute("aria-current", i === 0 ? "true" : "false");
    b.innerHTML = `<img src="img/${file}-thumb.webp" alt="" loading="lazy" width="240" height="240">`;
    b.addEventListener("click", () => {
      showImage(file, alt);
      thumbs.querySelectorAll(".thumb").forEach((t) => t.setAttribute("aria-current", "false"));
      b.setAttribute("aria-current", "true");
    });
    thumbs.appendChild(b);
  });
  const [f0, a0] = p.gallery[0];
  showImage(f0, a0);
  if (updateHash) history.replaceState(null, "", "#" + id);
}

// ---------- quantity ----------
const qtyInput = $("#qty");
const clampQty = (v) => Math.max(1, Math.min(20, parseInt(v, 10) || 1));
$("#qtyMinus").onclick = () => (qtyInput.value = clampQty(+qtyInput.value - 1));
$("#qtyPlus").onclick = () => (qtyInput.value = clampQty(+qtyInput.value + 1));
qtyInput.onchange = () => (qtyInput.value = clampQty(qtyInput.value));

// ---------- cart ----------
function add(id, n) {
  cart[id] = Math.min(20, (cart[id] || 0) + n);
  saveCart();
  render();
  const c = $("#cartCount");
  c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
}
function setQty(id, n) {
  if (n <= 0) delete cart[id]; else cart[id] = Math.min(20, n);
  saveCart();
  render();
}
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const subtotal = () => Object.entries(cart).reduce((s, [id, q]) => s + PRODUCTS[id].price * q, 0);

function render() {
  $("#cartCount").textContent = count();
  const items = $("#cartItems");
  const entries = Object.entries(cart);
  if (!entries.length) {
    items.innerHTML = `<div class="empty"><p>Your cart is empty.</p><a href="#shop" class="btn btn-primary" data-close>Shop candles</a></div>`;
  } else {
    items.innerHTML = entries.map(([id, q]) => {
      const p = PRODUCTS[id];
      return `<div class="item">
        <img src="${p.image}" alt="">
        <div>
          <h4>${p.name}</h4>
          <p class="small muted">${p.variant}</p>
          <div class="qty"><button type="button" data-dec="${id}" aria-label="Decrease">−</button><span>${q}</span><button type="button" data-inc="${id}" aria-label="Increase">+</button></div>
          <button class="remove" type="button" data-remove="${id}">Remove</button>
        </div>
        <b>${money(p.price * q)}</b>
      </div>`;
    }).join("");
  }
  const sub = subtotal();
  $("#subtotal").textContent = money(sub);
  const left = FREE_SHIPPING - sub;
  $("#shipMsg").innerHTML = sub === 0
    ? `Free shipping on orders over $${FREE_SHIPPING}.`
    : left > 0 ? `You're <b>${money(left)}</b> away from free shipping.` : `🎉 You've unlocked <b>free shipping!</b>`;
  $("#shipBar").style.width = Math.min(100, (sub / FREE_SHIPPING) * 100) + "%";
  $("#checkoutBtn").disabled = !entries.length;
}

$("#cartItems").addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.inc) setQty(t.dataset.inc, cart[t.dataset.inc] + 1);
  if (t.dataset.dec) setQty(t.dataset.dec, cart[t.dataset.dec] - 1);
  if (t.dataset.remove) setQty(t.dataset.remove, 0);
  if (t.hasAttribute("data-close")) closeCart();
});

// ---------- drawer ----------
const drawer = $("#drawer"), overlay = $("#overlay");
function openCart() {
  overlay.hidden = false;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  $("#cartClose").focus();
}
function closeCart() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
}
$("#cartOpen").onclick = openCart;
$("#cartClose").onclick = closeCart;
overlay.onclick = closeCart;
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); $("#thanks").hidden = true; } });

$("#addToCart").onclick = () => { add(current, clampQty(qtyInput.value)); openCart(); };
$("#buyNow").onclick = () => {
  const p = PRODUCTS[current];
  if (p.paymentLink) { window.location.href = p.paymentLink; return; }
  add(current, clampQty(qtyInput.value)); checkout();
};

// ---------- checkout ----------
async function checkout() {
  const btn = $("#checkoutBtn"), err = $("#checkoutError");
  err.hidden = true;
  btn.disabled = true;
  btn.textContent = "Redirecting to secure checkout…";
  try {
    const res = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: Object.entries(cart).map(([id, qty]) => ({ id, qty })) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Checkout is unavailable right now.");
    window.location.href = data.url;
  } catch (e) {
    openCart();
    err.textContent = `${e.message} Please try again, or email info@savoriimpact.com to order.`;
    err.hidden = false;
    btn.disabled = false;
    btn.textContent = "Checkout";
  }
}
$("#checkoutBtn").onclick = checkout;

// ---------- return from Stripe ----------
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}
const params = new URLSearchParams(location.search);
if (params.get("order") === "success") {
  cart = {};
  saveCart();
  $("#thanks").hidden = false;
  $("#thanksClose").focus();
} else if (params.get("order") === "cancelled") {
  toast("Checkout cancelled — your cart is saved.");
}
if (params.has("order")) history.replaceState(null, "", location.pathname + location.hash);
$("#thanksClose").onclick = () => ($("#thanks").hidden = true);

$("#year").textContent = new Date().getFullYear();
selectProduct(current, false);
render();
