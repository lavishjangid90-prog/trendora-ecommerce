import { Router } from "express";
import type { createProductController } from "../controllers/product.controller";

type ProductController = ReturnType<typeof createProductController>;

export function createProductRouter(controller: ProductController) {
  const router = Router();
  router.get("/products", controller.list);
  router.get("/products/trending", controller.trending);
  router.get("/banners", controller.listBanners);
  router.get("/products/:id", controller.getById);
  return router;
}
