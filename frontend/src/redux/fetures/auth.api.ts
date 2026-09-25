import { baseApi } from "../api/baseApi";
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token?: string;
  user?: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: {
          username: data.nickName,
          email: data.email,
          firstname: data.firstName,
          lastname: data.lastName,
          password: data.password,
          role: "CUSTOMER",
        },
      }),
      transformResponse: (response: any) => ({
        success: response.status === 200,
        message: response.message,
      }),
      invalidatesTags: ["User"],
    }),

    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: any) => ({
        success: response.status === 200,
        message: response.message,
      }),
      invalidatesTags: ["User"],
    }),

    logout: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    changePassword: builder.mutation<AuthResponse, ChangePasswordRequest>({
      query: (data) => ({
        url: "/users/change-password",
        method: "POST",
        body: {
          oldPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      }),
    }),

    forgotPassword: builder.mutation<AuthResponse, { email: string }>({
      query: (data) => ({
        url: "/auth/password-reset-request",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation<AuthResponse, ResetPasswordRequest>({
      query: (data) => ({
        url: "/auth/password-reset-verify",
        method: "POST",
        body: { email: data.email, code: data.otp, newPassword: data.newPassword },
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
