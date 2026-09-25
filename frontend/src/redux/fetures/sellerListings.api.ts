import { baseApi } from "@/redux/api/baseApi";
import { normalizeListingImage } from "@/lib/marketplace";

interface RawSellerListing {
  productId: number;
  title?: string;
  name?: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  images?: string[];
  createdAt?: string;
  categories?: Array<{ categoryId: number; name: string }>;
  status?: string;
  declineReason?: string | null;
  condition?: string;
  listingStatus?: string;
}

interface SellerListingPage {
  content: RawSellerListing[];
  totalPages: number;
}

export interface SellerListing {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  rawImages: string[];
  images: string[];
  createdAt?: string;
  categoryId: string;
  categoryIds: string[];
  categoryName: string;
  moderationStatus: string;
  declineReason?: string | null;
  condition: string;
  listingStatus: string;
}

const toListing = (raw: RawSellerListing): SellerListing => {
  const rawImages = Array.from(new Set(
    raw.images?.length ? raw.images : raw.imageUrl ? [raw.imageUrl] : [],
  ));
  const category = raw.categories?.[0];
  return {
    id: String(raw.productId),
    title: raw.title || raw.name || "Untitled listing",
    description: raw.description || "",
    price: Number(raw.price || 0),
    quantity: Number(raw.quantity || 0),
    rawImages,
    images: rawImages.map((value) => normalizeListingImage(value)).filter((value): value is string => Boolean(value)),
    createdAt: raw.createdAt,
    categoryId: category ? String(category.categoryId) : "",
    categoryIds: (raw.categories || []).map((item) => String(item.categoryId)),
    categoryName: category?.name || "Uncategorized",
    moderationStatus: raw.status || "PENDING",
    declineReason: raw.declineReason,
    condition: raw.condition || "GOOD",
    listingStatus: raw.listingStatus || "ACTIVE",
  };
};

export const sellerListingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSellerListings: builder.query<SellerListing[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const listings: SellerListing[] = [];
        let page = 0;
        let totalPages = 1;
        while (page < totalPages) {
          const result = await fetchWithBQ({
            url: "/listings/my-products",
            params: { page, size: 100, sortBy: "createdAt", direction: "desc" },
          });
          if (result.error) return { error: result.error };
          const payload = result.data as SellerListingPage;
          listings.push(...(payload.content || []).map(toListing));
          totalPages = Math.max(1, Number(payload.totalPages || 1));
          page += 1;
        }
        return { data: listings };
      },
      providesTags: (result) => [
        { type: "Ad", id: "LIST" },
        ...(result || []).map((listing) => ({ type: "Ad" as const, id: listing.id })),
      ],
    }),
    getSellerListing: builder.query<SellerListing, string>({
      query: (id) => `/listings/my-listings/${id}`,
      transformResponse: (response: RawSellerListing) => toListing(response),
      providesTags: (_result, _error, id) => [{ type: "Ad", id }],
    }),
  }),
});

export const { useGetSellerListingsQuery, useGetSellerListingQuery } = sellerListingsApi;
