 
import { baseApi } from "@/redux/api/baseApi";
import { normalizeListingImage } from "@/lib/marketplace";
import type {
  MarketplaceListing,
  MarketplacePage,
  MarketplaceQueryArgs,
} from "@/types/marketplace";

const toListing = (product: any, producerOverride?: any): MarketplaceListing => {
  const producer = product.seller || product.producer || producerOverride || {};
  const categories = Array.from(product.categories || []) as any[];
  const listingImages = [product.imageUrl, ...(Array.isArray(product.images) ? product.images : [])]
    .map((value) => normalizeListingImage(value))
    .filter((value): value is string => Boolean(value));
  const images = Array.from(new Set(listingImages)).map((url) => ({ url }));
  const firstName = producer.firstname || producer.firstName || "";
  const lastName = producer.lastname || producer.lastName || "";
  const username = producer.username || producer.nickName || "Seller";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || username;
  const quantity = Number(product.quantity ?? 0);

  return {
    ...product,
    id: String(product.productId ?? product.id),
    title: product.title ?? product.name ?? "Untitled listing",
    description: product.description || "",
    price: Number(product.price ?? 0),
    quantity,
    images,
    condition: product.condition || "GOOD",
    listingStatus: product.listingStatus || "ACTIVE",
    stock: product.stock !== false && quantity > 0 && product.listingStatus !== "SOLD",
    sellerId: String(producer.producerId ?? producer.userId ?? ""),
    seller: {
      id: String(producer.producerId ?? producer.userId ?? ""),
      username,
      firstName,
      lastName,
      displayName,
      nickName: username,
    },
    categories: categories.map((category) => ({
      id: String(category.categoryId ?? category.id),
      name: category.name,
      productCount: category.productCount,
    })),
  };
};

const flattenProducts = (response: any) => {
  const producerGroups = response?.content || [];
  return producerGroups.flatMap((group: any) =>
    (group.products || []).map((product: any) =>
      toListing(product, group),
    ),
  );
};

const toMarketplacePage = (response: any): MarketplacePage => ({
  data: flattenProducts(response),
  meta: {
    total: response?.totalElements ?? 0,
    page: (response?.number ?? 0) + 1,
    limit: response?.size ?? 10,
    totalPages: response?.totalPages ?? 1,
  },
});

const toProductForm = (input: FormData) => {
  const output = new FormData();
  const title = String(input.get("title") || input.get("name") || "");
  output.append("title", title);
  output.append("name", title);
  output.append("description", String(input.get("description") || ""));
  output.append("price", String(input.get("price") || "0"));
  output.append("quantity", String(input.get("quantity") || "1"));
  output.append(
    "categoryIds",
    String(input.get("categoryId") || input.get("categoryIds") || ""),
  );

  input
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File)
    .slice(0, 8)
    .forEach((file) => output.append("image", file));

  const remoteImage = input.get("imageUrl");
  if (remoteImage) output.append("imageUrl", String(remoteImage));
  const existingImages = input.get("existingImages");
  if (existingImages !== null) output.append("existingImages", String(existingImages));
  const condition = input.get("condition");
  if (condition) output.append("condition", String(condition));
  const listingStatus = input.get("listingStatus");
  if (listingStatus) output.append("listingStatus", String(listingStatus));

  return output;
};

export const adsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllAds: builder.query<MarketplacePage, MarketplaceQueryArgs>({
      query: ({
        page = 1,
        limit = 10,
        search,
        sort = "newest",
        sortByPrice,
        categoryId,
        condition,
        minPrice,
        maxPrice,
      }) => {
        const effectiveSort = sortByPrice ? `price-${sortByPrice}` : sort;
        return {
        url: categoryId ? `/listings/category/${categoryId}` : "/listings",
        method: "GET",
        params: {
          page: Math.max(0, page - 1),
          size: limit,
          search: search || undefined,
          condition: condition || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          sortBy: effectiveSort.startsWith("price") ? "price" : "createdAt",
          direction: effectiveSort === "price-asc" ? "asc" : "desc",
        },
      };
      },
      transformResponse: toMarketplacePage,
      providesTags: ["Ad"],
    }),

    getAdById: builder.query<{ data: MarketplaceListing }, string>({
      query: (productId) => `/listings/${productId}`,
      transformResponse: (response: any) => ({ data: toListing(response) }),
      providesTags: (_result, _error, productId) => [
        { type: "Ad", id: productId },
      ],
    }),

    createAd: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/listings",
        method: "POST",
        body: toProductForm(formData),
      }),
      invalidatesTags: ["Ad"],
    }),

    updateAd: builder.mutation<any, { adId?: string; data: FormData }>({
      query: ({ adId, data }) => ({
        url: `/listings/${adId}`,
        method: "PUT",
        body: toProductForm(data),
      }),
      invalidatesTags: (_result, _error, { adId }) => [
        "Ad",
        { type: "Ad", id: adId },
      ],
    }),

    deleteAd: builder.mutation<any, string>({
      query: (productId) => ({
        url: `/listings/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ad"],
    }),

  }),
});

export const {
  useGetAllAdsQuery,
  useGetAdByIdQuery,
  useCreateAdMutation,
  useUpdateAdMutation,
  useDeleteAdMutation,
} = adsApi;
