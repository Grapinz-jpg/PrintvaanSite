import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, IndianRupee, Home, Store, CreditCard, Landmark, Wallet, HandCoins, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import Breadcrumbs from './Breadcrumbs';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CartPageProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onPlaceOrder: (orderData: any) => void;
}

type DeliveryMethod = 'Home Delivery' | 'Shop Pickup';
type PaymentMethod = 'UPI / QR Code' | 'Net Banking' | 'Credit / Debit Card' | 'Pay on Pickup';

import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { toast } from 'sonner';

export default function CartPage({ cart, setCart, onPlaceOrder }: CartPageProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Home Delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const navigate = useNavigate();
  
  // Home Delivery fields
  const [address, setAddress] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pinCode: '',
  });
  
  // Shop Pickup fields - Now includes full address
  const [pickupDetails, setPickupDetails] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pinCode: '',
  });
  
  const [pinError, setPinError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pickupPinError, setPickupPinError] = useState('');
  const [pickupPhoneError, setPickupPhoneError] = useState('');

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice * item.quantity, 0);
  const grandTotal = subtotal;

  const handlePinBlur = () => {
    if (address.pinCode && !/^\d{6}$/.test(address.pinCode)) {
      setPinError('PIN Code must be exactly 6 digits');
    } else {
      setPinError('');
    }
  };

  const handlePhoneBlur = () => {
    if (address.phone && !/^\d{10}$/.test(address.phone)) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handlePickupPinBlur = () => {
    if (pickupDetails.pinCode && !/^\d{6}$/.test(pickupDetails.pinCode)) {
      setPickupPinError('PIN Code must be exactly 6 digits');
    } else {
      setPickupPinError('');
    }
  };

  const handlePickupPhoneBlur = () => {
    if (pickupDetails.phone && !/^\d{10}$/.test(pickupDetails.phone)) {
      setPickupPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPickupPhoneError('');
    }
  };

  const isAddressValid = () => {
    if (deliveryMethod === 'Shop Pickup') {
      return (
        pickupDetails.name &&
        pickupDetails.email &&
        pickupDetails.phone &&
        pickupDetails.line1 &&
        pickupDetails.city &&
        pickupDetails.state &&
        pickupDetails.pinCode &&
        /^\d{10}$/.test(pickupDetails.phone) &&
        /^\d{6}$/.test(pickupDetails.pinCode)
      );
    }
    return (
      address.name &&
      address.email &&
      address.phone &&
      address.line1 &&
      address.city &&
      address.state &&
      /^\d{10}$/.test(address.phone) &&
      /^\d{6}$/.test(address.pinCode)
    );
  };

  const isOrderEnabled = cart.length > 0 && isAddressValid() && paymentMethod !== '';

  // Reset payment method if it was "Pay on Pickup" but we switched to "Home Delivery"
  useEffect(() => {
    if (deliveryMethod === 'Home Delivery' && paymentMethod === 'Pay on Pickup') {
      setPaymentMethod('');
    }
  }, [deliveryMethod, paymentMethod]);

  const handlePlaceOrderClick = async () => {
    if (!isOrderEnabled) return;

    if (!auth.currentUser) {
      navigate('/login');
      toast.error('Please login to place an order.');
      return;
    }

    if (!auth.currentUser.emailVerified) {
      navigate('/login');
      toast.error('Please verify your email to place an order.');
      return;
    }
    
    setIsPlacingOrder(true);
    
    // Simulate a small delay for "processing"
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const orderData = {
      subtotal,
      grandTotal,
      gst: subtotal * 0.18,
      paymentMethod,
      customerInfo: deliveryMethod === 'Home Delivery' ? {
        name: address.name,
        email: address.email,
        phone: address.phone,
        addressLine1: address.line1,
        addressLine2: address.line2,
        city: address.city,
        state: address.state,
        pinCode: address.pinCode,
        isPickup: false,
      } : {
        name: pickupDetails.name,
        email: pickupDetails.email,
        phone: pickupDetails.phone,
        addressLine1: pickupDetails.line1,
        addressLine2: pickupDetails.line2,
        city: pickupDetails.city,
        state: pickupDetails.state,
        pinCode: pickupDetails.pinCode,
        isPickup: true,
      }
    };
    
    onPlaceOrder(orderData);
    setIsPlacingOrder(false);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Breadcrumbs />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-16 border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
            <ShoppingBag className="h-12 w-12 text-gray-200" />
          </div>
          <h2 className="text-3xl font-black text-brand-navy mb-4 tracking-tight">No items yet. Start browsing!</h2>
          <p className="text-gray-400 font-medium mb-10 max-w-md">Your cart is feeling a bit light. Explore our premium printing solutions and add some color to it!</p>
          <Link
            to="/"
            className="bg-brand-orange text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-brand-navy transition-all shadow-xl shadow-brand-orange/20 flex items-center space-x-3"
          >
            <span>Browse Products</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  const paymentOptions = [
    { id: 'UPI / QR Code', name: 'UPI / QR Code', subtitle: 'GPay, PhonePe, Paytm', icon: Wallet },
    { id: 'Net Banking', name: 'Net Banking', subtitle: 'All major Indian banks', icon: Landmark },
    { id: 'Credit / Debit Card', name: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: CreditCard },
    ...(deliveryMethod === 'Shop Pickup' ? [{ id: 'Pay on Pickup', name: 'Pay on Pickup', subtitle: 'Pay when you collect', icon: HandCoins }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Breadcrumbs />
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Column */}
        <div className="flex-1 space-y-12">
          {/* Cart Items */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-black text-brand-navy tracking-tighter">Your Cart</h1>
              <span className="bg-brand-orange/10 text-brand-orange px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row items-center gap-6 group"
                  >
                    <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-gray-50">
                      <img src={item.thumbnail} alt={item.productName} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-black text-brand-navy tracking-tight truncate">{item.productName}</h3>
                          <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">{item.category}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                        <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase">
                          <span className="mr-2">Size:</span>
                          <span className="text-brand-navy">{item.width} × {item.height} ft</span>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase">
                          <span className="mr-2">Orientation:</span>
                          <span className="text-brand-navy">{item.orientation}</span>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase">
                          <span className="mr-2">Finishing:</span>
                          <span className={item.finishing ? "text-green-600" : "text-gray-400"}>{item.finishing ? 'Yes' : 'No'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-brand-navy"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center font-black text-brand-navy">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-brand-navy"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Line Total</p>
                          <div className="flex items-center text-xl font-black text-brand-orange">
                            <IndianRupee className="h-4 w-4 mr-0.5" />
                            <span>{(item.totalPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Delivery Details */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-brand-navy mb-8 tracking-tight">Delivery Details</h2>
            
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setDeliveryMethod('Home Delivery')}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-3 p-5 rounded-2xl border-2 transition-all font-black text-sm",
                  deliveryMethod === 'Home Delivery'
                    ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                )}
              >
                <Home className="h-5 w-5" />
                <span>Home Delivery</span>
              </button>
              <button
                onClick={() => setDeliveryMethod('Shop Pickup')}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-3 p-5 rounded-2xl border-2 transition-all font-black text-sm",
                  deliveryMethod === 'Shop Pickup'
                    ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                )}
              >
                <Store className="h-5 w-5" />
                <span>Shop Pickup</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {deliveryMethod === 'Home Delivery' ? (
                <motion.div
                  key="home-delivery"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-8 rounded-[2rem]"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name*</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address*</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Phone Number*</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={address.phone}
                      onBlur={handlePhoneBlur}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                      className={cn(
                        "w-full bg-white border-[1.5px] rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300",
                        phoneError ? "border-red-500" : "border-gray-200"
                      )}
                    />
                    {phoneError && <p className="text-[10px] text-red-500 font-bold ml-2">{phoneError}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Address Line 1*</label>
                    <input
                      type="text"
                      placeholder="House No, Building, Street"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Address Line 2 (Landmark)</label>
                    <input
                      type="text"
                      placeholder="Near, Opposite, etc."
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">City*</label>
                    <input
                      type="text"
                      placeholder="City name"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">State*</label>
                    <input
                      type="text"
                      placeholder="State name"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">PIN Code* (6 digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="400001"
                      value={address.pinCode}
                      onBlur={handlePinBlur}
                      onChange={(e) => setAddress({ ...address, pinCode: e.target.value.replace(/\D/g, '') })}
                      className={cn(
                        "w-full bg-white border-[1.5px] rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300",
                        pinError ? "border-red-500" : "border-gray-200"
                      )}
                    />
                    {pinError && <p className="text-[10px] text-red-500 font-bold ml-2">{pinError}</p>}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="shop-pickup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-8 rounded-[2rem]"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name*</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={pickupDetails.name}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, name: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address*</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={pickupDetails.email}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, email: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Phone Number*</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={pickupDetails.phone}
                      onBlur={handlePickupPhoneBlur}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, phone: e.target.value.replace(/\D/g, '') })}
                      className={cn(
                        "w-full bg-white border-[1.5px] rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300",
                        pickupPhoneError ? "border-red-500" : "border-gray-200"
                      )}
                    />
                    {pickupPhoneError && <p className="text-[10px] text-red-500 font-bold ml-2">{pickupPhoneError}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Address Line 1*</label>
                    <input
                      type="text"
                      placeholder="House No, Building, Street"
                      value={pickupDetails.line1}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, line1: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Address Line 2 (Landmark)</label>
                    <input
                      type="text"
                      placeholder="Near, Opposite, etc."
                      value={pickupDetails.line2}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, line2: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">City*</label>
                    <input
                      type="text"
                      placeholder="City name"
                      value={pickupDetails.city}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, city: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">State*</label>
                    <input
                      type="text"
                      placeholder="State name"
                      value={pickupDetails.state}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, state: e.target.value })}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">PIN Code* (6 digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="400001"
                      value={pickupDetails.pinCode}
                      onBlur={handlePickupPinBlur}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, pinCode: e.target.value.replace(/\D/g, '') })}
                      className={cn(
                        "w-full bg-white border-[1.5px] rounded-[10px] px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none text-sm placeholder:text-gray-300",
                        pickupPinError ? "border-red-500" : "border-gray-200"
                      )}
                    />
                    {pickupPinError && <p className="text-[10px] text-red-500 font-bold ml-2">{pickupPinError}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-brand-navy mb-8 tracking-tight">Payment Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = paymentMethod === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id as PaymentMethod)}
                    className={cn(
                      "flex items-center p-5 rounded-2xl border-2 transition-all text-left group",
                      isSelected
                        ? "border-brand-orange bg-brand-orange/5"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors",
                      isSelected ? "bg-brand-orange text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={cn("font-black text-sm", isSelected ? "text-brand-orange" : "text-brand-navy")}>{option.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{option.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {paymentMethod && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100"
                >
                  <div className="flex items-start space-x-3 text-gray-500">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-brand-orange" />
                    <p className="text-xs font-medium italic leading-relaxed">
                      Payment integration coming soon. Your order will be confirmed manually by our team after you place it.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Summary Panel */}
        <div className="lg:w-96">
          <div className="bg-brand-navy rounded-[2.5rem] p-8 text-white shadow-2xl sticky top-24">
            <h2 className="text-2xl font-black mb-8 tracking-tight">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-white/60 font-bold text-sm">
                <span>Subtotal</span>
                <span className="text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10 my-6" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-black">Grand Total</span>
                <div className="flex items-center text-2xl font-black text-brand-orange">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  <span>{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              disabled={!isOrderEnabled || isPlacingOrder}
              onClick={handlePlaceOrderClick}
              className={cn(
                "w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl mb-6 flex items-center justify-center space-x-3",
                isOrderEnabled && !isPlacingOrder
                  ? "bg-brand-orange text-white hover:bg-white hover:text-brand-navy shadow-brand-orange/20"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              )}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Proceed to Order</span>
              )}
            </button>

            <Link
              to="/"
              className="block text-center text-white/40 hover:text-white font-bold text-sm transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}