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

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  thumbnail: string;
  width: number;
  height: number;
  orientation: string;
  inkType: string;
  highlightRequired: 'Yes' | 'No';
  finishing: boolean;
  designUrl?: string;
  quantity: number;
  ratePerSqft: number;
  finishingCharge: number;
  totalPrice: number;
}

export interface OrderItem extends CartItem {}

export interface UploadedFile {
  id: string;
  uid: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'user' | 'admin';
  createdAt: any;
}

export type OrderStatus = 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Out of Stock' | 'Pending' | 'Processing' | 'Printing' | 'Ready for Pickup' | 'Cancelled';

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  timestamp: any;
  date: string;
  subtotal: number;
  grandTotal: number;
  gst: number;
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
