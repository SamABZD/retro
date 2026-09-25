import { KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMeQuery } from "@/redux/fetures/users.api";

export default function Profile() {
  const { data, isLoading, isError, refetch } = useGetMeQuery();
  const user = data?.data;
  const seller = user?.role === "SELLER";

  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4 p-6"><Skeleton className="h-10 w-52" /><Skeleton className="h-72" /></div>;
  if (isError || !user) return <div className="mx-auto max-w-3xl p-6"><ErrorState title="Account details unavailable" description="Try loading your account again." action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>} /></div>;

  const fields = [
    ["First name", user.firstName], ["Last name", user.lastName],
    ["Username", user.nickName], ["Email", user.email],
    ["Account type", seller ? "Seller" : "Buyer"],
  ];

  return <div className="account-page !max-w-3xl space-y-6">
    <div><h1 className="type-h1">Account settings</h1><p className="mt-2 text-sm text-muted-foreground">Your account details and available security controls.</p></div>
    <section className="border-t" aria-labelledby="account-details-heading">
      <div className="border-b px-5 py-4"><h2 id="account-details-heading" className="text-lg font-semibold">Account details</h2><p className="mt-1 text-sm text-muted-foreground">These details are currently read-only.</p></div>
      <dl className="grid gap-0 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="min-w-0 border-b px-5 py-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value || "Not provided"}</dd></div>)}</dl>
    </section>
    <section className="flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="account-security-heading"><div><h2 id="account-security-heading" className="text-lg font-semibold">Password and security</h2><p className="mt-1 text-sm text-muted-foreground">Change your password using your current one.</p></div><Button asChild variant="outline"><Link to={seller ? "/seller/dashboard/change-password" : "/user/dashboard/change-password"}><KeyRound className="size-4" /> Change password</Link></Button></section>
  </div>;
}
