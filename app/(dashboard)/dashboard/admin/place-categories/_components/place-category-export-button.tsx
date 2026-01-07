"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getPlaceCategoriesHierarchyAction } from "@/actions/place-category";

export function PlaceCategoryExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const result = await getPlaceCategoriesHierarchyAction();

      if (result.success && result.data) {
        // Prepare data for export
        // We can do some cleaning here if needed (e.g. remove internal IDs if purely for transport, 
        // but keeping them is often useful for re-import/update logic)
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "categories_commerce_local.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        toast.success("Export réussi");
      } else {
        toast.error(result.error || "Erreur lors de l'export");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Export..." : "Exporter JSON"}
    </Button>
  );
}
