import { baseApi } from "@/redux/api/baseApi";

export interface MarketplaceCategory {
  id: string;
  slug: string;
  name: string;
  productCount?: number;
  subCategories: never[];
}

interface CategoryResponse {
  categoryId: number;
  name: string;
  productCount?: number;
}

interface CategoryCollection {
  data: MarketplaceCategory[];
  meta: { total: number };
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query<
      CategoryCollection,
      { page?: number; limit?: number; search?: string } | void
    >({
      query: () => "/categories",
      transformResponse: (response: CategoryResponse[]) => ({
        data: response.map((category) => ({
          ...category,
          id: String(category.categoryId),
          slug: String(category.categoryId),
          subCategories: [],
        })),
        meta: { total: response.length },
      }),
      providesTags: ["Category"],
    }),
  }),
});

export const { useGetAllCategoriesQuery } = categoriesApi;
