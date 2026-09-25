import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterValues {
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
}

interface FilterSearchProps {
  idPrefix: string;
  values: FilterValues;
  categories: Array<{ id: string; name: string }>;
  onChange: (next: FilterValues) => void;
}

export default function FilterSearch({ idPrefix, values, categories, onChange }: FilterSearchProps) {
  const set = (key: keyof FilterValues, value: string) => onChange({ ...values, [key]: value });

  return (
    <div className="space-y-6 [&>div]:border-b [&>div]:pb-6">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category-filter`}>Category</Label>
        <Select value={values.category || "all"} onValueChange={(value) => set("category", value === "all" ? "" : value)}>
          <SelectTrigger id={`${idPrefix}-category-filter`}><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-condition-filter`}>Condition</Label>
        <Select value={values.condition || "all"} onValueChange={(value) => set("condition", value === "all" ? "" : value)}>
          <SelectTrigger id={`${idPrefix}-condition-filter`}><SelectValue placeholder="Any condition" /></SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">Any condition</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="LIKE_NEW">Like new</SelectItem>
            <SelectItem value="GOOD">Good</SelectItem>
            <SelectItem value="FAIR">Fair</SelectItem>
            <SelectItem value="POOR">Well used</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Price range</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`${idPrefix}-minimum-price`} className="sr-only">Minimum price</Label>
            <Input
              id={`${idPrefix}-minimum-price`}
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="Min"
              value={values.minPrice}
              onChange={(event) => set("minPrice", event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-maximum-price`} className="sr-only">Maximum price</Label>
            <Input
              id={`${idPrefix}-maximum-price`}
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="Max"
              value={values.maxPrice}
              onChange={(event) => set("maxPrice", event.target.value)}
            />
          </div>
        </div>
        {values.minPrice && values.maxPrice && Number(values.minPrice) > Number(values.maxPrice) && (
          <p className="mt-2 text-xs text-destructive">Minimum price must not exceed maximum price.</p>
        )}
      </fieldset>
    </div>
  );
}
