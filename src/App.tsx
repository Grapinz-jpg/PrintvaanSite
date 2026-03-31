import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import SearchFilter from './components/SearchFilter';
import ProductCard from './components/ProductCard';
import PricingCalculator from './components/PricingCalculator';
import CartPage from './components/CartPage';
import OrdersPage from './components/OrdersPage';
import OrderDetailPage from './components/OrderDetailPage';
import { getProducts } from './services/db';
import { Product, Slide, CartItem, Order } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

const heroSlides: Slide[] = [
  {
    id: 's1',
    image: 'https://picsum.photos/seed/banner1/1920/600',
    alt: 'Premium Flex Banners',
    category: 'Normal flex',
  },
  {
    id: 's2',
    image: 'https://picsum.photos/seed/banner2/1920/600',
    alt: 'High Quality Vinyl Prints',
    category: 'Vinyl',
  },
  {
    id: 's3',
    image: 'https://picsum.photos/seed/banner3/1920/600',
    alt: 'Sun Pack Advertising',
    category: 'Sun pack printing',
  },
];

function HomePage({ products, loading, searchQuery, setSearchQuery, activeCategory, setActiveCategory, onProductSelect }: any) {
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <>
      <HeroCarousel 
        slides={heroSlides} 
        onCategorySelect={(cat) => setActiveCategory(cat)} 
      />
      
      <SearchFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black text-brand-navy tracking-tighter">
              {activeCategory === 'All' ? 'Our Products' : activeCategory}
            </h2>
            <div className="h-2 w-16 bg-brand-orange mt-2 rounded-full" />
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] hidden sm:block">
            Showing {filteredProducts.length} printing solutions
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-[2.5rem] h-80 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredProducts.map((product: Product) => {
              const Card = ProductCard as any;
              return (
                <Card
                  key={product.id}
                  product={product}
                  onViewPricing={onProductSelect}
                />
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <p className="text-gray-400 text-lg font-bold tracking-tight">No products found matching your criteria.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="mt-4 text-brand-orange font-black uppercase tracking-widest text-xs hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    setSelectedProduct(null);
    toast.success('Item added to cart!', {
      description: `${item.productName} has been added successfully.`,
      className: 'bg-brand-navy text-white border-none rounded-2xl font-bold',
    });
  };

  const handlePlaceOrder = (orderData: any) => {
    const newOrder: Order = {
      id: `PV-${new Date().getFullYear()}-${String(orders.length + 4).padStart(3, '0')}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: [...cart],
      subtotal: orderData.subtotal,
      grandTotal: orderData.grandTotal,
      gst: orderData.gst,
      status: 'Pending',
      paymentMethod: orderData.paymentMethod,
      customerInfo: orderData.customerInfo,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    toast.success('✅ Order Placed! We\'ll confirm shortly.', {
      className: 'bg-brand-navy text-white border-none rounded-2xl font-black text-sm',
    });
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-brand-navy selection:bg-brand-orange selection:text-white">
      <Navbar cartCount={cart.length} />
      <Toaster position="top-center" expand={true} richColors />
      
      <main>
        <Routes>
          <Route path="/" element={
            <HomePage 
              products={products}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onProductSelect={(p: Product) => setSelectedProduct(p)}
            />
          } />
          <Route path="/cart" element={
            <CartPage 
              cart={cart} 
              setCart={setCart} 
              onPlaceOrder={handlePlaceOrder}
            />
          } />
          <Route path="/orders" element={<OrdersPage customOrders={orders} />} />
          <Route path="/orders/:id" element={<OrderDetailPage customOrders={orders} />} />
        </Routes>
      </main>

      <footer className="bg-brand-navy text-white py-20 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div>
              <span className="text-3xl font-black text-brand-orange tracking-tighter mb-6 block">PrintVaan</span>
              <p className="text-white/40 font-medium leading-relaxed">
                Professional banner & flex printing solutions for the modern Indian industry. Quality you can trust, delivered on time.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-black mb-6 tracking-tight">Quick Links</h4>
              <ul className="space-y-4 text-white/40 font-bold text-sm uppercase tracking-widest">
                <li><Link to="/" className="hover:text-brand-orange transition-colors">Products</Link></li>
                <li><Link to="/orders" className="hover:text-brand-orange transition-colors">My Orders</Link></li>
                <li><Link to="/cart" className="hover:text-brand-orange transition-colors">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-black mb-6 tracking-tight">Contact Us</h4>
              <p className="text-white/40 font-medium leading-relaxed">
                123, Print Street, Mumbai, Maharashtra<br />
                Phone: +91 98765 43210<br />
                Email: hello@printvaan.com
              </p>
            </div>
          </div>
          <div className="h-px bg-white/5 mb-12" />
          <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center">
            © 2026 PrintVaan Wholesale Printing. All rights reserved.
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {selectedProduct && (
          <PricingCalculator
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
