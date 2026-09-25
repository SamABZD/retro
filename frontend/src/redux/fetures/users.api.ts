 
import { baseApi } from "../api/baseApi";


export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<any, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      transformResponse: (user: any) => ({
        data: {
          ...user,
          id: String(user.userId),
          firstName: user.firstname,
          lastName: user.lastname,
          nickName: user.username,
          role:
            user.role === "CUSTOMER"
              ? "USER"
              : user.role === "PRODUCER"
                ? "SELLER"
                : user.role,
        },
      }),
      providesTags: ["User"],
    }),

    createSellerProfile: builder.mutation({
      query: (data) => ({
        url: "/producer-applications",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    getSellerApplicationStatus: builder.query<{
      status: string;
      submittedAt?: string;
      processedAt?: string;
      declineReason?: string;
    }, void>({
      query: () => "/producer-applications/status",
      providesTags: ["User"],
    }),

  }),
});

export const {
  useGetMeQuery,
  useCreateSellerProfileMutation,
  useGetSellerApplicationStatusQuery,
} = userApi;
