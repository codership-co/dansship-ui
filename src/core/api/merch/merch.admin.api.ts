import { HttpClient } from 'polpo-http-client';

import { getEnvelopeItems, normalizeOrder, normalizeProduct } from './merch.helpers';

import { DansshipAPIError } from '@core/api';

import type {
  CreateOrderPayload,
  CreateProductPayload,
  GetOrdersParams,
  GetProductsParams,
  Order,
  OrderListResponse,
  Product,
  ProductImageConfirmRequest,
  ProductImageUploadRequest,
  ProductImageUploadResponse,
  ProductListResponse,
  UpdateProductPayload,
} from './merch.models';

export class MerchAdminApi {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getProducts(payload?: GetProductsParams) {
    return this.httpClient.callNoError<ProductListResponse, object, Array<Product>>(
      {
        path: '/admin/merch/products',
        method: 'GET',
        params: payload,
      },
      payload => getEnvelopeItems(payload).map(normalizeProduct),
    );
  }

  async getProduct(id: string) {
    return this.httpClient.callNoError<Product>(
      {
        path: `/admin/merch/products/${id}`,
        method: 'GET',
      },
      normalizeProduct,
    );
  }

  async createProduct(payload: CreateProductPayload) {
    return this.httpClient.callNoError<Product, CreateProductPayload>(
      {
        path: '/admin/merch/products',
        method: 'POST',
        data: payload,
      },
      normalizeProduct,
    );
  }

  async updateProduct(id: string, payload: UpdateProductPayload) {
    return this.httpClient.callNoError<Product, UpdateProductPayload>(
      {
        path: `/admin/merch/products/${id}`,
        method: 'PATCH',
        data: payload,
      },
      normalizeProduct,
    );
  }

  async deactivateProduct(id: string) {
    return this.httpClient.callNoError<Product>(
      {
        path: `/admin/merch/products/${id}/deactivate`,
        method: 'POST',
      },
      normalizeProduct,
    );
  }

  async reactivateProduct(id: string) {
    return this.httpClient.callNoError<Product>(
      {
        path: `/admin/merch/products/${id}/reactivate`,
        method: 'POST',
      },
      normalizeProduct,
    );
  }

  async getProductImageUploadUrl(id: string, payload: ProductImageUploadRequest) {
    return this.httpClient.callNoError<ProductImageUploadResponse, ProductImageUploadRequest>({
      path: `/admin/merch/products/${id}/image/upload-url`,
      method: 'POST',
      data: payload,
    });
  }

  async confirmProductImageUpload(id: string, payload: ProductImageConfirmRequest) {
    return this.httpClient.callNoError<Product, ProductImageConfirmRequest>(
      {
        path: `/admin/merch/products/${id}/image/confirm`,
        method: 'POST',
        data: payload,
      },
      normalizeProduct,
    );
  }

  async getOrders(payload?: GetOrdersParams) {
    return this.httpClient.callNoError<OrderListResponse, object, Array<Order>>(
      {
        path: '/admin/merch/orders',
        method: 'GET',
        params: payload,
      },
      payload => getEnvelopeItems(payload).map(normalizeOrder),
    );
  }

  async getOrder(id: string) {
    return this.httpClient.callNoError<Order>(
      {
        path: `/admin/merch/orders/${id}`,
        method: 'GET',
      },
      normalizeOrder,
    );
  }

  async createOrder(payload: CreateOrderPayload) {
    return this.httpClient.callNoError<Order, CreateOrderPayload>(
      {
        path: '/admin/merch/orders',
        method: 'POST',
        data: payload,
      },
      normalizeOrder,
    );
  }

  async cancelOrder(id: string) {
    return this.httpClient.callNoError<Order>(
      {
        path: `/admin/merch/orders/${id}/cancel`,
        method: 'POST',
      },
      normalizeOrder,
    );
  }
}
