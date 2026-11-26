from datetime import datetime
from typing import Generator
from uuid import uuid4

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker, Session

DATABASE_URL = "sqlite:///./welcare.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="")
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    image: Mapped[str] = mapped_column(String(500), default="")
    stock: Mapped[int] = mapped_column(Integer, default=100)

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_code: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180))
    phone: Mapped[str] = mapped_column(String(40))
    address: Mapped[str] = mapped_column(String(500))
    subtotal: Mapped[int] = mapped_column(Integer)
    delivery_fee: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    payment_method: Mapped[str] = mapped_column(String(40))
    payment_status: Mapped[str] = mapped_column(String(40), default="demo_paid")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(Integer)
    product_name: Mapped[str] = mapped_column(String(120))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[int] = mapped_column(Integer)
    order: Mapped[Order] = relationship(back_populates="items")

Base.metadata.create_all(bind=engine)

def seed_products():
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            products = [
                Product(name="Reusable Sanitary Pad Set", description="Comfortable, washable reusable pads designed to support confident menstrual care.", category="pads", price=850, image="https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=85", stock=100),
                Product(name="Pocket Hand Sanitizer", description="A handy pocket-size sanitizer for everyday hand hygiene on the go.", category="sanitizer", price=250, image="https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=900&q=85", stock=150),
                Product(name="Monthly Care Bundle", description="A reusable pad set and pocket sanitizer together for everyday confidence.", category="bundle", price=1000, image="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85", stock=80),
            ]
            db.add_all(products)
            db.commit()
    finally:
        db.close()

seed_products()

app = FastAPI(title="WelCare SaniTech API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CartLine(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=50)

class CheckoutRequest(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=180)
    phone: str = Field(min_length=7, max_length=40)
    address: str = Field(min_length=5, max_length=500)
    payment_method: str = "demo"
    items: list[CartLine] = Field(min_length=1)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "WelCare SaniTech"}

@app.get("/api/products")
def products(db: Session = Depends(get_db)):
    return [{"id": p.id, "name": p.name, "description": p.description, "category": p.category, "price": p.price, "image": p.image, "stock": p.stock} for p in db.query(Product).all()]

@app.post("/api/assistant")
def assistant(payload: dict, db: Session = Depends(get_db)):
    # Transparent rule-based basket helper; no customer data is sent to an AI provider.
    lines = payload.get("items", [])
    count = sum(max(0, int(x.get("quantity", 0))) for x in lines)
    pad = db.query(Product).filter(Product.category == "pads").first()
    sanitizer = db.query(Product).filter(Product.category == "sanitizer").first()
    suggestions = []
    if count and pad and sanitizer:
        suggestions.append("A pad + sanitizer bundle supports both menstrual and hand hygiene.")
    return {"message": "Smart basket tip", "suggestions": suggestions, "item_count": count,
            "note": "Suggestions use simple product rules. The server calculates the final checkout total."}

@app.post("/api/checkout")
def checkout(data: CheckoutRequest, db: Session = Depends(get_db)):
    if data.payment_method != "demo":
        raise HTTPException(status_code=400, detail="Only the demo payment option is enabled. Connect a payment provider for live payments.")
    subtotal = 0
    prepared = []
    quantities = {}
    for line in data.items:
        quantities[line.product_id] = quantities.get(line.product_id, 0) + line.quantity
    for product_id, quantity in quantities.items():
        product = db.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} was not found")
        if quantity > product.stock:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
        subtotal += product.price * quantity
        prepared.append((product, quantity))
    delivery = 0 if subtotal >= 2000 else 150
    order = Order(order_code="WC-" + uuid4().hex[:8].upper(), customer_name=data.customer_name,
                  email=data.email, phone=data.phone, address=data.address, subtotal=subtotal,
                  delivery_fee=delivery, total=subtotal + delivery, payment_method="demo",
                  payment_status="demo_paid")
    for product, quantity in prepared:
        product.stock -= quantity
        order.items.append(OrderItem(product_id=product.id, product_name=product.name,
                                     quantity=quantity, unit_price=product.price))
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"order_code": order.order_code, "subtotal": order.subtotal, "delivery_fee": order.delivery_fee,
            "total": order.total, "currency": "KES", "payment_status": order.payment_status,
            "message": "Demo order saved successfully."}

@app.get("/api/orders/{order_code}")
def get_order(order_code: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_code == order_code).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"order_code": order.order_code, "customer_name": order.customer_name, "total": order.total,
            "payment_status": order.payment_status, "created_at": order.created_at.isoformat(),
            "items": [{"name": i.product_name, "quantity": i.quantity, "unit_price": i.unit_price} for i in order.items]}
