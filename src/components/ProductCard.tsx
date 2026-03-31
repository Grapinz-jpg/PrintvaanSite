import React from 'react';
import { IndianRupee, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onViewPricing: (product: Product) => void;
}

export default function ProductCard({ product, onViewPricing }: ProductCardProps) {
  return (
    <div className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-brand-orange/10 transition-all duration-500 hover:-translate-y-2">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={product.thumbnail} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-1">
              {product.category}
            </p>
            <h3 className="text-xl font-black text-brand-navy tracking-tight group-hover:text-brand-orange transition-colors">
              {product.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Starting from</span>
            <div className="flex items-center text-xl font-black text-brand-navy">
              <IndianRupee className="h-4 w-4 mr-0.5 text-brand-orange" />
              <span>{product.basePricePerSqft}</span>
              <span className="text-xs text-gray-400 ml-1 font-bold">/sq.ft</span>
            </div>
          </div>

          {/* THE CRITICAL FIX IS BELOW: () => onViewPricing(product) */}
          <button
            onClick={() => onViewPricing(product)}
            className="bg-gray-50 hover:bg-brand-orange text-brand-navy hover:text-white p-4 rounded-2xl transition-all duration-300 hover:scale-110 group/btn shadow-sm"
          >
            <Eye className="h-5 w-5 transition-transform group-hover/btn:rotate-12" />
          </button>
        </div>
      </div>
    </div>
  );
}