 
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useForgotPasswordMutation, useResetPasswordMutation, type ResetPasswordRequest } from "@/redux/fetures/auth.api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [userEmail, setUserEmail] = useState("");
  const [forgotPassword, { isLoading: isRequesting }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  const requestForm = useForm<{ email: string }>();
  const resetForm = useForm<ResetPasswordRequest>();

  const requestCode = async (data: { email: string }) => {
    try {
      const response = await forgotPassword(data).unwrap();
      if (response.success) {
        toast.success(response.message || "Verification code sent");
        setUserEmail(data.email);
        setStep("reset");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "We could not send a verification code");
    }
  };

  const resetAccess = async (data: ResetPasswordRequest) => {
    try {
      const response = await resetPassword({ ...data, email: userEmail }).unwrap();
      if (response.success) {
        toast.success(response.message || "Password reset successfully");
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "We could not reset your password");
    }
  };

  return (
    <AuthShell
      title={step === "request" ? "Reset your password" : "Enter your code"}
      description={step === "request" ? "Enter the email linked to your account and we will send a verification code." : `We sent a verification code to ${userEmail}.`}
      asideTitle="Get back to your marketplace account."
      asideDescription="Reset access securely, then continue buying, selling, and managing your listings."
    >
      {step === "request" ? (
        <form onSubmit={requestForm.handleSubmit(requestCode)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email address</Label>
            <Input id="reset-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(requestForm.formState.errors.email)} {...requestForm.register("email", { required: "Enter your email address" })} />
            {requestForm.formState.errors.email && <p className="text-xs font-medium text-destructive">{requestForm.formState.errors.email.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" isLoading={isRequesting} loadingText="Sending code">Send verification code</Button>
          <Link to="/login" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-ink hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to sign in
          </Link>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(resetAccess)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification code</Label>
            <InputOTP id="verification-code" maxLength={6} aria-label="Six digit verification code" onChange={(value) => resetForm.setValue("otp", value, { shouldValidate: true })}>
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} className="size-11 rounded-md border-input bg-card text-base" />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={Boolean(resetForm.formState.errors.newPassword)} {...resetForm.register("newPassword", { required: "Enter a new password", minLength: { value: 8, message: "Use at least 8 characters" } })} />
            {resetForm.formState.errors.newPassword && <p className="text-xs font-medium text-destructive">{resetForm.formState.errors.newPassword.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" isLoading={isResetting} loadingText="Resetting password">Reset password</Button>
          <button type="button" onClick={() => setStep("request")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-ink hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" /> Use a different email
          </button>
        </form>
      )}
    </AuthShell>
  );
}
