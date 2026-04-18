/**
 * @file asset-tag-config.ts
 * @description Server-only configuration for auto-generated asset tags.
 * Tags follow `{GLOBAL_PREFIX}-{CATEGORY_PREFIX}-{NUMBER}` (e.g. AST-PC-0001).
 * QR codes use the asset record URL (`/assets/[id]`), not the tag string, so they stay valid when the prefix changes.
 */

/**
 * Returns the global prefix for new asset tags from `ASSET_TAG_PREFIX` (optional).
 * Normalized to uppercase A–Z / 0–9, max 8 characters. Default: AST (generic).
 */
export function getAssetTagPrefix(): string {
  const raw = process.env.ASSET_TAG_PREFIX?.trim() ?? "";
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length === 0) {
    return "AST";
  }
  return cleaned.slice(0, 8);
}
