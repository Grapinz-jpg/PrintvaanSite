import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  AlertCircle,
  Square,
  Monitor,
  Smartphone,
  Film,
  LayoutTemplate,
  FileImage,
  Archive,
  XCircle,
  Printer,
  Loader2,
  Cloud,
  Link2
} from 'lucide-react';
import { Product } from '../types';
import { auth, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

declare global {
  interface Window {
    gapi: any;
    google: any;
    onGoogleApiLoad: () => void;
  }
}

interface PricingCalculatorProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (config: any) => void;
}

type Orientation = '1:1' | '16:9' | '9:16' | '3:1' | '1:3';
type SizePreset = '2×4' | '4×6' | '6×8' | '8×10' | 'Custom';
type PrintingType = 'Solvent' | 'Eco Solvent';

interface DesignFile {
  id: string;
  file?: File;
  name: string;
  size: number;
  preview?: string;
  storageUrl?: string;
  uploadProgress?: number;
  width: number;
  height: number;
  orientation: Orientation;
  isFromDrive?: boolean;
  driveFileId?: string;
}

export default function PricingCalculator({ product, onClose, onAddToCart }: PricingCalculatorProps) {
  const [selectedSize, setSelectedSize] = useState<SizePreset>('4×6');
  const [customWidth, setCustomWidth] = useState<number>(4);
  const [customHeight, setCustomHeight] = useState<number>(6);
  const [orientation, setOrientation] = useState<Orientation>('16:9');
  const [printingType, setPrintingType] = useState<PrintingType>('Solvent');
  const [hemmingOption, setHemmingOption] = useState<'Yes' | 'No'>('No');
  const [designs, setDesigns] = useState<DesignFile[]>([]);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  
  const MAX_DESIGNS = 5;
  
  // For Flex products only
  const flexCategories = ['Sunpack Boards', 'Normal Flex', 'Star Flex', 'Flex Banner', 'Vinyl Flex'];
  const isFlexProduct = flexCategories.some(category => 
    product.category?.toLowerCase().includes(category.toLowerCase())
  );

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getDimensions = () => {
    if (selectedSize === 'Custom') {
      return { width: customWidth, height: customHeight };
    }
    const [width, height] = selectedSize.split('×').map(Number);
    return { width, height };
  };

  const { width, height } = getDimensions();
  const area = width * height;
  const baseTotal = product.basePricePerSqft * area;
  const hemmingCharge = (isFlexProduct && hemmingOption === 'Yes') ? area * 0.5 : 0;
  const totalPrice = baseTotal + hemmingCharge;

  // Load Google Drive API script
  const loadGoogleDriveAPI = () => {
    return new Promise((resolve) => {
      if (window.gapi) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          await window.gapi.client.init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.readonly'
          });
          resolve(true);
        });
      };
      document.body.appendChild(script);
    });
  };

  // Open Google Drive Picker
  const openDrivePicker = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to upload designs');
      return;
    }

    try {
      await loadGoogleDriveAPI();
      
      // Create and load Google Picker
      const pickerScript = document.createElement('script');
      pickerScript.src = 'https://apis.google.com/js/api.js?onload=onGoogleApiLoad';
      document.body.appendChild(pickerScript);

      window.onGoogleApiLoad = () => {
        const picker = new window.google.picker.PickerBuilder()
          .addView(new window.google.picker.DocsView()
            .setIncludeFolders(true)
            .setMimeTypes('image/jpeg,image/png,image/jpg,application/pdf,application/postscript,application/illustrator')
            .setSelectFolderEnabled(false))
          .setOAuthToken(window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
          .setDeveloperKey(process.env.REACT_APP_GOOGLE_API_KEY)
          .setCallback((data) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const file = data.docs[0];
              handleDriveFileSelected(file);
            }
          })
          .build();
        picker.setVisible(true);
      };
    } catch (error) {
      console.error('Error opening Drive picker:', error);
      toast.error('Failed to open Google Drive. Please check your configuration.');
    }
  };

  // Handle file selected from Google Drive
  const handleDriveFileSelected = async (driveFile: any) => {
    if (!auth.currentUser) return;

    try {
      const designId = editingDesignId || Date.now().toString();
      const fileName = driveFile.name;
      const fileSize = driveFile.sizeBytes || 0;
      const fileId = driveFile.id;
      const mimeType = driveFile.mimeType;

      // Get the file from Google Drive
      const accessToken = window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
      
      // First, get the file content as blob
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: mimeType });

      if (fileSize > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Upload to Firebase Storage
      const storageRef = ref(storage, `designs/${auth.currentUser.uid}/${Date.now()}_${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Create initial design entry
      const initialDesign: DesignFile = {
        id: designId,
        file: file,
        name: fileName,
        size: fileSize,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadProgress: 0,
        width: width,
        height: height,
        orientation: orientation,
        isFromDrive: true,
        driveFileId: fileId
      };

      if (editingDesignId) {
        setDesigns(prev => prev.map(d => d.id === editingDesignId ? initialDesign : d));
      } else {
        setDesigns(prev => [...prev, initialDesign]);
      }

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setDesigns(prev => prev.map(d => d.id === designId ? { ...d, uploadProgress: progress } : d));
        }, 
        (error) => {
          console.error("Upload error:", error);
          toast.error("Upload failed: " + error.message);
          setDesigns(prev => prev.filter(d => d.id !== designId));
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setDesigns(prev => prev.map(d => d.id === designId ? { ...d, storageUrl: downloadURL, uploadProgress: 100 } : d));
          toast.success("Design uploaded successfully from Google Drive!");
          setShowUploadSection(false);
          setShowDrivePicker(false);
          setEditingDesignId(null);
          setDriveUrl('');
          setDriveFileName('');
        }
      );
      
    } catch (error) {
      console.error("Error processing Drive file:", error);
      toast.error("Failed to process file from Google Drive");
    }
  };

  // Alternative: Manual URL input from Google Drive
  const handleDriveUrlSubmit = async () => {
    if (!driveUrl.trim()) {
      toast.error('Please enter a Google Drive URL');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Please login to upload designs');
      return;
    }

    try {
      // Extract file ID from Google Drive URL
      const fileIdMatch = driveUrl.match(/[-\w]{25,}/);
      if (!fileIdMatch) {
        toast.error('Invalid Google Drive URL');
        return;
      }

      const fileId = fileIdMatch[0];
      const designId = editingDesignId || Date.now().toString();
      
      // Get file metadata from Drive API
      const accessToken = window.gapi?.auth2?.getAuthInstance()?.currentUser?.get()?.getAuthResponse()?.access_token;
      
      if (!accessToken) {
        // If not authenticated, try to authenticate first
        await loadGoogleDriveAPI();
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signIn();
        const newAccessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        
        // Fetch file metadata
        const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType`, {
          headers: {
            'Authorization': `Bearer ${newAccessToken}`
          }
        });
        
        const metadata = await metadataResponse.json();
        
        // Get file content
        const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            'Authorization': `Bearer ${newAccessToken}`
          }
        });
        
        const blob = await fileResponse.blob();
        const file = new File([blob], metadata.name, { type: metadata.mimeType });

        // Upload to Firebase
        const storageRef = ref(storage, `designs/${auth.currentUser.uid}/${Date.now()}_${metadata.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const initialDesign: DesignFile = {
          id: designId,
          file: file,
          name: metadata.name,
          size: metadata.size,
          preview: metadata.mimeType.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          uploadProgress: 0,
          width: width,
          height: height,
          orientation: orientation,
          isFromDrive: true,
          driveFileId: fileId
        };

        if (editingDesignId) {
          setDesigns(prev => prev.map(d => d.id === editingDesignId ? initialDesign : d));
        } else {
          setDesigns(prev => [...prev, initialDesign]);
        }

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setDesigns(prev => prev.map(d => d.id === designId ? { ...d, uploadProgress: progress } : d));
          }, 
          (error) => {
            console.error("Upload error:", error);
            toast.error("Upload failed: " + error.message);
            setDesigns(prev => prev.filter(d => d.id !== designId));
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setDesigns(prev => prev.map(d => d.id === designId ? { ...d, storageUrl: downloadURL, uploadProgress: 100 } : d));
            toast.success("Design uploaded successfully from Google Drive!");
            setShowUploadSection(false);
            setEditingDesignId(null);
            setDriveUrl('');
            setDriveFileName('');
          }
        );
      }
    } catch (error) {
      console.error("Error processing Drive URL:", error);
      toast.error("Failed to process Google Drive URL");
    }
  };

  const handleAddDesign = () => {
    if (designs.length >= MAX_DESIGNS) {
      alert(`Maximum ${MAX_DESIGNS} designs allowed per order`);
      return;
    }
    setEditingDesignId(null);
    setShowUploadSection(true);
  };

  const handleEditDesign = (designId: string) => {
    setEditingDesignId(designId);
    setShowUploadSection(true);
  };

  const handleRemoveDesign = (designId: string) => {
    setDesigns(prev => prev.filter(d => d.id !== designId));
    if (editingDesignId === designId) {
      setEditingDesignId(null);
      setShowUploadSection(false);
    }
    if (selectedDesignId === designId) {
      setSelectedDesignId(null);
    }
  };

  const handleSelectDesign = (designId: string) => {
    const selectedDesign = designs.find(d => d.id === designId);
    if (selectedDesign && selectedDesignId !== designId) {
      setSelectedDesignId(designId);
      setCustomWidth(selectedDesign.width);
      setCustomHeight(selectedDesign.height);
      setOrientation(selectedDesign.orientation);
      const presetSizes = ['2×4', '4×6', '6×8', '8×10'];
      const matchedPreset = presetSizes.find(preset => {
        const [w, h] = preset.split('×').map(Number);
        return w === selectedDesign.width && h === selectedDesign.height;
      });
      setSelectedSize(matchedPreset ? matchedPreset as SizePreset : 'Custom');
    } else if (selectedDesignId === designId) {
      setSelectedDesignId(null);
    }
  };

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!auth.currentUser) {
        toast.error('Please login to upload designs');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/postscript', 'application/illustrator'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(ai|eps)$/i)) {
        toast.error('Please upload JPG, PNG, PDF, AI, or EPS files');
        return;
      }

      const designId = editingDesignId || Date.now().toString();
      const storageRef = ref(storage, `designs/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      const initialDesign: DesignFile = {
        id: designId,
        file: file,
        name: file.name,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadProgress: 0,
        width: width,
        height: height,
        orientation: orientation,
      };

      if (editingDesignId) {
        setDesigns(prev => prev.map(d => d.id === editingDesignId ? initialDesign : d));
      } else {
        setDesigns(prev => [...prev, initialDesign]);
      }

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setDesigns(prev => prev.map(d => d.id === designId ? { ...d, uploadProgress: progress } : d));
        }, 
        (error) => {
          console.error("Upload error:", error);
          toast.error("Upload failed: " + error.message);
          setDesigns(prev => prev.filter(d => d.id !== designId));
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setDesigns(prev => prev.map(d => d.id === designId ? { ...d, storageUrl: downloadURL, uploadProgress: 100 } : d));
          toast.success("Design uploaded successfully!");
          setShowUploadSection(false);
          setEditingDesignId(null);
        }
      );
      
      const fileInput = document.getElementById('design-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleAddToCart = () => {
    const finalWidth = selectedDesignId 
      ? designs.find(d => d.id === selectedDesignId)?.width || width
      : width;
    const finalHeight = selectedDesignId
      ? designs.find(d => d.id === selectedDesignId)?.height || height
      : height;
    const finalOrientation = selectedDesignId
      ? designs.find(d => d.id === selectedDesignId)?.orientation || orientation
      : orientation;

    const cartItem = {
      productId: product.id,
      productName: product.title,
      category: product.category,
      thumbnail: product.thumbnail,
      width: finalWidth,
      height: finalHeight,
      orientation: finalOrientation,
      inkType: printingType,
      highlightRequired: isFlexProduct ? hemmingOption : 'No',
      finishing: isFlexProduct ? hemmingOption === 'Yes' : false,
      designUrl: designs.find(d => d.id === selectedDesignId)?.storageUrl || designs[0]?.storageUrl,
      hasDesign: designs.length > 0,
      designs: designs.map(d => ({ 
        file: d.file,
        storageUrl: d.storageUrl,
        settings: { 
          width: d.width, 
          height: d.height, 
          orientation: d.orientation 
        }
      })),
      selectedDesignId: selectedDesignId,
      quantity: 1,
      totalPrice: totalPrice,
      hemmingCharge: hemmingCharge,
      area: area,
      basePrice: baseTotal,
      ratePerSqft: product.basePricePerSqft,
      finishingCharge: hemmingCharge
    };
    
    onAddToCart(cartItem);
    onClose();
  };

  const cancelUpload = () => {
    setShowUploadSection(false);
    setEditingDesignId(null);
    setShowDrivePicker(false);
    setDriveUrl('');
    setDriveFileName('');
  };

  const getOrientationIcon = (orientationValue: string) => {
    switch(orientationValue) {
      case '1:1': return <Square className="h-5 w-5" />;
      case '16:9': return <Monitor className="h-5 w-5" />;
      case '9:16': return <Smartphone className="h-5 w-5" />;
      case '3:1': return <Film className="h-5 w-5" />;
      case '1:3': return <LayoutTemplate className="h-5 w-5" />;
      default: return <Square className="h-5 w-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-3 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-6 z-10 rounded-t-[2rem]">
          <div className="pr-12">
            <h2 className="text-2xl font-black text-brand-navy tracking-tight">{product.title}</h2>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{product.category}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Options */}
            <div className="space-y-8">
              {/* Printing Type Selection */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-brand-orange/10 rounded-lg">
                    <Printer className="h-4 w-4 text-brand-orange" />
                  </div>
                  <h3 className="text-sm font-black text-brand-navy uppercase tracking-wider">
                    Printing Type
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {(['Solvent', 'Eco Solvent'] as PrintingType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPrintingType(type)}
                      className={`
                        py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 text-center
                        ${printingType === type 
                          ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105' 
                          : 'bg-gray-50 text-brand-navy hover:bg-gray-100 border border-gray-100 hover:scale-105'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Printer className="h-4 w-4" />
                        <span>{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="text-sm font-black text-brand-navy mb-4 uppercase tracking-wider">Choose Size</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {(['2×4', '4×6', '6×8', '8×10', 'Custom'] as SizePreset[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200
                        ${selectedSize === size 
                          ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105' 
                          : 'bg-gray-50 text-brand-navy hover:bg-gray-100 border border-gray-100 hover:scale-105'
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
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-4 mt-4"
                  >
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Width (ft)</label>
                      <input
                        type="number"
                        min={1}
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(1, Number(e.target.value)))}
                        className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Height (ft)</label>
                      <input
                        type="number"
                        min={1}
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(1, Number(e.target.value)))}
                        className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:border-brand-orange focus:outline-none"
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
                    { value: '1:1', label: 'Square', icon: Square, ratio: '1:1' },
                    { value: '16:9', label: 'Landscape', icon: Monitor, ratio: '16:9' },
                    { value: '9:16', label: 'Portrait', icon: Smartphone, ratio: '9:16' },
                    { value: '3:1', label: 'Wide Banner', icon: Film, ratio: '3:1' },
                    { value: '1:3', label: 'Tall Banner', icon: LayoutTemplate, ratio: '1:3' },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setOrientation(opt.value as Orientation)}
                        className={`
                          p-4 rounded-xl text-center transition-all duration-200
                          ${orientation === opt.value
                            ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105'
                            : 'bg-gray-50 text-brand-navy hover:bg-gray-100 border border-gray-100 hover:scale-105'
                          }
                        `}
                      >
                        <div className="flex justify-center mb-2">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[8px] opacity-70 mt-1">{opt.ratio}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hemming & Eyelets */}
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
                    <label className={`
                      flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${hemmingOption === 'Yes' 
                        ? 'border-brand-orange bg-brand-orange/5 shadow-md' 
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
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
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-black text-brand-navy">Yes — Hem & Eyelets</span>
                          <span className="text-xs text-brand-orange font-bold bg-brand-orange/10 px-2 py-1 rounded-lg">+ ₹0.50/sqft</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Metal corner rings + stitched edges
                        </p>
                      </div>
                    </label>

                    <label className={`
                      flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${hemmingOption === 'No' 
                        ? 'border-brand-orange bg-brand-orange/5 shadow-md' 
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
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
                </div>
              )}

              {/* Upload Design Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-brand-navy uppercase tracking-wider">Upload Your Designs</h3>
                  {designs.length > 0 && (
                    <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded-lg">
                      {designs.length}/{MAX_DESIGNS} Designs
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleAddDesign}
                  disabled={designs.length >= MAX_DESIGNS}
                  className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md
                    ${designs.length < MAX_DESIGNS 
                      ? 'bg-brand-orange text-white hover:bg-brand-navy' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <Upload className="h-4 w-4" />
                  Add Design ({designs.length}/{MAX_DESIGNS})
                </button>

                <AnimatePresence>
                  {showUploadSection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative mt-4"
                    >
                      <div className="bg-brand-orange/5 rounded-2xl p-4 border-2 border-brand-orange/30">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs font-bold text-brand-navy">
                            {editingDesignId ? 'Replace Design' : 'Upload New Design'}
                          </p>
                          <button
                            onClick={cancelUpload}
                            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <XCircle className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                        
                        {/* Two upload options */}
                        <div className="space-y-3">
                          {/* Local File Upload */}
                          <div>
                            <input
                              type="file"
                              id="design-upload"
                              accept="image/*,.pdf,.ai,.eps"
                              onChange={handleLocalFileUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="design-upload"
                              className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-white transition-all group bg-white"
                            >
                              <Upload className="h-5 w-5 text-brand-orange" />
                              <span className="font-bold text-sm text-brand-navy">Upload from Computer</span>
                            </label>
                          </div>

                          {/* Google Drive Option */}
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-gray-500">OR</span>
                            </div>
                          </div>

                          <button
                            onClick={openDrivePicker}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border-2 border-blue-200"
                          >
                            <Cloud className="h-5 w-5 text-blue-600" />
                            <span className="font-bold text-sm text-blue-700">Select from Google Drive</span>
                          </button>

                          {/* Manual URL Input */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">Or paste Google Drive URL:</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={driveUrl}
                                onChange={(e) => setDriveUrl(e.target.value)}
                                placeholder="https://drive.google.com/file/d/..."
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                              />
                              <button
                                onClick={handleDriveUrlSubmit}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm hover:bg-gray-900 transition-colors"
                              >
                                <Link2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {designs.length > 0 && !showUploadSection && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 space-y-3"
                  >
                    {designs.map((design) => (
                      <motion.div
                        key={design.id}
                        onClick={() => handleSelectDesign(design.id)}
                        className={`
                          p-4 rounded-xl border-2 transition-all cursor-pointer
                          ${selectedDesignId === design.id 
                            ? 'border-brand-orange bg-brand-orange/5 shadow-md' 
                            : 'border-gray-200 bg-gray-50 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm">
                            {design.preview ? (
                              <img src={design.preview} alt={design.name} className="h-10 w-10 object-cover rounded" />
                            ) : (
                              <FileImage className="h-6 w-6 text-brand-orange" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-brand-navy text-sm truncate">
                              {design.name}
                              {design.isFromDrive && (
                                <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  Drive
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-gray-500">
                                {(design.size / 1024).toFixed(1)} KB • {design.width}×{design.height} ft
                              </p>
                              {design.uploadProgress !== undefined && design.uploadProgress < 100 && (
                                <div className="flex items-center gap-1">
                                  <Loader2 className="h-2 w-2 animate-spin text-brand-orange" />
                                  <span className="text-[8px] font-black text-brand-orange">{Math.round(design.uploadProgress)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEditDesign(design.id)}
                              className="p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Edit className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleRemoveDesign(design.id)}
                              className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
                    className="bg-white rounded-xl shadow-md mx-auto flex items-center justify-center overflow-hidden border border-gray-200"
                    style={{
                      width: '100%',
                      aspectRatio: width && height ? `${width}/${height}` : '16/9',
                      maxHeight: '200px'
                    }}
                  >
                    <div className="text-center p-4">
                      <div className="flex justify-center mb-3">
                        {getOrientationIcon(orientation)}
                      </div>
                      <p className="text-xs font-bold text-gray-500">
                        {width} × {height} ft
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {orientation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-400 font-medium">
                      Preview is for reference only. Final output may vary.
                    </p>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-brand-navy rounded-2xl p-6 text-white">
                  <h3 className="text-sm font-black mb-4 uppercase tracking-wider opacity-60">Price Summary</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Printing Type:</span>
                      <span className="font-bold">{printingType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Dimensions:</span>
                      <span className="font-bold">{width} × {height} ft</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Total Area:</span>
                      <span className="font-bold">{area} sq ft</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Base Rate:</span>
                      <span className="font-bold">₹{product.basePricePerSqft}/sqft</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Base Price:</span>
                      <span className="font-bold">₹{baseTotal.toFixed(2)}</span>
                    </div>
                    
                    {isFlexProduct && hemmingOption === 'Yes' && (
                      <div className="flex justify-between text-sm">
                        <span className="opacity-60">Hemming & Eyelets:</span>
                        <span className="font-bold text-brand-orange">+₹{hemmingCharge.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="h-px bg-white/10 my-2" />
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-black">Total Price</span>
                      <div className="flex items-center text-2xl font-black text-brand-orange">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        <span>{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-brand-orange text-white py-4 rounded-xl font-black text-lg hover:bg-white hover:text-brand-navy transition-all shadow-lg shadow-brand-orange/20 hover:shadow-xl"
                  >
                    Add to Cart
                  </button>
                  
                  <div className="mt-4 text-center">
                    <p className="text-[10px] opacity-40">
                      GST (18%) will be calculated at checkout
                    </p>
                    {designs.length > 0 && (
                      <p className="text-[10px] text-green-400 mt-2">
                        {designs.length} {designs.length === 1 ? 'design' : 'designs'} attached
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}