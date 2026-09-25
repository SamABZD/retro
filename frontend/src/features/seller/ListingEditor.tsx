import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ListingImage } from "@/components/marketplace/ListingImage";
import { useGetAllCategoriesQuery } from "@/redux/fetures/categories.api";
import { useCreateAdMutation, useUpdateAdMutation } from "@/redux/fetures/ads.api";
import type { SellerListing } from "@/redux/fetures/sellerListings.api";

interface FormValues {
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  price: string;
  quantity: string;
  available: boolean;
}

const emptyForm: FormValues = {
  title: "",
  description: "",
  categoryId: "",
  condition: "GOOD",
  price: "",
  quantity: "1",
  available: true,
};

const fieldClass = "h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function NewImagePreview({ file, alt }: { file: File; alt: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <ListingImage src={url} alt={alt} className="aspect-square w-full rounded-md" />;
}

export function ListingEditor({ listing }: { listing?: SellerListing }) {
  const navigate = useNavigate();
  const editing = Boolean(listing);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [retained, setRetained] = useState<string[]>([]);
  const [uploads, setUploads] = useState<File[]>([]);
  const [formError, setFormError] = useState("");
  const [imageError, setImageError] = useState("");
  const { data: categoryResponse, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } =
    useGetAllCategoriesQuery({ page: 1, limit: 100 });
  const categories = categoryResponse?.data || [];
  const [createListing, { isLoading: isCreating }] = useCreateAdMutation();
  const [updateListing, { isLoading: isUpdating }] = useUpdateAdMutation();
  const busy = isCreating || isUpdating;

  useEffect(() => {
    if (!listing) return;
    setForm({
      title: listing.title,
      description: listing.description,
      categoryId: listing.categoryId,
      condition: listing.condition,
      price: String(listing.price),
      quantity: String(listing.quantity),
      available: listing.listingStatus === "ACTIVE",
    });
    setRetained(listing.rawImages);
    setUploads([]);
  }, [listing]);

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    if (retained.length + uploads.length + selected.length > 8) {
      setImageError("A listing can have at most 8 photos.");
      return;
    }
    if (selected.some((file) => !file.type.startsWith("image/") || file.size > 5_000_000)) {
      setImageError("Choose image files smaller than 5 MB each.");
      return;
    }
    setUploads((current) => [...current, ...selected]);
    setImageError("");
  };

  const move = (index: number, direction: -1 | 1, kind: "retained" | "upload") => {
    const setter = kind === "retained" ? setRetained : setUploads;
    setter((current: any[]) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (title.length < 2 || !description || !form.categoryId || !Number.isFinite(price) || price <= 0 ||
        !Number.isInteger(quantity) || quantity < (editing ? 0 : 1)) {
      setFormError("Complete the title, description, category, positive price, and valid quantity.");
      return;
    }
    if (retained.length + uploads.length < 1) {
      setImageError("Add at least one photo before saving.");
      return;
    }

    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("price", price.toFixed(2));
    data.append("quantity", String(quantity));
    data.append("condition", form.condition);
    const categoryIds = editing && form.categoryId === listing?.categoryId
      ? listing.categoryIds : [form.categoryId];
    data.append("categoryIds", categoryIds.join(","));
    if (editing) {
      data.append("existingImages", JSON.stringify(retained));
      data.append("listingStatus", quantity === 0 ? "SOLD" : form.available ? "ACTIVE" : "INACTIVE");
    }
    uploads.forEach((file) => data.append("images", file));

    try {
      if (listing) {
        await updateListing({ adId: listing.id, data }).unwrap();
        toast.success("Listing changes submitted for review");
      } else {
        await createListing(data).unwrap();
        toast.success("Listing submitted for review");
      }
      navigate("/seller/dashboard/all-ads");
    } catch (error: any) {
      setFormError(error?.data?.message || "Your listing could not be saved. Try again.");
    }
  };

  return (
    <div className="account-page !max-w-3xl space-y-6">
      <Link to="/seller/dashboard/all-ads" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink hover:underline">
        <ArrowLeft className="size-4" /> My listings
      </Link>
      <div>
        <h1 className="type-h1">{editing ? "Edit listing" : "Create a listing"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {editing ? "Update the details buyers see. Changes return to review before appearing publicly." :
            "Describe what you're selling. New listings are reviewed before appearing publicly."}
        </p>
      </div>

      {categoriesError && <ErrorState title="Categories could not be loaded" description="Try again before saving your listing." action={<Button type="button" variant="outline" onClick={() => refetchCategories()}>Retry</Button>} />}
      {formError && <ErrorState title="Listing not saved" description={formError} />}

      <form onSubmit={submit} noValidate className="space-y-6">
        <div className="space-y-6">
          <section className="editorial-section space-y-5" aria-labelledby="listing-details-heading">
            <h2 id="listing-details-heading" className="type-h2">Listing details</h2>
            <div className="space-y-2">
              <Label htmlFor="listing-title">Title</Label>
              <Input id="listing-title" value={form.title} maxLength={255} required aria-invalid={Boolean(formError && form.title.trim().length < 2)} onChange={(event) => setField("title", event.target.value)} placeholder="e.g. Vintage electric guitar" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing-description">Description</Label>
              <Textarea id="listing-description" value={form.description} rows={7} maxLength={255} required onChange={(event) => setField("description", event.target.value)} placeholder="Condition, what is included, and any details a buyer should know" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="listing-category">Category</Label>
                {categoriesLoading ? <Skeleton className="h-11" /> : (
                  <select id="listing-category" value={form.categoryId} required onChange={(event) => setField("categoryId", event.target.value)} className={fieldClass}>
                    <option value="">Choose a category</option>
                    {categories.map((category: { id: string; name: string }) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing-condition">Condition</Label>
                <select id="listing-condition" value={form.condition} onChange={(event) => setField("condition", event.target.value)} className={fieldClass}>
                  <option value="NEW">New</option><option value="LIKE_NEW">Like new</option><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="POOR">Well used</option>
                </select>
              </div>
            </div>
          </section>

          <section className="editorial-section space-y-5" aria-labelledby="listing-pricing-heading">
            <div>
              <h2 id="listing-pricing-heading" className="type-h2">Pricing & inventory</h2>
              <p className="mt-1 text-sm text-muted-foreground">Set the buyer price and how many are available.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="listing-price">Price (USD)</Label>
                <Input id="listing-price" type="number" min="0.01" step="0.01" inputMode="decimal" value={form.price} required onChange={(event) => setField("price", event.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing-quantity">Quantity</Label>
                <Input id="listing-quantity" type="number" min={editing ? 0 : 1} step={1} inputMode="numeric" value={form.quantity} required onChange={(event) => setField("quantity", event.target.value)} />
                {editing && <p className="text-xs text-muted-foreground">Zero marks the listing as sold.</p>}
              </div>
            </div>
          </section>

          <section className="editorial-section space-y-4" aria-labelledby="listing-photos-heading">
            <div>
              <h2 id="listing-photos-heading" className="type-h2">Photos</h2>
              <p className="mt-1 text-sm text-muted-foreground">Up to 8 images, 5 MB each. The first photo is the cover.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {retained.map((raw, index) => (
                <div key={raw} className="space-y-2">
                  <ListingImage src={listing?.images[listing.rawImages.indexOf(raw)]} alt={`${form.title || "Listing"} photo ${index + 1}`} className="aspect-square w-full rounded-md" />
                  <div className="flex justify-between gap-1">
                    <button type="button" aria-label={`Move photo ${index + 1} earlier`} disabled={index === 0} onClick={() => move(index, -1, "retained")} className="rounded p-1.5 hover:bg-muted disabled:opacity-35"><ArrowUp className="size-4" /></button>
                    <button type="button" aria-label={`Move photo ${index + 1} later`} disabled={index === retained.length - 1} onClick={() => move(index, 1, "retained")} className="rounded p-1.5 hover:bg-muted disabled:opacity-35"><ArrowDown className="size-4" /></button>
                    <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => setRetained((current) => current.filter((_, item) => item !== index))} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><X className="size-4" /></button>
                  </div>
                </div>
              ))}
              {uploads.map((file, index) => (
                <div key={`${file.name}-${file.lastModified}-${index}`} className="space-y-2">
                  <NewImagePreview file={file} alt={`${form.title || "Listing"} new photo ${index + 1}`} />
                  <div className="flex justify-between gap-1">
                    <button type="button" aria-label={`Move new photo ${index + 1} earlier`} disabled={index === 0} onClick={() => move(index, -1, "upload")} className="rounded p-1.5 hover:bg-muted disabled:opacity-35"><ArrowUp className="size-4" /></button>
                    <button type="button" aria-label={`Move new photo ${index + 1} later`} disabled={index === uploads.length - 1} onClick={() => move(index, 1, "upload")} className="rounded p-1.5 hover:bg-muted disabled:opacity-35"><ArrowDown className="size-4" /></button>
                    <button type="button" aria-label={`Remove new photo ${index + 1}`} onClick={() => setUploads((current) => current.filter((_, item) => item !== index))} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><X className="size-4" /></button>
                  </div>
                </div>
              ))}
              {retained.length + uploads.length < 8 && (
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-input border-dashed bg-transparent p-3 text-center text-sm font-medium text-foreground hover:bg-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
                  <ImagePlus className="size-6" aria-hidden="true" /> Add photos
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
                </label>
              )}
            </div>
            {imageError && <p role="alert" className="text-sm text-destructive">{imageError}</p>}
            {editing && <p className="text-xs text-muted-foreground">New uploads are added after the photos you keep. To make a new photo the cover, remove the old cover first.</p>}
          </section>
        </div>

        <aside className="editorial-section space-y-5">
          <h2 className="type-h2">Before you save</h2>
          <p className="text-sm leading-6 text-muted-foreground">Check your description and photos. An administrator reviews new and edited listings before they appear in the marketplace.</p>
          {editing && (
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input type="checkbox" checked={form.available} disabled={Number(form.quantity) === 0} onChange={(event) => setField("available", event.target.checked)} className="mt-1 accent-[var(--brand-ink)]" />
              <span><span className="font-semibold">Available after approval</span><span className="mt-1 block text-muted-foreground">Turn off to keep this listing inactive.</span></span>
            </label>
          )}
          <Button type="submit" className="w-full sm:w-auto" isLoading={busy} loadingText="Saving" disabled={categoriesLoading || categoriesError}>
            {editing ? "Save changes" : "Submit listing"}
          </Button>
          <Button type="button" variant="ghost" className="w-full sm:ml-3 sm:w-auto" onClick={() => navigate("/seller/dashboard/all-ads")}>Cancel</Button>
        </aside>
      </form>
    </div>
  );
}
