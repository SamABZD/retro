import { useState } from "react";
import { Home, KeyRound, LayoutDashboard, List, LogOut, Menu, Plus, Repeat2, Settings, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BrandMark } from "@/components/brand/BrandMark";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/features/cart/CartContext";
import { baseApi } from "@/redux/api/baseApi";
import { useLogoutMutation } from "@/redux/fetures/auth.api";
import { useGetMeQuery } from "@/redux/fetures/users.api";
import { useAppDispatch } from "@/redux/hooks";
import { isDemoAccount } from "@/lib/demoMode";

const buyerLinks = [
  { label: "Overview", path: "/user/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Orders", path: "/user/dashboard/my-purchases", icon: ShoppingBag },
  { label: "Cart", path: "/cart", icon: ShoppingCart },
  { label: "Become a seller", path: "/create-seller-profile", icon: Store },
  { label: "Account", path: "/user/dashboard/account", icon: Settings },
  { label: "Password", path: "/user/dashboard/change-password", icon: KeyRound },
];

const sellerLinks = [
  { label: "Overview", path: "/seller/dashboard", icon: LayoutDashboard, exact: true },
  { label: "My listings", path: "/seller/dashboard/all-ads", icon: List },
  { label: "Create listing", path: "/seller/dashboard/ads/create", icon: Plus },
  { label: "Orders", path: "/seller/dashboard/orders", icon: ShoppingBag },
  { label: "My purchases", path: "/seller/dashboard/purchases", icon: ShoppingCart },
  { label: "Account", path: "/seller/dashboard/profile", icon: Settings },
  { label: "Password", path: "/seller/dashboard/change-password", icon: KeyRound },
];

export default function AccountLayout({ role }: { role: "buyer" | "seller" }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { clearCart } = useCart();
  const { data: me } = useGetMeQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === "seller" ? sellerLinks : buyerLinks;
  const user = me?.data;
  const accountName = isDemoAccount(user?.email)
    ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
    : user?.nickName || user?.email;

  const signOut = async (destination = "/login") => {
    try {
      await logout().unwrap();
      clearCart();
      if (destination.includes("#explore-demo")) sessionStorage.setItem("retro-demo-select", "1");
      setMobileOpen(false);
      navigate(destination, { replace: true });
      dispatch(baseApi.util.resetApiState());
      toast.success("Signed out");
    } catch {
      toast.error("We couldn't sign you out. Try again.");
    }
  };

  const nav = (mobile = false) => <nav aria-label={role === "seller" ? "Seller account" : "Buyer account"} className={mobile ? "account-nav flex flex-col gap-1" : "account-nav flex flex-wrap gap-x-6 gap-y-1"}>
    {links.map(({ label, path, exact }) => <NavLink key={path} to={path} end={exact} onClick={() => mobile && setMobileOpen(false)} className={({ isActive }) => `flex min-h-11 items-center border-b-2 border-transparent py-2 text-sm font-medium transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</NavLink>)}
  </nav>;

  return <div className="min-h-dvh bg-background text-foreground">
    <a href="#account-main" className="skip-link">Skip to account content</a>
    <header className="sticky top-0 z-40 border-b bg-background/95 text-foreground">
      <PageContainer className="flex h-16 items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon-sm" className="text-foreground hover:bg-muted lg:hidden" aria-label="Open account navigation"><Menu className="size-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="w-[min(20rem,85vw)] p-0"><SheetHeader className="border-b p-5"><SheetTitle>{role === "seller" ? "Your shop" : "Your account"}</SheetTitle><SheetDescription>Navigate your Retro account.</SheetDescription></SheetHeader><div className="overflow-y-auto p-4">{nav(true)}<div className="mt-6 border-t pt-4">{isDemoAccount(user?.email) && <Button variant="ghost" className="w-full justify-start" onClick={() => void signOut("/login#explore-demo")} disabled={loggingOut}><Repeat2 className="size-4" /> Switch demo role</Button>}<Button variant="ghost" className="w-full justify-start" onClick={() => void signOut()} isLoading={loggingOut} loadingText="Signing out"><LogOut className="size-4" /> Sign out</Button></div></div></SheetContent>
        </Sheet>
        <BrandMark />
        <span className="hidden border-l border-border pl-3 text-sm font-medium text-muted-foreground sm:block">{role === "seller" ? "Your shop" : "Your account"}</span>
        <div className="ml-auto flex items-center gap-2"><Button asChild variant="ghost" size="sm" className="text-foreground hover:bg-muted"><Link to="/" aria-label="Marketplace"><Home className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Marketplace</span></Link></Button>{isDemoAccount(user?.email) && <span className="hidden text-xs font-medium text-brand-ink sm:inline">Demo account</span>}<span className="hidden text-sm font-medium text-muted-foreground md:inline">{accountName}</span></div>
      </PageContainer>
    </header>
    <PageContainer className="min-h-[calc(100dvh-4rem)] min-w-0">
      <div className="hidden items-center justify-between gap-6 border-b py-3 lg:flex">{nav()}<div className="flex items-center gap-1">{isDemoAccount(user?.email) && <Button variant="ghost" size="sm" onClick={() => void signOut("/login#explore-demo")} disabled={loggingOut}><Repeat2 className="size-4" />Switch demo role</Button>}<Button variant="ghost" size="sm" onClick={() => void signOut()} isLoading={loggingOut} loadingText="Signing out"><LogOut className="size-4" />Sign out</Button></div></div>
      <main id="account-main" tabIndex={-1} className="min-w-0"><Outlet /></main>
    </PageContainer>
  </div>;
}
