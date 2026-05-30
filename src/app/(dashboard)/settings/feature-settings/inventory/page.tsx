"use client";

import { useState, useEffect } from "react";
import {
  Save, RefreshCw,
  Barcode, Printer, Download, Upload,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InventorySettings {
  barcode: {
    enabled: boolean;
    type: "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "QR";
    width: number;
    height: number;
    showLabel: boolean;
    labelPosition: "TOP" | "BOTTOM";
    fontSize: number;
    margin: number;
    color: string;
    backgroundColor: string;
  };
  display: {
    showBarcode: boolean;
    showSku: boolean;
    showStock: boolean;
    showPrice: boolean;
    showCategory: boolean;
    itemsPerPage: number;
    defaultSort: "name" | "sku" | "stock" | "price";
    sortOrder: "asc" | "desc";
  };
  stock: {
    lowStockThreshold: number;
    outOfStockThreshold: number;
    enableLowStockAlert: boolean;
    enableOutOfStockAlert: boolean;
    autoReorder: boolean;
  };
  printing: {
    printBarcode: boolean;
    barcodeSize: "SMALL" | "MEDIUM" | "LARGE";
    printQuantity: number;
    showPriceOnBarcode: boolean;
  };
}

const DEFAULT_SETTINGS: InventorySettings = {
  barcode: {
    enabled: true,
    type: "CODE128",
    width: 2,
    height: 100,
    showLabel: true,
    labelPosition: "BOTTOM",
    fontSize: 12,
    margin: 10,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  display: {
    showBarcode: true,
    showSku: true,
    showStock: true,
    showPrice: true,
    showCategory: true,
    itemsPerPage: 20,
    defaultSort: "name",
    sortOrder: "asc",
  },
  stock: {
    lowStockThreshold: 10,
    outOfStockThreshold: 0,
    enableLowStockAlert: true,
    enableOutOfStockAlert: true,
    autoReorder: false,
  },
  printing: {
    printBarcode: true,
    barcodeSize: "MEDIUM",
    printQuantity: 1,
    showPriceOnBarcode: false,
  },
};

export default function InventoryFeatureSettingsPage() {
  const [settings, setSettings] = useState<InventorySettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("inventorySettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSettingChange = (
    section: keyof InventorySettings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    localStorage.setItem("inventorySettings", JSON.stringify(settings));
    toast.success("Settings saved successfully");
    setSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast.info("Settings reset to defaults");
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory-settings.json";
    link.click();
    toast.success("Settings exported");
  };

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setSettings(imported);
        setHasChanges(true);
        toast.success("Settings imported successfully");
      } catch (e) {
        toast.error("Failed to import settings");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Inventory Settings</h2>
          <p className="text-sm text-muted-foreground">Configure barcode, display, stock, and printing settings</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved changes
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={handleExportSettings}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={() => document.getElementById("import-settings")?.click()}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportSettings}
          />
          <Button
            size="sm"
            className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="barcode" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="barcode">Barcode</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
        </TabsList>

        {/* Barcode Settings */}
        <TabsContent value="barcode">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="w-5 h-5" />
                Barcode Configuration
              </CardTitle>
              <CardDescription>
                Configure barcode generation and display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Barcode */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Enable Barcode
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enable barcode generation for inventory items
                  </p>
                </div>
                <Switch
                  checked={settings.barcode.enabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange("barcode", "enabled", checked)
                  }
                />
              </div>

              {/* Barcode Type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Barcode Type
                </Label>
                <Select
                  value={settings.barcode.type}
                  onValueChange={(value: any) =>
                    handleSettingChange("barcode", "type", value)
                  }
                  disabled={!settings.barcode.enabled}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CODE128">Code 128 (Standard)</SelectItem>
                    <SelectItem value="CODE39">Code 39</SelectItem>
                    <SelectItem value="EAN13">EAN-13</SelectItem>
                    <SelectItem value="EAN8">EAN-8</SelectItem>
                    <SelectItem value="UPC">UPC-A</SelectItem>
                    <SelectItem value="QR">QR Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Barcode Width
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.barcode.width}
                    onChange={(e) =>
                      handleSettingChange(
                        "barcode",
                        "width",
                        parseInt(e.target.value) || 1
                      )
                    }
                    disabled={!settings.barcode.enabled}
                    className="max-w-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Barcode Height
                  </Label>
                  <Input
                    type="number"
                    min="50"
                    max="200"
                    value={settings.barcode.height}
                    onChange={(e) =>
                      handleSettingChange(
                        "barcode",
                        "height",
                        parseInt(e.target.value) || 100
                      )
                    }
                    disabled={!settings.barcode.enabled}
                    className="max-w-xs"
                  />
                </div>
              </div>

              {/* Show Label */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Show Label
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Display item name/SKU below barcode
                  </p>
                </div>
                <Switch
                  checked={settings.barcode.showLabel}
                  onCheckedChange={(checked) =>
                    handleSettingChange("barcode", "showLabel", checked)
                  }
                  disabled={!settings.barcode.enabled}
                />
              </div>

              {/* Label Position */}
              {settings.barcode.showLabel && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Label Position
                  </Label>
                  <Select
                    value={settings.barcode.labelPosition}
                    onValueChange={(value: any) =>
                      handleSettingChange("barcode", "labelPosition", value)
                    }
                    disabled={!settings.barcode.enabled}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOP">Top</SelectItem>
                      <SelectItem value="BOTTOM">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Font Size */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Label Font Size
                </Label>
                <Input
                  type="number"
                  min="8"
                  max="24"
                  value={settings.barcode.fontSize}
                  onChange={(e) =>
                    handleSettingChange(
                      "barcode",
                      "fontSize",
                      parseInt(e.target.value) || 12
                    )
                  }
                  disabled={!settings.barcode.enabled}
                  className="max-w-xs"
                />
              </div>

              {/* Margin */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Margin
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.barcode.margin}
                  onChange={(e) =>
                    handleSettingChange(
                      "barcode",
                      "margin",
                      parseInt(e.target.value) || 10
                    )
                  }
                  disabled={!settings.barcode.enabled}
                  className="max-w-xs"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Barcode Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.barcode.color}
                      onChange={(e) =>
                        handleSettingChange("barcode", "color", e.target.value)
                      }
                      disabled={!settings.barcode.enabled}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.barcode.color}
                      onChange={(e) =>
                        handleSettingChange("barcode", "color", e.target.value)
                      }
                      disabled={!settings.barcode.enabled}
                      className="flex-1 max-w-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Background Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.barcode.backgroundColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "barcode",
                          "backgroundColor",
                          e.target.value
                        )
                      }
                      disabled={!settings.barcode.enabled}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.barcode.backgroundColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "barcode",
                          "backgroundColor",
                          e.target.value
                        )
                      }
                      disabled={!settings.barcode.enabled}
                      className="flex-1 max-w-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {settings.barcode.enabled && (
                <div className="mt-6 p-6 border border-border/50 rounded-lg bg-muted/30">
                  <Label className="text-sm font-semibold text-foreground mb-4 block">
                    Barcode Preview
                  </Label>
                  <div className="flex items-center justify-center p-8 bg-card rounded border border-border/50">
                    <div
                      className="flex flex-col items-center"
                      style={{
                        backgroundColor: settings.barcode.backgroundColor,
                        padding: `${settings.barcode.margin}px`,
                      }}
                    >
                      {settings.barcode.showLabel &&
                        settings.barcode.labelPosition === "TOP" && (
                          <div
                            className="mb-2 text-center"
                            style={{
                              color: settings.barcode.color,
                              fontSize: `${settings.barcode.fontSize}px`,
                            }}
                          >
                            SAMPLE-123
                          </div>
                        )}
                      <div
                        className="flex gap-0.5"
                        style={{
                          height: `${settings.barcode.height}px`,
                        }}
                      >
                        {/* Simulated barcode */}
                        {[...Array(30)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5"
                            style={{
                              backgroundColor: settings.barcode.color,
                              height: "100%",
                              width: i % 2 === 0 ? `${settings.barcode.width}px` : `${settings.barcode.width / 2}px`,
                            }}
                          />
                        ))}
                      </div>
                      {settings.barcode.showLabel &&
                        settings.barcode.labelPosition === "BOTTOM" && (
                          <div
                            className="mt-2 text-center"
                            style={{
                              color: settings.barcode.color,
                              fontSize: `${settings.barcode.fontSize}px`,
                            }}
                          >
                            SAMPLE-123
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Configure how inventory items are displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "showBarcode", label: "Show Barcode", desc: "Display barcode in item list" },
                { key: "showSku", label: "Show SKU", desc: "Display SKU in item list" },
                { key: "showStock", label: "Show Stock", desc: "Display stock quantity in item list" },
                { key: "showPrice", label: "Show Price", desc: "Display price in item list" },
                { key: "showCategory", label: "Show Category", desc: "Display category in item list" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-border/50"
                >
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <Switch
                    checked={!!settings.display[item.key as keyof typeof settings.display]}
                    onCheckedChange={(checked) =>
                      handleSettingChange("display", item.key, checked)
                    }
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Items Per Page
                  </Label>
                  <Select
                    value={settings.display.itemsPerPage.toString()}
                    onValueChange={(value) =>
                      handleSettingChange("display", "itemsPerPage", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="20">20 items</SelectItem>
                      <SelectItem value="50">50 items</SelectItem>
                      <SelectItem value="100">100 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Default Sort
                  </Label>
                  <Select
                    value={settings.display.defaultSort}
                    onValueChange={(value: any) =>
                      handleSettingChange("display", "defaultSort", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="sku">SKU</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Sort Order
                </Label>
                <Select
                  value={settings.display.sortOrder}
                  onValueChange={(value: any) =>
                    handleSettingChange("display", "sortOrder", value)
                  }
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending (A-Z, 0-9)</SelectItem>
                    <SelectItem value="desc">Descending (Z-A, 9-0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Settings */}
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock Settings</CardTitle>
              <CardDescription>
                Configure stock management and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Low Stock Threshold
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.stock.lowStockThreshold}
                    onChange={(e) =>
                      handleSettingChange(
                        "stock",
                        "lowStockThreshold",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Items below this quantity will be marked as low stock
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Out of Stock Threshold
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.stock.outOfStockThreshold}
                    onChange={(e) =>
                      handleSettingChange(
                        "stock",
                        "outOfStockThreshold",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Items at or below this quantity are out of stock
                  </p>
                </div>
              </div>

              {[
                { key: "enableLowStockAlert", label: "Enable Low Stock Alert", desc: "Show alert when stock is low" },
                { key: "enableOutOfStockAlert", label: "Enable Out of Stock Alert", desc: "Show alert when item is out of stock" },
                { key: "autoReorder", label: "Auto Reorder", desc: "Automatically create purchase orders for low stock items" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-border/50"
                >
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <Switch
                    checked={settings.stock[item.key as keyof typeof settings.stock]}
                    onCheckedChange={(checked) =>
                      handleSettingChange("stock", item.key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printing Settings */}
        <TabsContent value="printing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Printing Settings
              </CardTitle>
              <CardDescription>
                Configure barcode printing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Print Barcode
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enable barcode printing functionality
                  </p>
                </div>
                <Switch
                  checked={settings.printing.printBarcode}
                  onCheckedChange={(checked) =>
                    handleSettingChange("printing", "printBarcode", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Barcode Size
                </Label>
                <Select
                  value={settings.printing.barcodeSize}
                  onValueChange={(value: any) =>
                    handleSettingChange("printing", "barcodeSize", value)
                  }
                  disabled={!settings.printing.printBarcode}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">Small (1&quot; x 0.5&quot;)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (2&quot; x 1&quot;)</SelectItem>
                    <SelectItem value="LARGE">Large (3&quot; x 1.5&quot;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Default Print Quantity
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.printing.printQuantity}
                  onChange={(e) =>
                    handleSettingChange(
                      "printing",
                      "printQuantity",
                      parseInt(e.target.value) || 1
                    )
                  }
                  disabled={!settings.printing.printBarcode}
                  className="max-w-xs"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Show Price on Barcode
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Include price on printed barcode labels
                  </p>
                </div>
                <Switch
                  checked={settings.printing.showPriceOnBarcode}
                  onCheckedChange={(checked) =>
                    handleSettingChange("printing", "showPriceOnBarcode", checked)
                  }
                  disabled={!settings.printing.printBarcode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
