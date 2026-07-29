import React from 'react';
import { Alert } from '@components/ui/Alert';

export const PrinterSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Thermal Receipt Printers
      </h3>
      <Alert variant="info">
        Direct thermal printer drivers and hardware communication interfaces will be integrated in
        Phase 4.
      </Alert>
    </div>
  );
};
