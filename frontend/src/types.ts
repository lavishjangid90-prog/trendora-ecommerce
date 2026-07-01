export interface Product {
  _id: string;
  code: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  image: string;
  sku?: string;
  costPrice?: number;
  lowStockThreshold?: number;
  rating: number;
  reviews: number;
  sizes: string[];
  colors: string[];
  description: string;
  isTrending: boolean;
  stock?: number;
  images?: string[];
  variants?: string[];
  keywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
}

export interface OrderHistoryItem {
  _id: string;
  amount: number;
  currency: string;
  paymentMode: "razorpay" | "mock" | "cod";
  paymentStatus?: "pending" | "paid" | "failed" | "cod" | "mock";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  paymentFailureReason?: string;
  status: "created" | "placed" | "packed" | "shipped" | "delivered" | "cancelled" | "return_requested" | "returned";
  returnStatus?: "none" | "requested" | "approved" | "rejected" | "completed";
  shippingStatus?: "pending" | "label_created" | "in_transit" | "delivered";
  trackingId?: string;
  invoiceId?: string;
  address?: {
    fullName?: string;
    phone?: string;
    pincode?: string;
    city?: string;
    state?: string;
    addressLine?: string;
  };
  items?: Array<{
    product?: Product;
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
  statusHistory?: Array<{
    status: string;
    note: string;
    at: string;
  }>;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  addressLine: string;
}

export interface CheckoutOrder {
  success: boolean;
  orderId: string;
  message: string;
  paymentMode: "razorpay" | "mock" | "cod";
  keyId?: string;
  amount?: number;
  currency?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  description?: string;
}
