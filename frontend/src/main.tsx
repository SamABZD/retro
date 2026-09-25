import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.ts";
import { ToastContainer } from "react-toastify";
import { CartProvider } from "./features/cart/CartContext.tsx";

const app = window.location.pathname === "/earth" ? (
  <RouterProvider router={router} />
) : (
  <Provider store={store}>
    <CartProvider>
      <RouterProvider router={router} />
      <ToastContainer position="bottom-right" autoClose={4200} newestOnTop closeOnClick pauseOnHover />
    </CartProvider>
  </Provider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{app}</StrictMode>,
);
