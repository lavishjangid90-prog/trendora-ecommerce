export type DeliveryLocation = { pincode?: string; city?: string; state?: string };

export type FulfillmentLocation = DeliveryLocation & {
  id?: string;
  stock?: number;
  processingDays?: number;
  serviceablePincodes?: string[];
};

export type FulfillmentProduct = {
  _id: string;
  price: number;
  rating?: number;
  reviews?: number;
  stock?: number;
  sellerCity?: string;
  sellerState?: string;
  sellerPincode?: string;
  serviceablePincodes?: string[];
  fulfillmentLocations?: FulfillmentLocation[];
  processingDays?: number;
  sellerPerformance?: { dispatchReliability?: number; returnRate?: number; rtoRate?: number; complaintRate?: number };
  sponsored?: boolean;
};

export type LocalCommerceConfig = {
  ranking: { samePincode: number; sameCity: number; nearbyRegion: number; sameState: number; otherState: number; delivery: number; quality: number; relevance: number };
  shipping: { freeShippingThreshold: number; fixedFee: number; localDeliveryFee: number; customerContribution: number; sellerContribution: number; returnPolicies: Record<string, "customer" | "seller" | "logistics"> };
  ai: { freeUsageLimit: number; premiumUsageLimit: number; premiumPrice: number };
};

export const defaultLocalCommerceConfig: LocalCommerceConfig = {
  ranking: { samePincode: 100, sameCity: 70, nearbyRegion: 45, sameState: 25, otherState: 5, delivery: 18, quality: 36, relevance: 20 },
  shipping: { freeShippingThreshold: 999, fixedFee: 99, localDeliveryFee: 49, customerContribution: 1, sellerContribution: 0, returnPolicies: { "wrong product": "seller", defective: "seller", damaged: "logistics", "changed mind": "customer", "size too small": "customer", "size too large": "customer" } },
  ai: { freeUsageLimit: 5, premiumUsageLimit: 50, premiumPrice: 199 },
};

const normal = (value?: string) => String(value || "").trim().toLowerCase();
const prefix = (value?: string) => String(value || "").replace(/\D/g, "").slice(0, 3);

export function resolveFulfillment(product: FulfillmentProduct, customer: DeliveryLocation) {
  const locations = product.fulfillmentLocations?.filter((location) => Number(location.stock ?? 0) > 0) || [];
  const fallback: FulfillmentLocation = { city: product.sellerCity, state: product.sellerState, pincode: product.sellerPincode, stock: product.stock, processingDays: product.processingDays, serviceablePincodes: product.serviceablePincodes };
  const candidates = locations.length ? locations : [fallback];
  return candidates.sort((a, b) => localityLevel(b, customer) - localityLevel(a, customer))[0];
}

export function localityLevel(origin: DeliveryLocation, customer: DeliveryLocation) {
  if (origin.pincode && customer.pincode && normal(origin.pincode) === normal(customer.pincode)) return 4;
  if (origin.city && customer.city && normal(origin.city) === normal(customer.city)) return 3;
  if (origin.state && customer.state && normal(origin.state) === normal(customer.state) && prefix(origin.pincode) === prefix(customer.pincode)) return 2;
  if (origin.state && customer.state && normal(origin.state) === normal(customer.state)) return 1;
  return 0;
}

export function isServiceable(product: FulfillmentProduct, customer: DeliveryLocation) {
  const location = resolveFulfillment(product, customer);
  const pincodes = location?.serviceablePincodes?.length ? location.serviceablePincodes : product.serviceablePincodes;
  return !pincodes?.length || Boolean(customer.pincode && pincodes.includes(String(customer.pincode).trim()));
}

export function estimateDelivery(product: FulfillmentProduct, customer: DeliveryLocation) {
  const location = resolveFulfillment(product, customer);
  const level = localityLevel(location || {}, customer);
  const processing = Math.max(0, Number(location?.processingDays ?? product.processingDays ?? 1));
  const transit = level === 4 ? 0 : level === 3 ? 1 : level === 2 ? 2 : level === 1 ? 3 : 5;
  const minDays = Math.max(1, Math.ceil(processing + transit));
  return { minDays, maxDays: minDays + (level >= 3 ? 1 : 2), location, isLocal: level >= 3, serviceable: isServiceable(product, customer) };
}

export function rankProduct(product: FulfillmentProduct, customer: DeliveryLocation, config: LocalCommerceConfig, relevance = 0) {
  const delivery = estimateDelivery(product, customer);
  const localityWeights = [config.ranking.otherState, config.ranking.sameState, config.ranking.nearbyRegion, config.ranking.sameCity, config.ranking.samePincode];
  const performance = product.sellerPerformance || {};
  const quality = (Number(product.rating || 0) / 5) * 18 + Math.min(10, Math.log10(Number(product.reviews || 0) + 1) * 4) + (Number(performance.dispatchReliability ?? 85) / 100) * 8 - Number(performance.returnRate || 0) * .15 - Number(performance.rtoRate || 0) * .1 - Number(performance.complaintRate || 0) * .2;
  return localityWeights[localityLevel(delivery.location || {}, customer)] + (delivery.maxDays ? config.ranking.delivery / delivery.maxDays : 0) + quality * (config.ranking.quality / 36) + relevance * config.ranking.relevance;
}

export function calculateShipping(itemsTotal: number, products: FulfillmentProduct[], customer: DeliveryLocation, config: LocalCommerceConfig) {
  if (itemsTotal >= config.shipping.freeShippingThreshold) return { customerShipping: 0, sellerShipping: 0, logisticsEstimate: 0, shippingMargin: 0 };
  const local = products.length > 0 && products.every((product) => estimateDelivery(product, customer).isLocal);
  const logisticsEstimate = local ? config.shipping.localDeliveryFee : config.shipping.fixedFee;
  const customerShipping = Math.round(logisticsEstimate * config.shipping.customerContribution);
  const sellerShipping = Math.round(logisticsEstimate * config.shipping.sellerContribution);
  return { customerShipping, sellerShipping, logisticsEstimate, shippingMargin: customerShipping + sellerShipping - logisticsEstimate };
}
