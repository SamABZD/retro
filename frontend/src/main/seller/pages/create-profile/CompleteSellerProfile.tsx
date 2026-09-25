 
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useGetAllCategoriesQuery } from "@/redux/fetures/categories.api";
import { useCreateSellerProfileMutation, useGetSellerApplicationStatusQuery } from "@/redux/fetures/users.api";

interface SellerApplicationForm {
  businessName: string;
  businessDescription: string;
  businessPhoneNumber: string;
  businessAddress: string;
  cityRegion: string;
  yearsOfExperience: number;
  websiteOrSocialLink?: string;
  messageToAdmin?: string;
  categoryIds: string[];
}

export default function CompleteSellerProfile() {
  const navigate = useNavigate();
  const [submitApplication, { isLoading }] = useCreateSellerProfileMutation();
  const { data: application, isLoading: statusLoading, isError: statusError, refetch: refetchStatus } = useGetSellerApplicationStatusQuery();
  const { data: categoryResponse, isLoading: categoriesLoading, isError: categoriesError, refetch } = useGetAllCategoriesQuery({ page: 1, limit: 20 });
  const categories = categoryResponse?.data || [];
  const { register, handleSubmit, formState: { errors } } = useForm<SellerApplicationForm>();

  const onSubmit = async (data: SellerApplicationForm) => {
    try {
      await submitApplication({
        ...data,
        categoryIds: (data.categoryIds || []).map(Number),
        yearsOfExperience: Number(data.yearsOfExperience),
        websiteOrSocialLink: data.websiteOrSocialLink || null,
        messageToAdmin: data.messageToAdmin || "I would like to sell on Retro.",
      }).unwrap();
      toast.success("Seller application submitted for review");
      navigate("/user/dashboard");
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not submit your application");
    }
  };

  if (statusLoading) return <div className="mx-auto max-w-4xl space-y-4 py-8"><Skeleton className="h-10 w-72" /><Skeleton className="h-64" /></div>;
  if (statusError) return <div className="mx-auto max-w-4xl py-8"><ErrorState title="Application status unavailable" description="Try loading your seller application again." action={<Button onClick={() => refetchStatus()}>Retry</Button>} /></div>;
  if (application?.status === "PENDING") return <div className="mx-auto max-w-2xl py-10"><h1 className="text-3xl font-semibold">Application under review</h1><p className="mt-3 text-muted-foreground">Your seller application has been submitted. We'll make seller tools available if it is approved.</p><Button asChild variant="outline" className="mt-6"><Link to="/user/dashboard">Back to account</Link></Button></div>;
  if (application?.status === "APPROVED") return <div className="mx-auto max-w-2xl py-10"><h1 className="text-3xl font-semibold">Application approved</h1><p className="mt-3 text-muted-foreground">Sign in again to open your seller account.</p><Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
      <SectionHeader
        level={1}
        eyebrow="Seller application"
        title="Start selling on Retro"
        description="Tell us about what you plan to sell. A seller can list a single used item, a collection, or products from a small shop."
      />

      {application?.status === "DECLINED" && <ErrorState className="mt-6" title="Your previous application needs changes" description={application.declineReason || "Review your details and submit a new application."} />}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8 border-t pt-7" noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seller-name">Seller or shop name</Label>
            <Input id="seller-name" autoComplete="organization" placeholder="How buyers will know you" aria-invalid={Boolean(errors.businessName)} {...register("businessName", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-phone">Contact phone</Label>
            <Input id="seller-phone" type="tel" autoComplete="tel" placeholder="+1 555 000 0000" aria-invalid={Boolean(errors.businessPhoneNumber)} {...register("businessPhoneNumber", { required: true })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seller-description">What do you sell?</Label>
            <Textarea id="seller-description" rows={4} placeholder="For example: pre-owned clothes, restored guitars, old books, electronics, or household items." aria-invalid={Boolean(errors.businessDescription)} {...register("businessDescription", { required: true, minLength: 20 })} />
            <p className="text-xs leading-5 text-muted-foreground">Use at least 20 characters so the review team understands your shop.</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seller-address">Pickup or return address</Label>
            <Input id="seller-address" autoComplete="street-address" placeholder="Street and number" aria-invalid={Boolean(errors.businessAddress)} {...register("businessAddress", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-city">City or region</Label>
            <Input id="seller-city" autoComplete="address-level2" placeholder="City, region" aria-invalid={Boolean(errors.cityRegion)} {...register("cityRegion", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-experience">Years selling <span className="font-normal text-muted-foreground">(0 is fine)</span></Label>
            <Input id="seller-experience" type="number" min="0" inputMode="numeric" placeholder="0" aria-invalid={Boolean(errors.yearsOfExperience)} {...register("yearsOfExperience", { required: true, valueAsNumber: true, min: 0 })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="seller-website">Website or social page <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="seller-website" type="url" autoComplete="url" placeholder="https://" {...register("websiteOrSocialLink")} />
          </div>
        </div>

        <fieldset>
          <legend className="type-label">Categories you plan to sell in</legend>
          <p className="mt-1 text-xs text-muted-foreground">Choose one or more general marketplace categories.</p>
          {categoriesLoading ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3" aria-label="Loading categories">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12" />)}
            </div>
          ) : categoriesError ? (
            <ErrorState className="mt-4" title="Categories are unavailable" description="Try loading the seller categories again." action={<Button type="button" variant="outline" onClick={() => refetch()}>Try again</Button>} />
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {categories.map((category: any) => (
                <label key={category.id} className="flex min-h-12 cursor-pointer items-center gap-3 border-b px-1 py-2 text-sm font-medium hover:border-input hover:bg-accent/50">
                  <Checkbox
                    value={category.id}
                    {...register("categoryIds", { validate: (value) => value?.length > 0 || "Choose at least one category" })}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          )}
          {errors.categoryIds && <p className="mt-2 text-xs font-medium text-destructive">Choose at least one category.</p>}
        </fieldset>

        <div className="flex flex-col gap-5 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-lg items-start gap-2 text-sm leading-6 text-muted-foreground">
            <Building2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Applications are reviewed by a marketplace administrator before seller tools are enabled.
          </p>
          <Button type="submit" size="lg" isLoading={isLoading} loadingText="Submitting" disabled={categoriesLoading || categoriesError}>
            Submit application
          </Button>
        </div>
      </form>
    </div>
  );
}
