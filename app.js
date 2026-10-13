// Savori Impact Candles — cart + Stripe Checkout (session created by app.savoriimpact.com)
const CHECKOUT_URL = "https://app.savoriimpact.com/api/public/candles/checkout";
const FREE_SHIPPING = 50;

const PRODUCTS = {
  "strawberry-element": {
    name: "Strawberry Element",
    variant: "Scented candle · 8 oz",
    price: 24.99,
    image: "img/product-white-thumb.webp",
  },
};

const GALLERY = [
  ["product-white", "Strawberry Element candle with strawberries"],
  ["lid-rustic", "Candle with bamboo lid on a wooden board"],
  ["open-rustic", "Candle lit with the lid off"],
  ["side-label", "Close-up of the label"],
  ["back-label", "Back label with directions"],
  ["sunny-room", "Candle in a sunny living room"],
];

const $ = (s) => document.querySelector(s);
const money = (n) => "$" + n.toFixed(2);

// ---------- storage (safe) ----------
function loadCart() {
  try { return JSON.parse(localStorage.getItem("savori-cart") || "{}") || {}; } catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem("savori-cart", JSON.stringify(cart)); } catch {}
}
let cart = loadCart();
for (const id of Object.keys(cart)) if (!PRODUCTS[id]) delete cart[id];

// ---------- gallery ----------
const thumbs = $("#thumbs");
GALLERY.forEach(([file, alt], i) => {
  const b = document.createElement("button");
  b.className = "thumb";
  b.type = "button";
  b.setAttribute("role", "listitem");
  b.setAttribute("aria-label", alt);
  b.setAttribute("aria-current", i === 0 ? "true" : "false");
  b.innerHTML = `<img src="img/${file}-thumb.webp" alt="" loading="lazy" width="240" height="240">`;
  b.addEventListener("click", () => {
    const main = $("#mainImg");
    main.style.opacity = 0;
    setTimeout(() => { main.src = `img/${file}.webp`; main.alt = alt; main.style.opacity = 1; }, 150);
    thumbs.querySelectorAll(".thumb").forEach((t) => t.setAttribute("aria-current", "false"));
    b.setAttribute("aria-current", "true");
  });
  thumbs.appendChild(b);
});

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

$("#addToCart").onclick = () => { add("strawberry-element", clampQty(qtyInput.value)); openCart(); };
$("#buyNow").onclick = () => { add("strawberry-element", clampQty(qtyInput.value)); checkout(); };

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
render();
