export type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
export type ListingStatus = "ACTIVE" | "SOLD" | "INACTIVE" | "ARCHIVED";
export type MarketplaceSort = "newest" | "price-asc" | "price-desc";

export interface MarketplaceCategory {
  id: string;
  name: string;
  productCount?: number;
}

export interface MarketplaceSeller {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  nickName?: string;
}

export interface MarketplaceImage {
  url: string;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  stock: boolean;
  condition: ListingCondition;
  listingStatus: ListingStatus;
  createdAt?: string;
  updatedAt?: string;
  images: MarketplaceImage[];
  categories: MarketplaceCategory[];
  seller: MarketplaceSeller;
  sellerId: string;
}

export interface MarketplacePage {
  data: MarketplaceListing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MarketplaceQueryArgs {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: MarketplaceSort;
  sortByPrice?: "asc" | "desc";
  [key: string]: unknown;
}
