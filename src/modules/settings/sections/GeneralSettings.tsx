import React, { useEffect, useState } from 'react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';

export const GeneralSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Supermarket',
    logo: '',
    taxNumber: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: '',
    currency: 'USD',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (window.api?.getSectionSettings) {
      window.api.getSectionSettings('general').then((res) => {
        if (res.success && res.data) {
          setFormData((prev) => ({ ...prev, ...res.data }));
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg(null);
    try {
      if (window.api?.updateSectionSettings) {
        await window.api.updateSectionSettings('general', formData);
        setSuccessMsg('General business information updated successfully.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
        General & Business Info
      </h3>
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Business Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          label="Business Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        />
        <Input
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label="Email Address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Tax Registration #"
          value={formData.taxNumber}
          onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
        />
        <Input
          label="Base Currency"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        />
      </div>
      <Input
        label="Store Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />

      <div className="pt-2 flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};
