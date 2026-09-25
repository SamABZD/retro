import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const customBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  credentials: "include",
  prepareHeaders: (headers) => {
    const csrfCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("XSRF-TOKEN="));

    if (csrfCookie) {
      headers.set(
        "X-XSRF-TOKEN",
        decodeURIComponent(csrfCookie.split("=").slice(1).join("=")),
      );
    }

    return headers;
  },
});
