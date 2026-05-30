import JsBarcode from "jsbarcode";

export interface BarcodeOptions {
  format?: "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "QR";
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  lineColor?: string;
  background?: string;
}

export interface BarcodeGenerationResult {
  success: boolean;
  barcode?: string;
  svg?: string;
  error?: string;
}

/**
 * Generate a unique barcode number based on item ID and timestamp
 */
export function generateBarcodeNumber(itemId: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const hash = itemId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const uniquePart = (hash % 10000).toString().padStart(4, "0");
  return `${timestamp}${uniquePart}`;
}

/**
 * Generate barcode SVG
 */
export function generateBarcodeSVG(
  value: string,
  options: BarcodeOptions = {}
): BarcodeGenerationResult {
  try {
    const {
      format = "CODE128",
      width = 2,
      height = 100,
      displayValue = true,
      fontSize = 12,
      margin = 10,
      lineColor = "#000000",
      background = "#FFFFFF",
    } = options;

    // Create a canvas element to render the barcode
    const canvas = document.createElement("canvas");
    
    JsBarcode(canvas, value, {
      format: format as any,
      width,
      height,
      displayValue,
      fontSize,
      margin,
      lineColor,
      background,
    });

    // Convert canvas to SVG
    const svg = canvas.toDataURL("image/svg+xml");
    
    return {
      success: true,
      barcode: value,
      svg,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate barcode",
    };
  }
}

/**
 * Generate barcode for an item
 */
export function generateItemBarcode(
  itemId: string,
  options?: BarcodeOptions
): BarcodeGenerationResult {
  const barcodeNumber = generateBarcodeNumber(itemId);
  return generateBarcodeSVG(barcodeNumber, options);
}

/**
 * Validate barcode format
 */
export function validateBarcode(value: string, format: string = "CODE128"): boolean {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value, {
      format: format as any,
      width: 2,
      height: 100,
      displayValue: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate multiple barcodes for bulk operations
 */
export function generateBulkBarcodes(
  itemIds: string[],
  options?: BarcodeOptions
): BarcodeGenerationResult[] {
  return itemIds.map((itemId) => generateItemBarcode(itemId, options));
}
