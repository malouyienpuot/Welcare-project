// Set this to your deployed FastAPI URL, for example https://api.example.com
// Keep it empty when the frontend and API are served from the same origin.
const API_BASE = (window.WELCARE_API_BASE || "").replace(/\/$/, "");
const money = value => new Intl.NumberFormat("en-KE", {style:"currency",currency:"KES",maximumFractionDigits:0}).format(value);
const fallbackProducts = [
{id:1,name:"Reusable Sanitary Pad Set",description:"Comfortable, washable reusable pads for confident menstrual care.",category:"pads",price:850,image:"https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=85",stock:100},
{id:2,name:"Pocket Hand Sanitizer",description:"Pocket-size hygiene support for everyday use on the go.",category:"sanitizer",price:250,image:"https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=900&q=85",stock:150},
{id:3,name:"Monthly Care Bundle",description:"A reusable pad set and pocket sanitizer in one convenient bundle.",category:"bundle",price:1000,image:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",stock:80}
];
let products = [], cart = {}, category = "all";
const $ = id => document.getElementById(id);
const grid = $("product-grid");
async function loadProducts(){
  try {
    const response = await fetch(API_BASE + "/api/products");
    if(!response.ok) throw new Error("API unavailable");
    products = await response.json();
    $("product-status").textContent = "Live product catalogue connected.";
  } catch(error) {
    products = fallbackProducts;
    $("product-status").textContent = "Showing sample products. Start or connect the Python API to load live stock and checkout.";
  }
  renderProducts();
}
function renderProducts(){
  const term = $("search").value.trim().toLowerCase();
  const shown = products.filter(p => (category==="all" || p.category===category) && (p.name+" "+p.description).toLowerCase().includes(term));
  grid.innerHTML = shown.length ? shown.map(p => `<article class="product-card"><div class="product-image"><img src="${escapeHtml(p.image || "")}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80'"><span class="product-tag">${label(p.category)}</span></div><div class="product-info"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || "")}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${p.id}" ${p.stock===0?"disabled":""}>＋ Add to cart</button></div></div></article>`).join("") : "<p>No products match your search.</p>";
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function label(value){return ({pads:"Reusable care",sanitizer:"Hand hygiene",bundle:"Care bundle"})[value]||"WelCare essential";}
function add(id){cart[id]=(cart[id]||0)+1;renderCart();}
function change(id,delta){cart[id]=(cart[id]||0)+delta;if(cart[id]<=0)delete cart[id];renderCart();}
function cartItems(){return Object.entries(cart).map(([id,quantity])=>({product:products.find(p=>p.id===Number(id)),quantity})).filter(x=>x.product);}
function renderCart(){
 const lines=cartItems(), count=lines.reduce((s,x)=>s+x.quantity,0), subtotal=lines.reduce((s,x)=>s+x.product.price*x.quantity,0);
 $("cart-count").textContent=count;$("cart-subtotal").textContent=money(subtotal);$("checkout-open").disabled=!count;
 $("cart-lines").innerHTML=lines.length?lines.map(x=>`<div class="cart-line"><div><b>${escapeHtml(x.product.name)}</b><small>${money(x.product.price)} each · ${money(x.product.price*x.quantity)}</small></div><div class="qty"><button data-change="${x.product.id}" data-delta="-1" aria-label="Decrease quantity">−</button><b>${x.quantity}</b><button data-change="${x.product.id}" data-delta="1" aria-label="Increase quantity">+</button></div></div>`).join(""):'<p class="empty">Your cart is empty. Add a product to get started.</p>';
}
function toggleCart(open){$("cart-panel").classList.toggle("open",open);$("overlay").classList.toggle("show",open);$("cart-panel").setAttribute("aria-hidden",String(!open));}
document.addEventListener("click",event=>{
 const addButton=event.target.closest("[data-add]");if(addButton)add(Number(addButton.dataset.add));
 const qtyButton=event.target.closest("[data-change]");if(qtyButton)change(Number(qtyButton.dataset.change),Number(qtyButton.dataset.delta));
 const filter=event.target.closest("[data-category]");if(filter){category=filter.dataset.category;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===filter));renderProducts();}
});
$("search").addEventListener("input",renderProducts);
$("cart-open").addEventListener("click",()=>toggleCart(true));$("cart-close").addEventListener("click",()=>toggleCart(false));$("overlay").addEventListener("click",()=>toggleCart(false));
$("checkout-open").addEventListener("click",()=>{$("checkout-modal").classList.add("show");$("checkout-status").textContent="";});
$("checkout-close").addEventListener("click",()=>$("checkout-modal").classList.remove("show"));
$("checkout-form").addEventListener("submit",async event=>{
 event.preventDefault();const button=event.submitter;button.disabled=true;button.textContent="Submitting…";
 const form=new FormData(event.currentTarget);const payload=Object.fromEntries(form.entries());
 payload.payment_method="demo";payload.items=cartItems().map(x=>({product_id:x.product.id,quantity:x.quantity}));
 try{
  const response=await fetch(API_BASE+"/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await response.json();if(!response.ok)throw new Error(data.detail||"Checkout failed. Please try again.");
  $("checkout-status").textContent=`Order ${data.order_code} confirmed. Total: ${money(data.total)}. ${data.message}`;
  cart={};renderCart();event.currentTarget.reset();await loadProducts();
 }catch(error){$("checkout-status").textContent=error.message+" Check that the backend API is running and its CORS settings allow this website.";}
 finally{button.disabled=false;button.textContent="Place demo order";}
});
$("year").textContent=new Date().getFullYear();renderCart();loadProducts();