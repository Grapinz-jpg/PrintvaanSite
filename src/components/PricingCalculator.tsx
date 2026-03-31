import React, { useState, useMemo } from 'react';
import { X, Info, CheckCircle2, IndianRupee, ShoppingCart, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PricingCalculatorProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

const PRESET_SIZES = [
  { label: '2×4 ft', w: 2, h: 4 },
  { label: '4×6 ft', w: 4, h: 6 },
  { label: '6×8 ft', w: 6, h: 8 },
  { label: '8×10 ft', w: 8, h: 10 },
  { label: 'Custom', w: 0, h: 0 },
];

const ORIENTATIONS = [
  { label: '1:1', ratio: 1, name: 'Square' },
  { label: '16:9', ratio: 16 / 9, name: 'Landscape' },
  { label: '9:16', ratio: 9 / 16, name: 'Portrait' },
  { label: '3:1', ratio: 3, name: 'Wide Banner' },
  { label: '1:3', ratio: 1 / 3, name: 'Tall Banner' },
];

export default function PricingCalculator({ product, onClose, onAddToCart }: PricingCalculatorProps) {
  const [selectedSize, setSelectedSize] = useState(PRESET_SIZES[0]);
  const [customWidth, setCustomWidth] = useState(2);
  const [customHeight, setCustomHeight] = useState(4);
  const [orientation, setOrientation] = useState(ORIENTATIONS[1]);
  const [finishing, setFinishing] = useState(true);

  const width = selectedSize.label === 'Custom' ? customWidth : selectedSize.w;
  const height = selectedSize.label === 'Custom' ? customHeight : selectedSize.h;

  const area = width * height;
  const finishingCharge = finishing ? 50 : 0;
  const totalPrice = (area * product.basePricePerSqft) + finishingCharge;

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      productName: product.title,
      category: product.category,
      thumbnail: product.thumbnail,
      width,
      height,
      orientation: orientation.name,
      finishing,
      quantity: 1,
      ratePerSqft: product.basePricePerSqft,
      finishingCharge,
      totalPrice,
    };
    onAddToCart(cartItem);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20"
      >
        {/* SECTION A: Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-brand-navy tracking-tight">{product.title}</h2>
            <p className="text-[10px] text-brand-orange font-black uppercase tracking-[0.2em] mt-1">{product.category}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-2xl transition-all group">
            <X className="h-6 w-6 text-gray-400 group-hover:text-brand-navy" />
          </button>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-10">
            {/* SECTION B: Size Selection */}
            <section>
              <label className="text-xs font-black text-brand-navy/40 uppercase tracking-widest mb-4 block">Choose Size</label>
              <div className="flex flex-wrap gap-3">
                {PRESET_SIZES.map((size) => (
                  <button
                    key={size.label}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2",
                      selectedSize.label === size.label
                        ? "bg-brand-navy border-brand-navy text-white shadow-lg shadow-brand-navy/20"
                        : "bg-white border-gray-100 text-brand-navy hover:border-brand-orange/30"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {selectedSize.label === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4 mt-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Width (ft)</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Height (ft)</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold text-brand-navy focus:border-brand-orange focus:ring-0 transition-all outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* SECTION C: Orientation */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <label className="text-xs font-black text-brand-navy/40 uppercase tracking-widest block">Orientation</label>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-brand-orange bg-brand-orange/5 px-3 py-1.5 rounded-full">
                  <Info className="h-3 w-3" />
                  <span>Visual Preview</span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex flex-wrap gap-2 flex-1">
                  {ORIENTATIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setOrientation(opt)}
                      className={cn(
                        "px-4 py-3 rounded-xl font-bold text-xs transition-all border-2 flex flex-col items-center min-w-[80px]",
                        orientation.label === opt.label
                          ? "bg-brand-orange/5 border-brand-orange text-brand-orange"
                          : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                      )}
                    >
                      <span>{opt.label}</span>
                      <span className="text-[8px] opacity-60 mt-1">{opt.name}</span>
                    </button>
                  ))}
                </div>

                <div className="w-32 h-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center p-4">
                  <motion.div
                    animate={{ 
                      width: orientation.ratio >= 1 ? '100%' : `${orientation.ratio * 100}%`,
                      height: orientation.ratio <= 1 ? '100%' : `${(1/orientation.ratio) * 100}%`
                    }}
                    className="bg-brand-navy/10 border-2 border-brand-navy/20 rounded-lg shadow-inner"
                  />
                </div>
              </div>
            </section>

            {/* SECTION D: Finishing Options */}
            <section>
              <label className="text-xs font-black text-brand-navy/40 uppercase tracking-widest mb-4 block">Hemming & Eyelets (Corner Finishing)</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFinishing(true)}
                  className={cn(
                    "p-5 rounded-3xl border-2 transition-all text-left relative group",
                    finishing ? "border-brand-orange bg-brand-orange/5" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-bold text-sm", finishing ? "text-brand-orange" : "text-brand-navy")}>Yes — Hem & Eyelets</span>
                    {finishing && <CheckCircle2 className="h-5 w-5 text-brand-orange" />}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Metal corner rings + stitched edges</p>
                  <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                </button>

                <button
                  onClick={() => setFinishing(false)}
                  className={cn(
                    "p-5 rounded-3xl border-2 transition-all text-left relative",
                    !finishing ? "border-brand-navy bg-brand-navy/5" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-bold text-sm", !finishing ? "text-brand-navy" : "text-brand-navy/60")}>No — Plain Cut</span>
                    {!finishing && <CheckCircle2 className="h-5 w-5 text-brand-navy" />}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Raw edge cut, no stitching or holes</p>
                </button>
              </div>

              {finishing && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-gray-50 p-4 rounded-2xl flex items-start space-x-3"
                >
                  <Info className="h-4 w-4 text-brand-orange mt-0.5 shrink-0" />
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                    Includes stitched hem on all 4 sides + metal eyelets at corners for hanging. Recommended for outdoor banners.
                  </p>
                </motion.div>
              )}
            </section>

            {/* SECTION E: Price Summary Card */}
            <section className="bg-brand-orange/5 rounded-[2rem] p-8 border border-brand-orange/10">
              <div className="space-y-4">
                <div className="h-px bg-brand-orange/20 my-6" />
                <div className="flex justify-between items-center">
                  <span className="text-brand-navy font-black text-lg">Total Price</span>
                  <div className="flex items-center text-3xl font-black text-brand-orange">
                    <IndianRupee className="h-6 w-6 mr-1" />
                    <span>{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION F: Action Buttons */}
            <div className="space-y-4 pt-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-brand-navy text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-orange transition-all shadow-xl shadow-brand-navy/20 hover:shadow-brand-orange/20 flex items-center justify-center space-x-3"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart</span>
              </button>
              <button
                className="w-full bg-white text-brand-orange border-2 border-brand-orange py-4 rounded-2xl font-black text-sm hover:bg-brand-orange hover:text-white transition-all"
              >
                Request Custom Quote
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}