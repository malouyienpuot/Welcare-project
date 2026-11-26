import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, Leaf, Heart, Menu, X, Plus, Minus, Trash2, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Truck } from 'lucide-react'

const money = n => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
const API = import.meta.env.VITE_API_BASE || ''

export default function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [category, setCategory] = useState('all')
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [tip, setTip] = useState('')
  const [notice, setNotice] = useState('')
  const [order, setOrder] = useState(null)
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', address: '', payment_method: 'demo' })

  useEffect(() => { fetch(API + '/api/products').then(r => { if (!r.ok) throw Error(); return r.json() }).then(setProducts).catch(() => setNotice('Could not connect to the API. Start the FastAPI server and refresh.')) }, [])
  const visible = products.filter(p => category === 'all' || p.category === category)
  const subtotal = useMemo(() => cart.reduce((s, line) => s + line.price * line.quantity, 0), [cart])
  const delivery = subtotal === 0 || subtotal >= 2000 ? 0 : 150
  const total = subtotal + delivery
  const count = cart.reduce((s, x) => s + x.quantity, 0)

  const add = p => { setCart(old => { const found = old.find(x => x.id === p.id); return found ? old.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x) : [...old, { ...p, quantity: 1 }] }); setNotice(p.name + ' added to your basket') }
  const change = (id, delta) => setCart(old => old.map(x => x.id === id ? { ...x, quantity: Math.max(1, x.quantity + delta) } : x))
  const remove = id => setCart(old => old.filter(x => x.id !== id))
  const askAssistant = async () => {
    try { const r = await fetch(API + '/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.map(x => ({ product_id: x.id, quantity: x.quantity })) }) }); const d = await r.json(); setTip((d.suggestions || []).join(' ') || d.note) }
    catch { setTip('Add a reusable pad set and pocket sanitizer to create a convenient care basket.') }
  }
  const submit = async e => {
    e.preventDefault(); setBusy(true); setNotice('')
    try {
      const r = await fetch(API + '/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items: cart.map(x => ({ product_id: x.id, quantity: x.quantity })) }) })
      const d = await r.json(); if (!r.ok) throw Error(d.detail || 'Checkout failed')
      setOrder(d); setCart([]); setCheckoutOpen(false); setCartOpen(false); setProducts(await (await fetch(API + '/api/products')).json())
    } catch (err) { setNotice(err.message || 'Could not submit your order') } finally { setBusy(false) }
  }

  return <div className="app">
    <div className="announcement">Care for yourself. Care for the planet. <span>Free delivery on orders over KES 2,000</span></div>
    <header className="nav wrap"><a className="brand" href="#"><span className="brand-mark"><Leaf size={23}/></span><span>welcare<span className="brand-light"> saniTech</span><small>CARE WITH CONFIDENCE</small></span></a><nav><a href="#shop">Shop</a><a href="#story">Our purpose</a><a href="#benefits">Why WelCare</a></nav><button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={18}/> Basket <b>{count}</b></button></header>
    <main>
      <section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><span/> THOUGHTFUL EVERYDAY HYGIENE</div><h1>Feel good.<br/><em>Live freely.</em></h1><p>Everyday care that puts your comfort first. Discover reusable menstrual care and pocket-sized hygiene essentials made for life on the move.</p><a className="primary" href="#shop">Explore products <ArrowRight size={17}/></a><div className="hero-proof"><span><Heart size={16}/> Care-led choices</span><span><Leaf size={16}/> Reusable options</span></div></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=90" alt="Natural personal care products"/><div className="image-note"><span>SMALL CHOICES,</span><strong>meaningful care.</strong></div></div></section>
      <section className="benefits wrap" id="benefits"><div><ShieldCheck/><b>Thoughtful essentials</b><span>Everyday hygiene made simple</span></div><div><Leaf/><b>Reusable care</b><span>Choose a more sustainable routine</span></div><div><Truck/><b>Convenient delivery</b><span>Order from wherever you are</span></div></section>
      <section className="shop-section" id="shop"><div className="wrap"><div className="section-head"><div><div className="eyebrow">THE WELCARE EDIT</div><h2>Care essentials</h2><p>Simple products. More confidence in every day.</p></div><span className="product-count">{visible.length} PRODUCTS</span></div><div className="filters">{[['all','All products'],['pads','Reusable pads'],['sanitizer','Hand sanitizer'],['bundle','Care bundles']].map(([v,l])=><button key={v} className={category===v?'active':''} onClick={()=>setCategory(v)}>{l}</button>)}</div>
      <div className="products">{visible.map((p,i)=><article className="product" key={p.id}><div className="product-photo"><img src={p.image} alt={p.name}/><span>{p.category==='pads'?'REUSABLE':p.category==='sanitizer'?'ON THE GO':'BEST VALUE'}</span><button aria-label={'Add '+p.name} onClick={()=>add(p)}><Plus/></button></div><div className="product-info"><small>{p.category==='pads'?'MENSTRUAL CARE':p.category==='sanitizer'?'HAND HYGIENE':'EVERYDAY CARE'}</small><h3>{p.name}</h3><p>{p.description}</p><div className="price-row"><strong>{money(p.price)}</strong><button onClick={()=>add(p)}>Add to basket <ArrowRight size={15}/></button></div></div></article>)}</div>
      <div className="assistant"><div className="assistant-icon"><Sparkles/></div><div><b>Your thoughtful basket assistant</b><p>Get a simple product suggestion for your care routine.</p>{tip && <small className="tip">{tip}</small>}</div><button onClick={askAssistant}>Get suggestion <ArrowRight size={16}/></button></div>
      </div></section>
      <section className="story wrap" id="story"><div className="story-image"><img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=85" alt="Portrait representing confidence and wellbeing"/></div><div><div className="eyebrow">WHY WE CARE</div><h2>Wellbeing should never be out of reach.</h2><p>WelCare SaniTech is committed to making practical hygiene essentials easier to access while encouraging informed, confident choices around menstrual and personal hygiene.</p><blockquote>“Care, dignity and confidence belong in every community.”</blockquote><a href="#shop" className="text-link">Find your essentials <ArrowRight size={16}/></a></div></section>
    </main>
    <footer><div className="wrap footer-inner"><a className="brand footer-brand" href="#"><span className="brand-mark"><Leaf/></span><span>welcare<span className="brand-light"> saniTech</span><small>CARE WITH CONFIDENCE</small></span></a><p>Thoughtful hygiene essentials for everyday confidence.</p><span>© {new Date().getFullYear()} WelCare SaniTech</span></div></footer>
    {notice && <div className="toast" role="status">{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {cartOpen && <div className="overlay" onClick={()=>setCartOpen(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><h2>Your basket ({count})</h2><button onClick={()=>setCartOpen(false)}><X/></button></div>{cart.length===0?<div className="empty">Your basket is waiting for something thoughtful.<a href="#shop" onClick={()=>setCartOpen(false)}>Explore products</a></div>:<><div className="cart-lines">{cart.map(x=><div className="cart-line" key={x.id}><img src={x.image} alt=""/><div className="line-info"><b>{x.name}</b><strong>{money(x.price)}</strong><div className="qty"><button onClick={()=>change(x.id,-1)}><Minus size={13}/></button><span>{x.quantity}</span><button onClick={()=>change(x.id,1)}><Plus size={13}/></button><button className="remove" onClick={()=>remove(x.id)}><Trash2 size={14}/></button></div></div></div>)}</div><div className="totals"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Delivery</span><b>{delivery===0?'FREE':money(delivery)}</b></div><div className="grand"><span>Total</span><b>{money(total)}</b></div><small>{subtotal>=2000?'You unlocked free delivery!':'Free delivery from KES 2,000'}</small><button className="primary full" onClick={()=>{setCartOpen(false);setCheckoutOpen(true)}}>Continue to checkout <ArrowRight size={17}/></button></div></>}</aside></div>}
    {checkoutOpen && <div className="overlay" onClick={()=>setCheckoutOpen(false)}><section className="checkout modal" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><div className="eyebrow">ALMOST THERE</div><h2>Delivery details</h2></div><button onClick={()=>setCheckoutOpen(false)}><X/></button></div><div className="checkout-total">Order total <strong>{money(total)}</strong></div><form onSubmit={submit}><label>Full name<input required minLength="2" value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})} placeholder="Your full name"/></label><label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label><label>Phone number<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+254..."/></label><label>Delivery address<textarea required minLength="5" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Town, area and delivery details"/></label><label>Payment option<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option value="demo">Demo payment (test only)</option></select></label><p className="secure-note"><ShieldCheck size={16}/> Demo checkout only. Never enter your M-Pesa PIN or card details here.</p><button disabled={busy} className="primary full">{busy?'Submitting order…':'Place demo order · '+money(total)}</button></form></section></div>}
    {order && <div className="overlay"><section className="success modal"><CheckCircle2 size={48}/><div className="eyebrow">ORDER RECEIVED</div><h2>Thank you for choosing WelCare.</h2><p>Your demo order has been saved successfully.</p><div className="receipt"><span>Order reference</span><b>{order.order_code}</b><span>Payment status</span><b>{order.payment_status.replace('_',' ')}</b><span>Total</span><b>{money(order.total)}</b></div><button className="primary full" onClick={()=>setOrder(null)}>Continue shopping</button><small>Demo payment only — no money was transferred.</small></section></div>}
  </div>
}