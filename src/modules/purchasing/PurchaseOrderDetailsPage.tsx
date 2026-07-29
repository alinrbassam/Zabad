import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchasingStore } from '@stores/usePurchasingStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Printer, ArrowLeft, Truck, CheckCircle2 } from 'lucide-react';

export const PurchaseOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedOrder, loadOrderById, updateOrderStatus, isLoading } = usePurchasingStore();

  useEffect(() => {
    if (id) {
      loadOrderById(id);
    }
  }, [id, loadOrderById]);

  if (!selectedOrder) {
    return <div className="p-6 text-center text-slate-500">Loading purchase order details...</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleMarkOrdered = async () => {
    if (id) {
      await updateOrderStatus(id, 'Ordered', 'Sent purchase order to vendor');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" size="sm" onClick={() => navigate('/purchasing/orders')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Button>

        <div className="flex space-x-2">
          {selectedOrder.status === 'Approved' && (
            <Button size="sm" onClick={handleMarkOrdered} isLoading={isLoading}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark as Sent / Ordered
            </Button>
          )}

          {selectedOrder.status !== 'Fully received' && selectedOrder.status !== 'Cancelled' && (
            <Button
              size="sm"
              onClick={() => navigate(`/purchasing/receiving?poId=${selectedOrder.id}`)}
            >
              <Truck className="h-4 w-4 mr-1" />
              Receive Goods
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print A4 PO
          </Button>
        </div>
      </div>

      {/* Printable A4 Purchase Order Document */}
      <Card className="p-8 print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-sky-600">PURCHASE ORDER</h1>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
              {selectedOrder.po_number}
            </span>
            <span className="text-xs text-slate-500">
              Date: {new Date(selectedOrder.order_date).toLocaleDateString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase">Status</span>
            <Badge variant="info">{selectedOrder.status}</Badge>
          </div>
        </div>

        {/* Supplier & Delivery Info */}
        <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <span className="font-bold uppercase text-slate-400 block mb-1">Supplier</span>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
              Supplier ID: {selectedOrder.supplier_id}
            </span>
          </div>

          <div>
            <span className="font-bold uppercase text-slate-400 block mb-1">Delivery Info</span>
            <p className="text-slate-600 dark:text-slate-400">
              Expected Delivery: {selectedOrder.expected_delivery_date || 'N/A'}
            </p>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-3">Product ID</th>
                <th className="p-3 text-right">Ordered Qty</th>
                <th className="p-3 text-right">Received Qty</th>
                <th className="p-3 text-right">Unit Cost ($)</th>
                <th className="p-3 text-right">Tax ($)</th>
                <th className="p-3 text-right">Line Total ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {selectedOrder.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-bold">{item.product_id}</td>
                  <td className="p-3 text-right font-medium">{item.ordered_qty}</td>
                  <td className="p-3 text-right font-medium text-emerald-600">
                    {item.received_qty}
                  </td>
                  <td className="p-3 text-right">${item.unit_cost.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.tax_amount.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold">${item.line_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Document Totals */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-bold">${selectedOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax Total:</span>
              <span className="font-bold">${selectedOrder.tax_subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Shipping & Freight:</span>
              <span className="font-bold">${selectedOrder.shipping_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-black text-slate-900 dark:text-slate-100">
              <span>Grand Total:</span>
              <span>${selectedOrder.grand_total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs text-slate-400">
          <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
            Authorized Buyer Signature
          </div>
          <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
            Supplier Representative Signature
          </div>
        </div>
      </Card>
    </div>
  );
};
