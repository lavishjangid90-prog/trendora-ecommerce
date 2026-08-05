import type { RequestHandler } from "express";
import {
  activeBanners,
  filterProducts,
  findProduct,
  trendingProducts,
  type BannerLike,
  type ProductLike,
} from "../services/product.service";

export function createProductController<TProduct extends ProductLike, TBanner extends BannerLike>(
  products: TProduct[],
  banners: TBanner[],
) {
  const list: RequestHandler = (req, res) => {
    const filtered = filterProducts(products, req.query.category, req.query.search);
    const now = Date.now();
    const sorted = filtered.slice().sort((a, b) => {
      const aPromoted = a.promoted && a.promotedUntil && new Date(a.promotedUntil).getTime() > now;
      const bPromoted = b.promoted && b.promotedUntil && new Date(b.promotedUntil).getTime() > now;
      if (aPromoted && bPromoted) {
        const aBid = Number(a.promotionBid || 0);
        const bBid = Number(b.promotionBid || 0);
        if (bBid !== aBid) return bBid - aBid;
        return new Date(String(b.promotedUntil || 0)).getTime() - new Date(String(a.promotedUntil || 0)).getTime();
      }
      if (aPromoted) return -1;
      if (bPromoted) return 1;
      return 0;
    });
    res.json(sorted);
  };

  const trending: RequestHandler = (_req, res) => {
    res.json(trendingProducts(products));
  };

  const getById: RequestHandler = (req, res) => {
    const product = findProduct(products, req.params.id);
    if (product) {
      res.json(product);
      return;
    }
    res.status(404).json({ message: "Product not found" });
  };

  const listBanners: RequestHandler = (_req, res) => {
    res.json(activeBanners(banners));
  };

  return { list, trending, getById, listBanners };
}
