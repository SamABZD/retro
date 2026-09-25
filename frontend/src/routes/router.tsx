import type { ComponentType } from "react";
import { createBrowserRouter, isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageContainer } from "@/components/layout/PageContainer";
import ParentLayout from "@/Layouts/ParentLayout";
import AccountLayout from "@/Layouts/AccountLayout";
import HomePage from "@/main/user/Pages/HomePage/HomePage";
import CompleteSellerProfile from "@/main/seller/pages/create-profile/CompleteSellerProfile";
import PrivateRoute from "./PrivateRoute";

function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default });
}

function RouteErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <PageContainer className="grid min-h-[65dvh] place-items-center py-12">
      <ErrorState
        className="w-full max-w-2xl"
        title={notFound ? "Page not found" : "This page could not be loaded"}
        description={notFound ? "The page may have moved or the link may be out of date." : "Your marketplace data is safe. Return home or try this page again in a moment."}
        action={<Button asChild variant="outline"><Link to="/">Return home</Link></Button>}
      />
    </PageContainer>
  );
}

function NotFound() {
  return (
    <div className="grid min-h-[55dvh] place-items-center py-12">
      <ErrorState
        className="w-full max-w-2xl"
        title="Page not found"
        description="The page may have moved or the link may be out of date."
        action={<Button asChild variant="outline"><Link to="/">Return home</Link></Button>}
      />
    </div>
  );
}

const errorElement = <RouteErrorBoundary />;

export const router = createBrowserRouter([
  { path: "/login", lazy: lazyPage(() => import("@/AuthLayout/Login/Login")), errorElement },
  { path: "/register", lazy: lazyPage(() => import("@/AuthLayout/SignUp/SignUp")), errorElement },
  { path: "/forgot-password", lazy: lazyPage(() => import("@/AuthLayout/ForgotPassword/ForgotPassword")), errorElement },
  {
    path: "/",
    element: <ParentLayout />,
    errorElement,
    children: [
      { index: true, element: <HomePage /> },
      { path: "create-seller-profile", element: <PrivateRoute allowedRoles={["USER"]}><CompleteSellerProfile /></PrivateRoute> },
      { path: "search", lazy: lazyPage(() => import("@/main/user/Pages/SearchPage/SearchPage")) },
      { path: "item-details/:id", lazy: lazyPage(() => import("@/main/user/Pages/ItemDetailsPage/ItemDetailsPage")) },
      { path: "cart", lazy: lazyPage(() => import("@/main/user/Pages/CartPage/CartPage")) },
      { path: "order-success", lazy: lazyPage(() => import("@/main/user/Pages/CartPage/OrderSuccessPage")) },
      { path: "terms", lazy: lazyPage(() => import("@/components/pg/Terms/TermsAndConditions")) },
      { path: "privacy", lazy: lazyPage(() => import("@/components/pg/privacy/PrivacyPolicy")) },
      { path: "fraud-prevention", lazy: lazyPage(() => import("@/components/FraudPrevention")) },
      { path: "faq", lazy: lazyPage(() => import("@/components/FAQs")) },
      { path: "about", lazy: lazyPage(() => import("@/components/pg/about/AboutUs")) },
      { path: "contact", lazy: lazyPage(() => import("@/components/pg/contact/ContactUs")) },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "user/dashboard",
    element: <PrivateRoute allowedRoles={["USER"]}><AccountLayout role="buyer" /></PrivateRoute>,
    errorElement,
    children: [
      { index: true, lazy: lazyPage(() => import("@/main/user/Pages/profile/AccountOverview")) },
      { path: "account", lazy: lazyPage(() => import("@/main/user/Pages/profile/Profile")) },
      { path: "change-password", lazy: lazyPage(() => import("@/UserDashboard/ChangePassword/ChangePassword")) },
      { path: "my-purchases", lazy: lazyPage(() => import("@/main/user/Pages/my-purches/SellerPurchases")) },
    ],
  },
  {
    path: "seller/dashboard",
    element: <PrivateRoute allowedRoles={["SELLER"]}><AccountLayout role="seller" /></PrivateRoute>,
    errorElement,
    children: [
      { index: true, lazy: lazyPage(() => import("@/main/seller/pages/dashboard/Overview")) },
      { path: "ads/create", lazy: lazyPage(() => import("@/main/seller/pages/ads/CreateAds/CreateAds")) },
      { path: "ads/edit/:id", lazy: lazyPage(() => import("@/main/seller/pages/ads/editAds/EditAds")) },
      { path: "all-ads", lazy: lazyPage(() => import("@/main/seller/pages/ads/allAds/SellerAllAds")) },
      { path: "orders", lazy: lazyPage(() => import("@/main/seller/pages/orders/SellerOrdersPage")) },
      { path: "purchases", lazy: lazyPage(() => import("@/main/user/Pages/my-purches/SellerPurchases")) },
      { path: "profile", lazy: lazyPage(() => import("@/main/user/Pages/profile/Profile")) },
      { path: "change-password", lazy: lazyPage(() => import("@/UserDashboard/ChangePassword/ChangePassword")) },
    ],
  },
]);
