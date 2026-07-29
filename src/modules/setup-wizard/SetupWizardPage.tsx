import React from 'react';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { Card } from '@components/ui/Card';
import { Step1Welcome } from './steps/Step1Welcome';
import { Step2BusinessInfo } from './steps/Step2BusinessInfo';
import { Step3TaxConfig } from './steps/Step3TaxConfig';
import { Step4ReceiptDefaults } from './steps/Step4ReceiptDefaults';
import { Step5BackupDefaults } from './steps/Step5BackupDefaults';
import { Step6OwnerAccount } from './steps/Step6OwnerAccount';
import { Step7FinishSummary } from './steps/Step7FinishSummary';

export const SetupWizardPage: React.FC = () => {
  const { currentStep } = useSetupWizardStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome />;
      case 2:
        return <Step2BusinessInfo />;
      case 3:
        return <Step3TaxConfig />;
      case 4:
        return <Step4ReceiptDefaults />;
      case 5:
        return <Step5BackupDefaults />;
      case 6:
        return <Step6OwnerAccount />;
      case 7:
        return <Step7FinishSummary />;
      default:
        return <Step1Welcome />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="mb-6 flex justify-between items-center text-xs text-slate-400">
          <span>Initial System Setup</span>
          <span className="font-bold text-sky-400">Step {currentStep} of 7</span>
        </div>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-sky-500 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>

        <Card className="p-8 shadow-2xl border-slate-800">{renderStep()}</Card>
      </div>
    </div>
  );
};
