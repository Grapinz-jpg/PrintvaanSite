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
import FilesPage from './components/FilesPage';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { getProducts } from './services/db';
import { Product, Slide, CartItem, Order } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const heroSlides: Slide[] = [
  {
    id: 's1',
    image: 'https://deq64r0ss2hgl.cloudfront.net/images/product/non-tearable-banners-48099206359233.jpg',
    alt: 'Premium Flex Banners',
    category: 'Normal flex',
  },
  {
    id: 's2',
    image: 'https://orchiddigitals.com/wp-content/uploads/2015/05/custom-shape-cut-vinyl-stickers-1024x683.jpg.webp',
    alt: 'High Quality Vinyl Prints',
    category: 'Vinyl',
  },
  {
    id: 's3',
    image: 'https://cpimg.tistatic.com/10152499/b/4/Sunpack-Printing-Services..jpg',
    alt: 'Sun Pack Advertising',
    category: 'Sun pack printing',
  },
];

// ... (imports and heroSlides remain the same)

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
              // Ensure we are passing the function reference, not calling it
              return (
                <ProductCard
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  const handlePlaceOrder = async (orderData: any) => {
    try {
      const newOrder = {
        userId: auth.currentUser?.uid,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        items: cart.map(item => ({ ...item })),
        subtotal: orderData.subtotal,
        grandTotal: orderData.grandTotal,
        gst: orderData.gst,
        status: 'Processing',
        paymentMethod: orderData.paymentMethod,
        customerInfo: orderData.customerInfo,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), newOrder);
      
      setCart([]);
      toast.success('✅ Order Placed!', {
        className: 'bg-brand-navy text-white border-none rounded-2xl font-black text-sm',
      });
      navigate('/orders');
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
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
              // STRICT SETTER: Only sets if a valid product object is passed
              onProductSelect={(p: Product) => p && p.id ? setSelectedProduct(p) : null}
            />
          } />
          <Route path="/cart" element={
            <CartPage cart={cart} setCart={setCart} onPlaceOrder={handlePlaceOrder} />
          } />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {/* Footer remains the same */}

      <AnimatePresence>
        {/* Added strict check: selectedProduct?.id */}
        {selectedProduct && selectedProduct.id && (
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