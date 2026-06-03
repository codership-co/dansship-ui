import type { PaymentMethodType, PaymentStatus } from '../payments/payments.models';

export interface ListEnvelope<T> {
  items: Array<T>;
  total?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  stock: number;
  category: string | null;
  image_key?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetProductsParams {
  is_active?: boolean;
  category?: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string | null;
  price: number;
  sku?: string | null;
  stock: number;
  category?: string | null;
  image_key?: string | null;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export interface EntityReference {
  id: string;
  name?: string | null;
  human_identifier?: string | null;
}

export interface OrderItemProductSummary {
  id: string;
  name: string;
  human_identifier?: string | null;
}

export interface OrderItem {
  id: number;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: OrderItemProductSummary | null;
}

export type OrderUserSummary = EntityReference;

export interface OrderPaymentSummary {
  id: string;
  status: PaymentStatus;
  payment_method_type: PaymentMethodType;
  proof_url?: string | null;
}

export interface Order {
  id: string;
  customer_id: string;
  created_by: string;
  total_amount: number;
  status: OrderStatus;
  items: Array<OrderItem>;
  customer: OrderUserSummary | null;
  created_by_user: OrderUserSummary | null;
  payment_intent_id: string | null;
  payment_intent?: OrderPaymentSummary | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Array<Product>;
  total: number;
  is_active?: boolean | null;
  category?: string | null;
}

export interface OrderListResponse {
  items: Array<Order>;
  total: number;
}

export interface CreateOrderItemPayload {
  product_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_id: string;
  items: Array<CreateOrderItemPayload>;
  payment_method_type: PaymentMethodType;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerSearchUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface ProductImageUploadRequest {
  content_type: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ProductImageUploadResponse {
  upload_url: string;
  file_key: string;
}

export interface ProductImageConfirmRequest {
  file_key: string;
}

export interface GetOrdersParams {
  status?: OrderStatus;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
}
