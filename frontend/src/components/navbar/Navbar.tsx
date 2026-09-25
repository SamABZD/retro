import { useEffect, useState, type FormEvent } from "react";
import {
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Repeat2,
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BrandMark } from "@/components/brand/BrandMark";
import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { SearchInput } from "@/components/ui/search-input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/features/cart/CartContext";
import { useLogoutMutation } from "@/redux/fetures/auth.api";
import { useGetMeQuery } from "@/redux/fetures/users.api";
import { useAppDispatch } from "@/redux/hooks";
import { baseApi } from "@/redux/api/baseApi";
import { demoMode, isDemoAccount } from "@/lib/demoMode";

function dashboardPath(role?: string) {
  if (role === "SELLER") return "/seller/dashboard";
  return "/user/dashboard";
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { itemCount, clearCart } = useCart();
  const dispatch = useAppDispatch();
  const { data: userData } = useGetMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const user = userData?.data;
  const [query, setQuery] = useState(location.pathname === "/search" ? searchParams.get("search") || "" : "");

  useEffect(() => {
    if (location.pathname === "/search") setQuery(searchParams.get("search") || "");
  }, [location.pathname, searchParams]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?search=${encodeURIComponent(value)}` : "/search");
  };

  const startSelling = () => {
    if (user?.role === "SELLER") navigate("/seller/dashboard/ads/create");
    else if (user?.role === "USER") navigate("/create-seller-profile");
    else navigate("/register?role=SELLER");
  };

  const signOut = async (destination = "/") => {
    try {
      await logout().unwrap();
      clearCart();
      if (destination.includes("#explore-demo")) sessionStorage.setItem("retro-demo-select", "1");
      dispatch(baseApi.util.resetApiState());
      toast.success("Signed out");
      navigate(destination);
    } catch {
      toast.error("We could not sign you out. Please try again.");
    }
  };

  const accountInitials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}` || user?.nickName?.[0] || "A";
  const accountName = isDemoAccount(user?.email)
    ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
    : user?.nickName || user?.firstName || "Account";
  const ordersPath = user?.role === "SELLER" ? "/seller/dashboard/orders" : "/user/dashboard/my-purchases";
  const accountPath = user?.role === "SELLER" ? "/seller/dashboard/profile" : "/user/dashboard/account";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 text-foreground">
      <PageContainer>
        <div className="flex h-16 items-center gap-2 sm:gap-3 md:h-[4.5rem]">
          <BrandMark className="mr-auto md:mr-6" />

          <form onSubmit={submitSearch} role="search" className="hidden min-w-0 flex-1 md:block md:max-w-xl lg:mx-auto">
            <label htmlFor="desktop-market-search" className="sr-only">Search listings</label>
            <SearchInput
              id="desktop-market-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery("")}
              placeholder="Search for anything"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground"
            />
          </form>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            <Button asChild variant="ghost" className="text-foreground hover:bg-muted hover:text-foreground"><Link to="/search">Browse</Link></Button>
          </nav>

          <Button type="button" variant="signal" size="sm" onClick={startSelling} className="h-10 px-3 sm:h-11 sm:px-4">
            <span>Sell</span>
          </Button>

          <IconButton asChild variant="ghost" label={`Cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`} className="relative text-foreground hover:bg-muted hover:text-foreground">
            <Link to="/cart">
              <ShoppingCart aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </IconButton>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="hidden min-h-11 items-center gap-2 rounded-md px-1.5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-sidebar-ring sm:flex" aria-label="Open account menu">
                  <Avatar size="lg" className="border-border bg-muted">
                    <AvatarFallback className="bg-muted font-medium text-foreground">{accountInitials.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate xl:inline">{accountName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate">{accountName}</span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                  {isDemoAccount(user.email) && <span className="mt-1 block text-xs font-medium text-brand-ink">Demo account</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role !== "ADMIN" && <DropdownMenuItem asChild><Link to={dashboardPath(user.role)}><LayoutDashboard aria-hidden="true" />Dashboard</Link></DropdownMenuItem>}
                {user.role !== "ADMIN" && <DropdownMenuItem asChild><Link to={ordersPath}><PackageCheck aria-hidden="true" />Orders</Link></DropdownMenuItem>}
                {user.role !== "ADMIN" && <DropdownMenuItem asChild><Link to={accountPath}><Settings aria-hidden="true" />Account settings</Link></DropdownMenuItem>}
                {isDemoAccount(user.email) && <DropdownMenuItem disabled={isLoggingOut} onSelect={() => void signOut("/login#explore-demo")}><Repeat2 aria-hidden="true" />Switch demo role</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={isLoggingOut} onSelect={() => void signOut()}><LogOut aria-hidden="true" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              {demoMode && <Button asChild variant="ghost" size="sm"><Link to="/login#explore-demo">Explore demo</Link></Button>}
              <Button asChild variant="outline" className="border-border bg-transparent text-foreground hover:border-input hover:bg-muted hover:text-foreground"><Link to="/login"><CircleUserRound aria-hidden="true" />Sign in</Link></Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <IconButton variant="ghost" label="Open menu" className="text-foreground hover:bg-muted hover:text-foreground sm:hidden"><Menu aria-hidden="true" /></IconButton>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,90vw)] gap-0 p-0">
              <SheetHeader className="border-b p-5 text-left">
                <BrandMark link={false} />
                <SheetTitle className="sr-only">Marketplace menu</SheetTitle>
                <SheetDescription className="sr-only">Browse marketplace and account links</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile navigation" className="flex flex-col p-3">
                <SheetClose asChild><Link to="/search" className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold hover:bg-accent"><Search className="size-5 text-muted-foreground" aria-hidden="true" />Browse listings</Link></SheetClose>
                <SheetClose asChild><button type="button" onClick={startSelling} className="flex min-h-12 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold hover:bg-accent"><Store className="size-5 text-muted-foreground" aria-hidden="true" />{user?.role === "SELLER" ? "List an item" : "Start selling"}</button></SheetClose>
                {user ? (
                  <>
                    {user.role !== "ADMIN" && <SheetClose asChild><Link to={dashboardPath(user.role)} className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold hover:bg-accent"><LayoutDashboard className="size-5 text-muted-foreground" aria-hidden="true" />Dashboard</Link></SheetClose>}
                    {user.role !== "ADMIN" && <SheetClose asChild><Link to={ordersPath} className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold hover:bg-accent"><PackageCheck className="size-5 text-muted-foreground" aria-hidden="true" />Orders</Link></SheetClose>}
                    {user.role !== "ADMIN" && <SheetClose asChild><Link to={accountPath} className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold hover:bg-accent"><Settings className="size-5 text-muted-foreground" aria-hidden="true" />Account settings</Link></SheetClose>}
                    {isDemoAccount(user.email) && <SheetClose asChild><button type="button" onClick={() => void signOut("/login#explore-demo")} className="flex min-h-12 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold hover:bg-accent"><Repeat2 className="size-5 text-muted-foreground" aria-hidden="true" />Switch demo role</button></SheetClose>}
                    <SheetClose asChild><button type="button" onClick={() => void signOut()} className="mt-3 flex min-h-12 items-center gap-3 border-t px-3 pt-3 text-left text-sm font-semibold text-destructive"><LogOut className="size-5" aria-hidden="true" />Sign out</button></SheetClose>
                  </>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-4">
                    {demoMode && <SheetClose asChild><Button asChild variant="ghost" className="col-span-2"><Link to="/login#explore-demo">Explore demo</Link></Button></SheetClose>}
                    <SheetClose asChild><Button asChild variant="outline"><Link to="/login">Sign in</Link></Button></SheetClose>
                    <SheetClose asChild><Button asChild><Link to="/register">Register</Link></Button></SheetClose>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <form onSubmit={submitSearch} role="search" className="pb-3 md:hidden">
          <label htmlFor="mobile-market-search" className="sr-only">Search listings</label>
          <SearchInput
            id="mobile-market-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder="Search for anything"
            className="border-input bg-card text-foreground placeholder:text-muted-foreground"
          />
        </form>
      </PageContainer>
    </header>
  );
}
