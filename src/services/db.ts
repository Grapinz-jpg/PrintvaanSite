import { Product, User, Order } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Normal Flex Banner',
    category: 'Normal flex',
    thumbnail: 'https://picsum.photos/seed/flex1/400/300',
    description: 'High quality normal flex printing for outdoor advertising.',
    basePricePerSqft: 15,
  },
  {
    id: '2',
    title: 'Star Flex Banner',
    category: 'Star flex',
    thumbnail: 'https://picsum.photos/seed/starflex/400/300',
    description: 'Premium star flex with better durability and color reproduction.',
    basePricePerSqft: 18,
  },
  {
    id: '3',
    title: 'Back Light Flex',
    category: 'Back light',
    thumbnail: 'https://picsum.photos/seed/backlight/400/300',
    description: 'Translucent flex for backlit signage and lightboxes.',
    basePricePerSqft: 22,
  },
  {
    id: '4',
    title: 'Vinyl Sticker',
    category: 'Vinyl',
    thumbnail: 'https://picsum.photos/seed/vinyl/400/300',
    description: 'Self-adhesive vinyl for smooth surfaces and indoor branding.',
    basePricePerSqft: 35,
  },
  {
    id: '5',
    title: 'Sun Pack Board',
    category: 'Sun pack printing',
    thumbnail: 'https://picsum.photos/seed/sunpack/400/300',
    description: 'Corrugated plastic sheets for temporary signage and real estate ads.',
    basePricePerSqft: 28,
  },
];

export const mockUser: User | null = {
  id: 'user123',
  name: 'John',
  email: 'john@printvaan.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
};

export const mockOrders: Order[] = [
  {
    id: 'PV-2024-001',
    date: '15 Jan 2025, 3:42 PM',
    items: [
      {
        id: 'item1',
        productId: '2',
        productName: 'Star Flex Banner',
        category: 'Star flex',
        thumbnail: 'https://picsum.photos/seed/starflex/400/300',
        width: 10,
        height: 4,
        orientation: '16:9',
        finishing: true,
        quantity: 1,
        ratePerSqft: 18,
        finishingCharge: 50,
        totalPrice: 770,
      }
    ],
    subtotal: 770,
    gst: 138.60,
    grandTotal: 908.60,
    status: 'Delivered',
    paymentMethod: 'UPI / QR Code',
    customerInfo: {
      name: 'John',
      email: 'john@printvaan.com',
      phone: '+91 98765 43210',
      addressLine1: '123, Print Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      isPickup: false,
    }
  },
  {
    id: 'PV-2024-002',
    date: '16 Jan 2025, 11:20 AM',
    items: [
      {
        id: 'item2',
        productId: '4',
        productName: 'Vinyl Sticker',
        category: 'Vinyl',
        thumbnail: 'https://picsum.photos/seed/vinyl/400/300',
        width: 3,
        height: 2,
        orientation: '1:1',
        finishing: false,
        quantity: 1,
        ratePerSqft: 35,
        finishingCharge: 0,
        totalPrice: 210,
      }
    ],
    subtotal: 210,
    gst: 37.80,
    grandTotal: 247.80,
    status: 'Printing',
    paymentMethod: 'Net Banking',
    customerInfo: {
      name: 'John',
      email: 'john@printvaan.com',
      phone: '+91 98765 43210',
      addressLine1: '123, Print Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      isPickup: false,
    }
  },
  {
    id: 'PV-2024-003',
    date: '17 Jan 2025, 09:15 AM',
    items: [
      {
        id: 'item3',
        productId: '1',
        productName: 'Normal Flex Banner',
        category: 'Normal flex',
        thumbnail: 'https://picsum.photos/seed/flex1/400/300',
        width: 8,
        height: 6,
        orientation: '16:9',
        finishing: false,
        quantity: 1,
        ratePerSqft: 15,
        finishingCharge: 0,
        totalPrice: 720,
      },
      {
        id: 'item4',
        productId: '5',
        productName: 'Sun Pack Board',
        category: 'Sun pack printing',
        thumbnail: 'https://picsum.photos/seed/sunpack/400/300',
        width: 4,
        height: 2,
        orientation: '16:9',
        finishing: false,
        quantity: 1,
        ratePerSqft: 28,
        finishingCharge: 0,
        totalPrice: 224,
      }
    ],
    subtotal: 944,
    gst: 169.92,
    grandTotal: 1113.92,
    status: 'Pending',
    paymentMethod: 'Pay on Pickup',
    customerInfo: {
      name: 'John',
      email: 'john@printvaan.com',
      phone: '+91 98765 43210',
      addressLine1: '123, Print Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      isPickup: true,
    }
  }
];

// Mock service functions
export const getProducts = async (): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockProducts), 500);
  });
};

export const getOrders = async (): Promise<Order[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockOrders), 500);
  });
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockOrders.find(o => o.id === id)), 300);
  });
};

export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockUser), 300);
  });
};

export const login = async (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockUser!), 1000);
  });
};

export const logout = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500);
  });
};
