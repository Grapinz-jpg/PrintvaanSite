import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IndianRupee, 
  X, 
  Plus, 
  Minus, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  Scissors,
  CornerDownRight,
  Image as ImageIcon,
  CheckCircle
} from 'lucide-react';
import { Product } from '../types';

interface PricingModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (config: any) => void;
}

type Orientation = '1:1' | '16:9' | '9:16' | '3:1' | '1:3';
type SizePreset = '2×4' | '4×6' | '6×8' | '8×10' | 'Custom';

export default function PricingModal({ product, onClose, onAddToCart }: PricingModalProps) {
  const [selectedSize, setSelectedSize] = useState<SizePreset>('4×6');
  const [customWidth, setCustomWidth] = useState<number>(4);
  const [customHeight, setCustomHeight] = useState<number>(6);
  const [orientation, setOrientation] = useState<Orientation>('16:9');
  const [hemmingOption, setHemmingOption] = useState<'Yes' | 'No'>('No');
  const [uploadedDesign, setUploadedDesign] = useState<File | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  
  // For Flex products only
  const flexCategories = ['Sunpack Boards', 'Normal Flex', 'Star Flex', 'Flex Banner', 'Vinyl Flex'];
  const isFlexProduct = flexCategories.some(category => 
    product.category?.toLowerCase().includes(category.toLowerCase())
  );

  const getDimensions = () => {
    if (selectedSize === 'Custom') {
      return { width: customWidth, height: customHeight };
    }
    const [width, height] = selectedSize.split('×').map(Number);
    return { width, height };
  };

  const { width, height } = getDimensions();
  const area = width * height;
  const totalPrice = product.basePricePerSqft * area;

  const handleAddToCart = () => {
    onAddToCart({
      productId: product.id,
      productName: product.title,
      category: product.category,
      thumbnail: product.thumbnail,
      width,
      height,
      orientation,
      finishing: isFlexProduct ? hemmingOption === 'Yes' : false,
      quantity: 1,
      totalPrice: product.basePricePerSqft,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedDesign(file);
      setShowUploadOptions(false);
    }
  };

  const handleEditDesign = () => {
    setShowUploadOptions(true);
  };

  const handleRemoveDesign = () => {
    setUploadedDesign(null);
    setShowUploadOptions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-6 flex justify-between items-center z-10 rounded-t-[2rem]">
          <div>
            <h2 className="text-2xl font-black text-brand-navy tracking-tight">{product.title}</h2>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{product.category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Options */}
            <div className="space-y-8">
              {/* Size Selection */}
              <div>
                <h3 className="text-sm font-black text-brand-navy mb-4 uppercase tracking-wider">Choose Size</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {(['2×4', '4×6', '6×8', '8×10', 'Custom'] as SizePreset[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        py-3 px-4 rounded-xl font-bold text-sm transition-all
                        ${selectedSize === size 
                          ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                          : 'bg-gray-50 text-brand-navy hover:bg-gray-100 border border-gray-100'
                        }
                      `}
                    >
                      {size === 'Custom' ? 'Custom Size' : size}
                    </button>
                  ))}
                </div>
                
                {selectedSize === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex gap-4 mt-4"
                  >
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Width (ft)</label>
                      <input
                        type="number"
                        min={1}
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(1, Number(e.target.value)))}
                        className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Height (ft)</label>
                      <input
                        type="number"
                        min={1}
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(1, Number(e.target.value)))}
                        className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Orientation */}
              <div>
                <h3 className="text-sm font-black text-brand-navy mb-4 uppercase tracking-wider">Orientation</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { value: '1:1', label: 'Square', preview: '⬛', ratio: '1:1' },
                    { value: '16:9', label: 'Landscape', preview: '📺', ratio: '16:9' },
                    { value: '9:16', label: 'Portrait', preview: '📱', ratio: '9:16' },
                    { value: '3:1', label: 'Wide Banner', preview: '🎬', ratio: '3:1' },
                    { value: '1:3', label: 'Tall Banner', preview: '📏', ratio: '1:3' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOrientation(opt.value as Orientation)}
                      className={`
                        p-4 rounded-xl text-center transition-all
                        ${orientation === opt.value
                          ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                          : 'bg-gray-50 text-brand-navy hover:bg-gray-100 border border-gray-100'
                        }
                      `}
                    >
                      <div className="text-2xl mb-1">{opt.preview}</div>
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[8px] opacity-70 mt-1">{opt.ratio}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hemming & Eyelets - Column Radio Buttons */}
              {isFlexProduct && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-brand-orange/10 rounded-lg">
                      <Scissors className="h-4 w-4 text-brand-orange" />
                    </div>
                    <h3 className="text-sm font-black text-brand-navy uppercase tracking-wider">
                      Hemming & Eyelets (Corner Finishing)
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Yes Option */}
                    <label className={`
                      flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${hemmingOption === 'Yes' 
                        ? 'border-brand-orange bg-brand-orange/5' 
                        : 'border-gray-100 hover:border-gray-200'
                      }
                    `}>
                      <input
                        type="radio"
                        name="hemming"
                        value="Yes"
                        checked={hemmingOption === 'Yes'}
                        onChange={(e) => setHemmingOption(e.target.value as 'Yes')}
                        className="mt-1 w-4 h-4 text-brand-orange focus:ring-brand-orange accent-brand-orange"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-brand-navy">Yes — Hem & Eyelets</span>
                          <span className="text-xs text-brand-orange font-bold">+ ₹0.50/sqft</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Metal corner rings + stitched edges
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Includes stitched hem on all 4 sides</span>
                          <span className="mx-1">•</span>
                          <CheckCircle className="h-3 w-3" />
                          <span>Metal eyelets at corners for hanging</span>
                        </div>
                      </div>
                    </label>

                    {/* No Option */}
                    <label className={`
                      flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${hemmingOption === 'No' 
                        ? 'border-brand-orange bg-brand-orange/5' 
                        : 'border-gray-100 hover:border-gray-200'
                      }
                    `}>
                      <input
                        type="radio"
                        name="hemming"
                        value="No"
                        checked={hemmingOption === 'No'}
                        onChange={(e) => setHemmingOption(e.target.value as 'No')}
                        className="mt-1 w-4 h-4 text-brand-orange focus:ring-brand-orange accent-brand-orange"
                      />
                      <div className="ml-3 flex-1">
                        <span className="font-black text-brand-navy">No — Plain Cut</span>
                        <p className="text-xs text-gray-500 mt-1">
                          Raw edge cut, no stitching or holes
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  <p className="mt-4 text-[10px] text-brand-orange font-medium flex items-center gap-1">
                    <CornerDownRight className="h-3 w-3" />
                    <span>Recommended for outdoor banners</span>
                  </p>
                </div>
              )}

              {/* Upload Design Section */}
              <div>
                <h3 className="text-sm font-black text-brand-navy mb-4 uppercase tracking-wider">Upload Your Design</h3>
                
                {!uploadedDesign ? (
                  <div className="relative">
                    <input
                      type="file"
                      id="design-upload"
                      accept="image/*,.pdf,.ai,.eps"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="design-upload"
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 transition-all group"
                    >
                      <div className="p-3 bg-gray-50 rounded-full mb-3 group-hover:bg-brand-orange/10 transition-colors">
                        <Upload className="h-6 w-6 text-gray-400 group-hover:text-brand-orange" />
                      </div>
                      <p className="font-bold text-brand-navy mb-1">Click to upload</p>
                      <p className="text-[10px] text-gray-400">JPG, PNG, PDF, AI, EPS (Max 10MB)</p>
                    </label>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white rounded-xl">
                        <ImageIcon className="h-8 w-8 text-brand-orange" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-brand-navy text-sm truncate">{uploadedDesign.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {(uploadedDesign.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditDesign}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-brand-navy hover:border-brand-orange hover:text-brand-orange transition-all"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={handleRemoveDesign}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-red-500 hover:border-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Column - Preview & Total */}
            <div>
              <div className="sticky top-8">
                {/* Visual Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-brand-navy uppercase tracking-wider">Visual Preview</h3>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div 
                    className="bg-white rounded-xl shadow-md mx-auto flex items-center justify-center overflow-hidden"
                    style={{
                      width: '100%',
                      aspectRatio: width && height ? `${width}/${height}` : '16/9',
                      maxHeight: '200px'
                    }}
                  >
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2">
                        {orientation === '16:9' && '📺'}
                        {orientation === '9:16' && '📱'}
                        {orientation === '1:1' && '⬛'}
                        {orientation === '3:1' && '🎬'}
                        {orientation === '1:3' && '📏'}
                      </div>
                      <p className="text-xs font-bold text-gray-400">
                        {width} × {height} ft
                      </p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {orientation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-400 font-bold">
                      Preview is for reference only
                    </p>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-brand-navy rounded-2xl p-6 text-white">
                  <h3 className="text-sm font-black mb-4 uppercase tracking-wider opacity-60">Price Summary</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Size:</span>
                      <span className="font-bold">{width} × {height} ft</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Area:</span>
                      <span className="font-bold">{area} sq ft</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Base Price:</span>
                      <span className="font-bold">₹{product.basePricePerSqft}/sqft</span>
                    </div>
                    
                    {isFlexProduct && hemmingOption === 'Yes' && (
                      <div className="flex justify-between text-sm">
                        <span className="opacity-60">Hemming & Eyelets:</span>
                        <span className="font-bold text-brand-orange">+₹{(area * 0.5).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="h-px bg-white/10 my-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black">Total Price</span>
                      <div className="flex items-center text-2xl font-black text-brand-orange">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        <span>
                          {isFlexProduct && hemmingOption === 'Yes'
                            ? (totalPrice + (area * 0.5)).toFixed(2)
                            : totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-brand-orange text-white py-4 rounded-xl font-black text-lg hover:bg-white hover:text-brand-navy transition-all shadow-lg shadow-brand-orange/20"
                  >
                    Add to Cart
                  </button>
                  
                  <p className="text-center text-[10px] opacity-40 mt-4">
                    GST will be calculated at checkout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}