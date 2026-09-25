 
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff, Store } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegisterMutation, type RegisterRequest } from "@/redux/fetures/auth.api";
import { useAppDispatch } from "@/redux/hooks";
import { baseApi } from "@/redux/api/baseApi";

type RegistrationForm = RegisterRequest & { confirmPassword: string };

export default function SignUp() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegistrationForm>({
    defaultValues: { role: searchParams.get("role") === "SELLER" ? "SELLER" : "USER" },
  });
  const selectedRole = watch("role");
  const passwordValue = watch("password");

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...registration }: RegistrationForm) => {
    try {
      const response = await registerUser(registration).unwrap();
      if (response.success) {
        dispatch(baseApi.util.resetApiState());
        toast.success(response.message || "Account created");
        navigate(registration.role === "SELLER" ? "/create-seller-profile" : "/");
      }
    } catch (err: any) {
      const errorData = err?.data?.message || "We could not create your account. Please try again.";
      if (Array.isArray(errorData)) errorData.forEach((message: string) => toast.error(message));
      else toast.error(errorData);
    }
  };

  return (
    <AuthShell title="Create your account" description="Join as a buyer, or continue to a short seller application after registration.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first-name">First name</Label>
            <Input id="first-name" autoComplete="given-name" placeholder="Alex" aria-invalid={Boolean(errors.firstName)} {...register("firstName", { required: "Enter your first name" })} />
            {errors.firstName && <p className="text-xs font-medium text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input id="last-name" autoComplete="family-name" placeholder="Morgan" aria-invalid={Boolean(errors.lastName)} {...register("lastName", { required: "Enter your last name" })} />
            {errors.lastName && <p className="text-xs font-medium text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-type">How will you use Retro?</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="account-type"><SelectValue placeholder="Choose an account type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">I want to buy</SelectItem>
                  <SelectItem value="SELLER">I want to sell</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {selectedRole === "SELLER" && (
            <p className="flex items-start gap-2 rounded-md border bg-muted/55 p-3 text-xs leading-5 text-muted-foreground">
              <Store className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden="true" />
              Your account starts as a buyer account. You will continue to the seller application after registration.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Display name</Label>
          <Input id="nickname" autoComplete="nickname" placeholder="How people will know you" aria-invalid={Boolean(errors.nickName)} {...register("nickName", { required: "Choose a display name" })} />
          {errors.nickName && <p className="text-xs font-medium text-destructive">{errors.nickName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email address</Label>
          <Input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} {...register("email", { required: "Enter your email address" })} />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input id="register-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" className="pr-12" aria-invalid={Boolean(errors.password)} {...register("password", { required: "Create a password", minLength: { value: 8, message: "Use at least 8 characters" } })} />
            <IconButton type="button" variant="ghost" size="icon-sm" label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground active:translate-y-[-50%]">
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </IconButton>
          </div>
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" aria-invalid={Boolean(errors.confirmPassword)} {...register("confirmPassword", { required: "Confirm your password", validate: (value) => value === passwordValue || "Passwords do not match" })} />
          {errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading} loadingText="Creating account">
          Create account
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already have an account?{" "}<Link to="/login" className="font-semibold text-brand-ink hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
