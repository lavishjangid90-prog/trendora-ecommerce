import type { RequestHandler } from "express";
import {
  activeBanners,
  filterProducts,
  findProduct,
  trendingProducts,
  type BannerLike,
  type ProductLike,
} from "../services/product.service";
import { estimateDelivery, rankProduct, type DeliveryLocation, type LocalCommerceConfig } from "../services/fulfillment.service";

export function createProductController<TProduct extends ProductLike, TBanner extends BannerLike>(
  products: TProduct[],
  banners: TBanner[],
  options?: { getConfig: () => LocalCommerceConfig },
) {
  const list: RequestHandler = (req, res) => {
    const filtered = filterProducts(products, req.query.category, req.query.search);
    const now = Date.now();
    const customer: DeliveryLocation = { pincode: String(req.query.pincode || ""), city: String(req.query.city || ""), state: String(req.query.state || "") };
    const localFilter = String(req.query.local || "");
    const ranked = customer.pincode || customer.city || customer.state
      ? filtered.filter((product) => localFilter === "local" ? estimateDelivery(product, customer).isLocal : true).map((product) => ({ product, localScore: rankProduct(product, customer, options?.getConfig() as LocalCommerceConfig, String(req.query.search || "") ? 1 : 0), delivery: estimateDelivery(product, customer) }))
      : filtered.map((product) => ({ product, localScore: 0, delivery: undefined }));
    const sorted = ranked.sort((a, b) => {
      const aProduct = a.product; const bProduct = b.product;
      // Sponsored inventory is ordered within sponsored placement only; organic score still determines organic results.
      const aPromoted = aProduct.promoted && aProduct.promotedUntil && new Date(aProduct.promotedUntil).getTime() > now;
      const bPromoted = bProduct.promoted && bProduct.promotedUntil && new Date(bProduct.promotedUntil).getTime() > now;
      if (aPromoted && bPromoted) {
        const aBid = Number(aProduct.promotionBid || 0);
        const bBid = Number(bProduct.promotionBid || 0);
        if (bBid !== aBid) return bBid - aBid;
        return new Date(String(bProduct.promotedUntil || 0)).getTime() - new Date(String(aProduct.promotedUntil || 0)).getTime();
      }
      if (aPromoted) return -1;
      if (bPromoted) return 1;
      return b.localScore - a.localScore;
    });
    res.json(sorted.map(({ product, localScore, delivery }) => ({ ...product, localScore: customer.pincode || customer.city || customer.state ? Math.round(localScore) : undefined, estimatedDelivery: delivery ? `${delivery.minDays}–${delivery.maxDays} days` : undefined, fulfillmentCity: delivery?.location?.city || product.sellerCity, isLocal: delivery?.isLocal || false })));
  };

  const trending: RequestHandler = (_req, res) => {
    res.json(trendingProducts(products));
  };

  const getById: RequestHandler = (req, res) => {
    const product = findProduct(products, req.params.id);
    if (product) {
      const customer: DeliveryLocation = { pincode: String(req.query.pincode || ""), city: String(req.query.city || ""), state: String(req.query.state || "") };
      const hasLocation = Boolean(customer.pincode || customer.city || customer.state);
      const delivery = hasLocation ? estimateDelivery(product, customer) : undefined;
      res.json({ ...product, estimatedDelivery: delivery ? `${delivery.minDays}–${delivery.maxDays} days` : undefined, fulfillmentCity: delivery?.location?.city || product.sellerCity, isLocal: delivery?.isLocal || false });
      return;
    }
    res.status(404).json({ message: "Product not found" });
  };

  const listBanners: RequestHandler = (_req, res) => {
    res.json(activeBanners(banners));
  };

  return { list, trending, getById, listBanners };
}
