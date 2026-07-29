import React, { useState } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { useAuthStore } from '@stores/useAuthStore';
import { FileSpreadsheet, Download, Upload, CheckCircle2 } from 'lucide-react';

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export const ImportExportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [fileText, setFileText] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sampleCsvTemplate = `SKU,Primary Barcode,English Name,Arabic Name,Category Name,Base Unit Code,Purchase Cost,Selling Price,Opening Stock
SKU-9901,6291001001,Fresh Milk 1L,حليب طازج 1 لتر,Dairy,pcs,1.20,2.00,50
SKU-9902,6291001002,White Bread,خبز أبيض,Bakery,pcs,0.80,1.50,30`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFileText(evt.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const parseCsvToRows = (csv: string) => {
    const lines = csv
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length <= 1) return [];

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length >= 8) {
        rows.push({
          sku: parts[0],
          primaryBarcode: parts[1] || undefined,
          nameEn: parts[2],
          nameAr: parts[3],
          categoryNameEn: parts[4] || 'General',
          baseUnitCode: parts[5] || 'pcs',
          purchaseCost: Number(parts[6]) || 0,
          sellingPrice: Number(parts[7]) || 0,
          openingStockQty: parts[8] ? Number(parts[8]) : 0,
        });
      }
    }
    return rows;
  };

  const handleRunImport = async () => {
    setIsLoading(true);
    setImportResult(null);
    try {
      const rows = parseCsvToRows(fileText);
      if (rows.length === 0) {
        alert('No valid product rows parsed from CSV content.');
        setIsLoading(false);
        return;
      }

      if (window.api?.importProducts) {
        const res = await window.api.importProducts(rows, user?.id);
        if (res.success && res.data) {
          setImportResult(res.data as ImportResult);
        }
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (window.api?.exportProducts) {
      const res = await window.api.exportProducts('', true);
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <FileSpreadsheet className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Product Import & Export
          </h1>
          <p className="text-xs text-slate-500">
            Bulk CSV/Excel product catalog onboarding, data validation, and snapshot data exporter.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Panel */}
        <Card title="Bulk Product Import (CSV/Excel)">
          <div className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Import Template CSV</span>
            </Button>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-xl text-center space-y-2">
              <Upload className="h-6 w-6 mx-auto text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Select CSV File
              </span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="text-xs" />
            </div>

            {fileText && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Parsed {parseCsvToRows(fileText).length} rows ready for import
                </span>
                <Button onClick={handleRunImport} isLoading={isLoading} className="w-full">
                  Run Product Import Transaction →
                </Button>
              </div>
            )}

            {importResult && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Imported: {importResult.imported}</span>
                  </span>
                  <span className="text-rose-500">Failed: {importResult.failed}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="text-[11px] text-rose-500 max-h-32 overflow-y-auto">
                    {importResult.errors.map((e, idx) => (
                      <p key={idx}>
                        Row {e.row}: {e.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Export Panel */}
        <Card title="Catalog & Inventory Snapshot Export">
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Export complete product catalog including prices, barcodes, categories, and stock
              levels to standard CSV spreadsheet format.
            </p>

            <Alert variant="info">
              Export automatically respects RBAC permissions. User accounts without cost access will
              omit purchase cost columns.
            </Alert>

            <Button
              onClick={handleExport}
              size="lg"
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Product Catalog CSV</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
