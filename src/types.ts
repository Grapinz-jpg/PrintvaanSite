export interface Product {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  description: string;
  basePricePerSqft: number;
}

export interface Slide {
  id: string;
  image: string;
  alt: string;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UploadedFile {
  id: string;
  uid: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Printing' | 'Ready for Pickup' | 'Delivered' | 'Cancelled';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  thumbnail: string;
  width: number;
  height: number;
  orientation: string;
  finishing: boolean;
  quantity: number;
  ratePerSqft: number;
  finishingCharge: number;
  totalPrice: number;
}

export interface OrderItem extends CartItem {}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  grandTotal: number;
  gst: number;
  status: OrderStatus;
  paymentMethod: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    isPickup: boolean;
  };
}
