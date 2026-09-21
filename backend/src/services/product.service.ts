export type ProductLike = {
  _id: string;
  code?: string;
  sku?: string;
  name: string;
  category: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  sizes?: string[];
  colors?: string[];
  variants?: string[];
  keywords?: string[];
  isTrending: boolean;
  // Seller and promotion metadata
  sellerId?: string;
  sellerName?: string;
  promoted?: boolean;
  promotedUntil?: string; // ISO date
  promotionBid?: number; // simple numeric bid used for ordering promoted products
  price?: number;
  rating?: number;
  reviews?: number;
  stock?: number;
  sellerCity?: string;
  sellerState?: string;
  sellerPincode?: string;
  serviceablePincodes?: string[];
  fulfillmentLocations?: Array<{ city?: string; state?: string; pincode?: string; stock?: number; processingDays?: number; serviceablePincodes?: string[] }>;
  processingDays?: number;
  sellerPerformance?: { dispatchReliability?: number; returnRate?: number; rtoRate?: number; complaintRate?: number };
};

export type BannerLike = { active: boolean };

export function filterProducts<T extends ProductLike>(products: T[], categoryInput: unknown, searchInput: unknown) {
  const category = String(categoryInput || "").toLowerCase();
  const search = String(searchInput || "").toLowerCase();

  return products.filter((product) => {
    const matchesCategory = !category || product.category.toLowerCase().includes(category);
    const matchesSearch =
      !search ||
      [
        product.code,
        product.sku,
        product.name,
        product.category,
        product.description,
        product.seoTitle,
        product.seoDescription,
        ...(product.sizes || []),
        ...(product.colors || []),
        ...(product.variants || []),
        ...(product.keywords || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);

    return matchesCategory && matchesSearch;
  });
}

export function findProduct<T extends ProductLike>(products: T[], id: string) {
  return products.find((product) => product._id === id);
}

export function trendingProducts<T extends ProductLike>(products: T[]) {
  return products.filter((product) => product.isTrending);
}

export function activeBanners<T extends BannerLike>(banners: T[]) {
  return banners.filter((banner) => banner.active);
}
