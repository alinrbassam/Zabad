export interface PrintReceiptPayload {
  receiptId: string;
  items: Array<{ title: string; qty: number; unitPrice: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp: string;
}

export interface IPrintingService {
  getPrinters(): Promise<Array<{ name: string; isDefault: boolean }>>;
  printReceipt(payload: PrintReceiptPayload, printerName?: string): Promise<boolean>;
}
