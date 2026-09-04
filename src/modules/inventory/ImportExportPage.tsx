import React, { useState } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { useAuthStore } from '@stores/useAuthStore';
import { FileSpreadsheet, Download, Upload, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export const ImportExportPage: React.FC = () => {
  const { user } = useAuthStore();
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadTemplate = () => {
    const headers = [
      'SKU',
      'Primary Barcode',
      'English Name',
      'Arabic Name',
      'Category Name',
      'Base Unit Code',
      'Purchase Cost',
      'Selling Price',
      'Opening Stock'
    ];
    const data = [
      headers,
      ['SKU-9901', '6291001001', 'Fresh Milk 1L', 'حليب طازج 1 لتر', 'Dairy', 'pcs', 1.20, 2.00, 50],
      ['SKU-9902', '6291001002', 'White Bread', 'خبز أبيض', 'Bakery', 'pcs', 0.80, 1.50, 30]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.xlsx';
    a.click();
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          let rows: any[] = [];
          if (isXlsx) {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

            if (jsonData.length > 1) {
              const headers = jsonData[0].map((h: any) => String(h || '').trim().toLowerCase());
              
              const findIndex = (aliases: string[]) => {
                return headers.findIndex((h: string) => aliases.some(alias => h.includes(alias)));
              };

              const idxSku = findIndex(['sku']);
              const idxBarcode = findIndex(['barcode', 'upc']);
              const idxNameEn = findIndex(['english name', 'name (en)', 'name_en', 'name en', 'english', 'product name']);
              const idxNameAr = findIndex(['arabic name', 'name (ar)', 'name_ar', 'name ar', 'arabic']);
              const idxCategory = findIndex(['category id', 'category name', 'category']);
              const idxUnit = findIndex(['base unit id', 'base unit code', 'unit', 'base unit']);
              const idxPurchase = findIndex(['purchase cost', 'purchase', 'purchase price', 'cost']);
              const idxSelling = findIndex(['selling price', 'price', 'selling']);
              const idxStock = findIndex(['opening stock', 'stock', 'qty', 'quantity']);

              for (let i = 1; i < jsonData.length; i++) {
                const r = jsonData[i];
                if (r && r.length > 0) {
                  const sku = idxSku !== -1 ? String(r[idxSku] || '').trim() : '';
                  const primaryBarcode = idxBarcode !== -1 ? String(r[idxBarcode] || '').trim() : undefined;
                  const nameEn = idxNameEn !== -1 ? String(r[idxNameEn] || '').trim() : '';
                  const nameAr = idxNameAr !== -1 ? String(r[idxNameAr] || '').trim() : '';
                  const categoryNameEn = idxCategory !== -1 ? String(r[idxCategory] || '').trim() : 'General';
                  const baseUnitCode = idxUnit !== -1 ? String(r[idxUnit] || '').trim() : 'pcs';
                  const purchaseCost = idxPurchase !== -1 ? Number(r[idxPurchase]) || 0 : 0;
                  const sellingPrice = idxSelling !== -1 ? Number(r[idxSelling]) || 0 : 0;
                  const openingStockQty = idxStock !== -1 ? Number(r[idxStock]) || 0 : 0;

                  if (sku && nameEn && nameAr) {
                    rows.push({
                      sku,
                      primaryBarcode,
                      nameEn,
                      nameAr,
                      categoryNameEn,
                      baseUnitCode,
                      purchaseCost,
                      sellingPrice,
                      openingStockQty,
                    });
                  }
                }
              }
            }
          } else {
            const csv = evt.target?.result as string;
            rows = parseCsvToRows(csv);
          }

          setParsedRows(rows);
        } catch (err) {
          alert('Error parsing spreadsheet file: ' + (err as Error).message);
        }
      };

      if (isXlsx) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const handleRunImport = async () => {
    setIsLoading(true);
    setImportResult(null);
    try {
      if (parsedRows.length === 0) {
        alert('No valid product rows parsed from spreadsheet.');
        setIsLoading(false);
        return;
      }

      if (window.api?.importProducts) {
        const res = await window.api.importProducts(parsedRows, user?.id);
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
        const workbook = XLSX.read(res.data, { type: 'string', raw: true });
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
            Bulk Excel or CSV product catalog onboarding, data validation, and snapshot data exporter.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Panel */}
        <Card title="Bulk Product Import (Excel/CSV)">
          <div className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel (.xlsx) Template</span>
            </Button>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-xl text-center space-y-2">
              <Upload className="h-6 w-6 mx-auto text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Select Excel or CSV File
              </span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="text-xs" />
            </div>

            {fileName && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Parsed {parsedRows.length} rows ready for import
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
              levels to standard Excel (.xlsx) format.
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
              <span>Export Product Catalog Excel (.xlsx)</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
