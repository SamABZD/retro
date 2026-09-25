import { baseApi } from "../api/baseApi";

export interface CheckoutRequest {
  items: Array<{ productId: number; quantity: number }>;
  shippingAddress: string;
  phoneNumber: string;
}

export interface OrderItemView {
  orderItemId: number;
  productId: number;
  title: string;
  imageUrl?: string;
  sellerId: number;
  sellerName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderView {
  orderId: number;
  status: string;
  orderDate: string;
  totalPrice: number;
  paymentMethod: "SIMULATED";
  shippingAddress: string;
  items: OrderItemView[];
}

export interface OrderPage {
  content: OrderView[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkout: builder.mutation<OrderView[], CheckoutRequest>({
      query: (body) => ({
        url: "/orders/checkout",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Order", "Ad"],
    }),
    getMyOrders: builder.query<OrderPage, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/orders",
        params: { showall: true, page, size },
      }),
      providesTags: ["Order"],
    }),
    getSellerOrders: builder.query<OrderPage, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/orders/producer-orders",
        params: { page, size },
      }),
      providesTags: ["Order"],
    }),
    updateSellerOrderStatus: builder.mutation<
      OrderView,
      { orderId: number | string; status: string }
    >({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: "PUT",
        params: { status },
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useCheckoutMutation,
  useGetMyOrdersQuery,
  useGetSellerOrdersQuery,
  useUpdateSellerOrderStatusMutation,
} = ordersApi;
