import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import {
  CartItem,
  CreateOrderPayload,
  CustomerSearchUser,
  DansshipAPI,
  Order,
  PaymentMethod,
  PaymentProofContentType,
  PaymentProofContentTypesList,
  Product,
} from '@core/api';

const DEFAULT_PAYMENT_METHOD = PaymentMethod.CASH;

export const useMerchPos = () => {
  const { t } = useTranslation();
  const [cart, setCart] = useState<Array<CartItem>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchUser | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHOD);
  const [latestCreatedOrder, setLatestCreatedOrder] = useState<Order | null>(null);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);

  const addToCart = (product: Product, quantity = 1) => {
    if (quantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);

      if (!existing) {
        return [...prev, { product, quantity }];
      }

      return prev.map(item => {
        if (item.product.id !== product.id) return item;

        const nextQuantity = Math.min(item.quantity + quantity, Math.max(0, product.stock));

        return { ...item, quantity: nextQuantity };
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);

      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.product.id !== productId) return item;

        const nextQuantity = Math.min(quantity, Math.max(0, item.product.stock));

        return { ...item, quantity: nextQuantity };
      }),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const clearLatestCreatedOrder = () => {
    setLatestCreatedOrder(null);
  };

  const { call: createOrderPromise, isLoading: isCreatingOrder } = useCallablePromise((payload: CreateOrderPayload) =>
    DansshipAPI.merchAdmin.createOrder(payload),
  );

  const createOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      const { data, ok } = await createOrderPromise(payload);

      if (ok) {
        setLatestCreatedOrder(data);
        setCart([]);

        return data;
      } else {
        toast.error(t('merch:errors.orderCreateFailed'));
      }
    },
    [createOrderPromise, t],
  );

  const uploadProofForOrder = async (order: Order, proofFile: File, proofUploadMode: 'owner' | 'admin') => {
    const intentId = order.payment_intent?.id ?? order.payment_intent_id;

    if (!intentId) return;

    const contentType = proofFile.type as PaymentProofContentType;

    const { data, ok } =
      proofUploadMode === 'admin'
        ? await DansshipAPI.paymentsAdmin.getAdminProofUploadUrl(intentId, { content_type: contentType })
        : await DansshipAPI.payments.getProofUploadUrl(intentId, { content_type: contentType });

    if (!ok) {
      return;
    }

    const { upload_url, file_key } = data;

    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': proofFile.type,
      },
      body: proofFile,
    });

    if (!uploadResponse.ok) {
      throw new Error('S3_UPLOAD_FAILED');
    }

    const { data: updatedIntent, ok: confirmOk } =
      proofUploadMode === 'admin'
        ? await DansshipAPI.paymentsAdmin.confirmAdminProofUpload(intentId, { file_key })
        : await DansshipAPI.payments.confirmProofUpload(intentId, { file_key });

    if (!confirmOk) {
      return;
    }

    setLatestCreatedOrder(prev => {
      if (!prev || prev.id !== order.id) return prev;

      return {
        ...prev,
        payment_intent: {
          ...(prev.payment_intent ?? {
            id: updatedIntent.id,
            status: updatedIntent.status,
            payment_method_type: updatedIntent.payment_method_type,
          }),
          id: updatedIntent.id,
          status: updatedIntent.status,
          payment_method_type: updatedIntent.payment_method_type,
          proof_url: updatedIntent.proof_url,
        },
      };
    });

    toast.success(
      t('merch:purchaseApproved', {
        defaultValue: 'Purchase approved',
      }),
    );
  };

  const submitOrder = async (
    proofFile?: File | null,
    proofUploadMode: 'owner' | 'admin' = 'admin',
  ): Promise<boolean> => {
    if (!selectedCustomer) {
      toast.error(t('merch:errors.customerRequired'));

      return false;
    }

    if (cart.length === 0) {
      toast.error(t('merch:errors.emptyCart'));

      return false;
    }

    const payload: CreateOrderPayload = {
      customer_id: selectedCustomer.id,
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      payment_method_type: selectedPaymentMethod,
    };

    const createdOrder = await createOrder(payload);

    if (!proofFile || !createdOrder) return true;

    if (!PaymentProofContentTypesList.includes(proofFile.type)) {
      toast.error(t('payments:proofInvalidTypeDesc'));

      return false;
    }

    try {
      await uploadProofForOrder(createdOrder, proofFile, proofUploadMode);
    } catch {
      toast.error(t('payments:proofUploadFailedDesc'));

      return false;
    }

    return true;
  };

  return {
    cart,
    selectedCustomer,
    selectedPaymentMethod,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setCustomer: setSelectedCustomer,
    setPaymentMethod: setSelectedPaymentMethod,
    submitOrder,
    isSubmitting: isCreatingOrder,
    latestCreatedOrder,
    clearLatestCreatedOrder,
  };
};
