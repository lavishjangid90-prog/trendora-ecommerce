import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The default tailwind-merge configuration struggles with some Tailwind v4 specific utilities
// that conflict with standard properties. We create a custom merge instance if needed, or stick to basic extendTailwindMerge.
const twMerge = extendTailwindMerge({})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
