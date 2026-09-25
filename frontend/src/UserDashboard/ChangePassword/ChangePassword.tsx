import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/features/cart/CartContext";
import { useChangePasswordMutation } from "@/redux/fetures/auth.api";
import { baseApi } from "@/redux/api/baseApi";
import { useAppDispatch } from "@/redux/hooks";

export default function ChangePassword() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { clearCart } = useCart();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!current || next.length < 8 || next !== confirm || current === next) {
      setError("Enter your current password, choose a different password of at least 8 characters, and confirm it exactly.");
      return;
    }
    try {
      await changePassword({ currentPassword: current, newPassword: next }).unwrap();
      clearCart();
      dispatch(baseApi.util.resetApiState());
      toast.success("Password updated. Sign in again with your new password.");
      navigate("/login", { replace: true });
    } catch (requestError: any) {
      setError(requestError?.data?.message || "Password could not be changed. Check your current password and try again.");
    }
  };

  return <div className="account-page !max-w-3xl space-y-6">
    <div><h1 className="type-h1">Change password</h1><p className="mt-2 text-sm text-muted-foreground">For your security, you'll sign in again after changing it.</p></div>
    {error && <ErrorState title="Password not changed" description={error} />}
    <form onSubmit={submit} className="space-y-5 border-t p-5 sm:p-6" noValidate>
      <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={(event) => { setCurrent(event.target.value); setError(""); }} /></div>
      <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={next} onChange={(event) => { setNext(event.target.value); setError(""); }} aria-describedby="password-guidance" /><p id="password-guidance" className="text-xs text-muted-foreground">Use at least 8 characters and a mix of letters, numbers, or symbols.</p></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => { setConfirm(event.target.value); setError(""); }} /></div>
      <Button type="submit" isLoading={isLoading} loadingText="Changing password">Update password</Button>
    </form>
  </div>;
}
