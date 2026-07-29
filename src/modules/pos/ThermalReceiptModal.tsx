import React from 'react';
import { SalesOrderEntity, SalesOrderItemEntity } from '@shared/types';
import { Button } from '@components/ui/Button';
import { Printer } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: (SalesOrderEntity & { items?: SalesOrderItemEntity[] }) | null;
  businessName?: string;
  businessAddress?: string;
  taxNumber?: string;
}

export const ThermalReceiptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sale,
  businessName = 'Retail Store',
  businessAddress = '123 Retail Ave',
  taxNumber = 'TAX-998811',
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Thermal Receipt Preview (58mm)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        {/* 58mm Receipt Visual Preview Box */}
        <div
          id="thermal-receipt"
          className="p-4 bg-white text-black font-mono text-[11px] leading-tight border border-slate-300 shadow-inner rounded space-y-3"
        >
          <div className="text-center space-y-1">
            <h3 className="font-bold text-sm tracking-tight">{businessName}</h3>
            <p className="text-[10px]">{businessAddress}</p>
            <p className="text-[10px]">VAT #: {taxNumber}</p>
            <div className="border-b border-dashed border-black my-1" />
          </div>

          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(sale.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment:</span>
              <span>{sale.payment_method}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-black my-1" />

          {/* Line items */}
          <div className="space-y-1">
            {sale.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[10px]">
                <span className="truncate w-32">
                  {item.product_id} x{item.quantity}
                </span>
                <span className="font-bold">${item.line_total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-black my-1" />

          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${sale.tax_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
              <span>TOTAL:</span>
              <span>${sale.grand_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid:</span>
              <span>${sale.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span>${sale.change_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-black my-1" />

          <div className="text-center text-[9px] pt-1">
            <p>Thank you for shopping with us!</p>
            <p>Please keep receipt for returns within 14 days.</p>
          </div>
        </div>

        <div className="flex space-x-3 pt-2">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
