import React from 'react';
import { Card } from '@components/ui/Card';
import { Receipt } from 'lucide-react';

export const SupplierInvoicesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Receipt className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Supplier Invoices
          </h1>
          <p className="text-xs text-slate-500">
            Recorded vendor invoices, tax amounts, and purchase attachment records.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-8 text-center text-xs text-slate-500">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            No Supplier Invoices Recorded
          </p>
          <p className="mt-1">
            Vendor invoices are automatically attached during Goods Receiving and Direct Purchases.
          </p>
        </div>
      </Card>
    </div>
  );
};
