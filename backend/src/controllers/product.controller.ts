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
    res.json(filterProducts(products, req.query.category, req.query.search));
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
