 
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Eye, EyeOff, ShoppingBag, Store } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation, type LoginRequest } from "@/redux/fetures/auth.api";
import { useAppDispatch } from "@/redux/hooks";
import { baseApi } from "@/redux/api/baseApi";
import { useGetMeQuery } from "@/redux/fetures/users.api";
import { useCart } from "@/features/cart/CartContext";
import { demoMode } from "@/lib/demoMode";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { data: currentUser } = useGetMeQuery();
  const { clearCart } = useCart();
  const [demoPending, setDemoPending] = useState<"buyer" | "seller" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  useEffect(() => {
    const switchingDemo = sessionStorage.getItem("retro-demo-select") === "1";
    if (demoMode && !currentUser?.data && (location.hash === "#explore-demo" || switchingDemo)) {
      sessionStorage.removeItem("retro-demo-select");
      document.getElementById("explore-demo")?.scrollIntoView({ block: "center" });
    }
  }, [location.hash, currentUser?.data]);

  const onSubmit = async (data: LoginRequest) => {
    try {
      const response = await login(data).unwrap();
      if (response.success) {
        dispatch(baseApi.util.resetApiState());
        toast.success(response.message || "Signed in successfully");
        const from = location.state?.from;
        const returnPath = from?.pathname
          ? `${from.pathname}${from.search || ""}${from.hash || ""}`
          : "/";
        navigate(returnPath, { replace: true });
      }
    } catch (err: any) {
      const errorData = err?.data?.message || err?.message || "Sign in failed. Check your details and try again.";
      if (Array.isArray(errorData)) errorData.forEach((message: string) => toast.error(message));
      else toast.error(errorData);
    }
  };

  const enterDemo = async (persona: "buyer" | "seller") => {
    if (!demoMode || demoPending || isLoading) return;
    setDemoPending(persona);
    try {
      const email = persona === "buyer" ? "buyer@retro.demo" : "seller@retro.demo";
      const response = await login({ email, password: "retro123" }).unwrap();
      if (!response.success) throw new Error("Demo sign-in failed");
      // Demo exploration starts with an empty cart. Account carts stay isolated by user ID.
      localStorage.removeItem("local-market-cart:guest");
      clearCart();
      dispatch(baseApi.util.resetApiState());
      navigate(persona === "seller" ? "/seller/dashboard" : "/", { replace: true });
    } catch {
      toast.error("Demo access is unavailable. Please try again shortly.");
    } finally {
      setDemoPending(null);
    }
  };

  if (currentUser?.data) {
    const dashboard = currentUser.data.role === "SELLER" ? "/seller/dashboard" : "/user/dashboard";
    return <AuthShell title="You're signed in" description="Your Retro account is ready.">
      <Button asChild size="lg" className="w-full"><Link to={dashboard}>Go to your account <ArrowRight aria-hidden="true" /></Link></Button>
    </AuthShell>;
  }

  return (
    <AuthShell title="Welcome to Retro" description="Sign in to buy, sell, and manage your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email", { required: "Enter your email address" })}
          />
          {errors.email && <p id="login-email-error" className="text-xs font-medium text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="login-password">Password</Label>
            <Link to="/forgot-password" className="text-sm font-semibold text-brand-ink hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="At least 8 characters"
              className="pr-12"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              {...register("password", {
                required: "Enter your password",
                minLength: { value: 8, message: "Password must be at least 8 characters" },
              })}
            />
            <IconButton
              type="button"
              variant="ghost"
              size="icon-sm"
              label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground active:translate-y-[-50%]"
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </IconButton>
          </div>
          {errors.password && <p id="login-password-error" className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading} loadingText="Signing in">
          Sign in
        </Button>
      </form>

      {demoMode && <section id="explore-demo" aria-labelledby="demo-heading" className="mt-9 border-t pt-7">
        <div className="mb-4">
          <h2 id="demo-heading" className="text-xl font-semibold tracking-tight">Explore Retro</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a side of the marketplace. No account required.</p>
        </div>
        <div className="space-y-3">
          <button type="button" onClick={() => enterDemo("buyer")} disabled={Boolean(demoPending) || isLoading} className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-input hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-foreground"><ShoppingBag className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">Explore as Buyer</span><span className="mt-0.5 block text-sm text-muted-foreground">Browse, purchase, and view orders.</span></span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => enterDemo("seller")} disabled={Boolean(demoPending) || isLoading} className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-input hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-foreground"><Store className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">Explore as Seller</span><span className="mt-0.5 block text-sm text-muted-foreground">Manage listings and fulfill orders.</span></span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </div>
        {demoPending && <p role="status" className="mt-3 text-sm text-muted-foreground">Opening {demoPending} demo…</p>}
      </section>}

      <p className="mt-7 text-center text-sm text-muted-foreground">
        New to Retro?{" "}
        <Link to="/register" className="font-semibold text-brand-ink hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
