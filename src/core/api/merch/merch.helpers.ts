import type { ListEnvelope, Order, Product } from './merch.models';

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    price: toNumber(product.price),
    stock: Math.max(0, Math.trunc(toNumber(product.stock))),
  };
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    total_amount: toNumber(order.total_amount),
    items: (order.items ?? []).map(item => ({
      ...item,
      quantity: Math.max(0, Math.trunc(toNumber(item.quantity))),
      unit_price: toNumber(item.unit_price),
    })),
  };
}

export function getEnvelopeItems<T>(payload: Array<T> | ListEnvelope<T> | null | undefined): Array<T> {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.items)) return payload.items;

  return [];
}
