import React, { useEffect, useState } from 'react';
import { Settings, CreditCard, Save, Store, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  getAdminSettings,
  updateStoreSetting,
  getAdminPaymentMethods,
  updatePaymentMethodSetting,
} from '@/services/admin';
import type { StoreSetting, PaymentMethodSetting } from '@/types';
import { toast } from 'sonner';

export const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store profile fields
  const [storeName, setStoreName] = useState('Millennium Era');
  const [storeTagline, setStoreTagline] = useState('Shop Beyond Time');
  const [storeEmail, setStoreEmail] = useState('info@millenniumera.com');
  const [storePhone, setStorePhone] = useState('+880 1712 345678');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('5000');

  // Payment settings
  const [bkashNumber, setBkashNumber] = useState('01712-345679');
  const [bkashLabel, setBkashLabel] = useState('bKash Merchant');
  const [bkashEnabled, setBkashEnabled] = useState(true);

  const [nagadNumber, setNagadNumber] = useState('01712-345680');
  const [nagadLabel, setNagadLabel] = useState('Nagad Personal');
  const [nagadEnabled, setNagadEnabled] = useState(true);

  const [rocketNumber, setRocketNumber] = useState('01712-345681');
  const [rocketLabel, setRocketLabel] = useState('Rocket Personal');
  const [rocketEnabled, setRocketEnabled] = useState(true);

  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [settings, methods] = await Promise.all([
          getAdminSettings(),
          getAdminPaymentMethods(),
        ]);

        // Populate settings
        settings.forEach((s) => {
          if (s.key === 'store_name') setStoreName(typeof s.value === 'string' ? s.value : 'Millennium Era');
          if (s.key === 'store_tagline') setStoreTagline(typeof s.value === 'string' ? s.value : 'Shop Beyond Time');
          if (s.key === 'store_email') setStoreEmail(typeof s.value === 'string' ? s.value : 'info@millenniumera.com');
          if (s.key === 'store_phone') setStorePhone(typeof s.value === 'string' ? s.value : '+880 1712 345678');
        });

        // Populate payment numbers
        methods.forEach((m) => {
          if (m.method_type === 'bkash') {
            if (m.account_number) setBkashNumber(m.account_number);
            if (m.account_label) setBkashLabel(m.account_label);
            setBkashEnabled(m.is_enabled);
          }
          if (m.method_type === 'nagad') {
            if (m.account_number) setNagadNumber(m.account_number);
            if (m.account_label) setNagadLabel(m.account_label);
            setNagadEnabled(m.is_enabled);
          }
          if (m.method_type === 'rocket') {
            if (m.account_number) setRocketNumber(m.account_number);
            if (m.account_label) setRocketLabel(m.account_label);
            setRocketEnabled(m.is_enabled);
          }
          if (m.method_type === 'cod') {
            setCodEnabled(m.is_enabled);
          }
        });
      } catch (err) {
        console.error('Settings load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Update store settings
      await Promise.all([
        updateStoreSetting('store_name', storeName),
        updateStoreSetting('store_tagline', storeTagline),
        updateStoreSetting('store_email', storeEmail),
        updateStoreSetting('store_phone', storePhone),
      ]);

      // 2. Update payment methods
      await Promise.all([
        updatePaymentMethodSetting('bkash', {
          account_number: bkashNumber.trim(),
          account_label: bkashLabel.trim(),
          is_enabled: bkashEnabled,
        }),
        updatePaymentMethodSetting('nagad', {
          account_number: nagadNumber.trim(),
          account_label: nagadLabel.trim(),
          is_enabled: nagadEnabled,
        }),
        updatePaymentMethodSetting('rocket', {
          account_number: rocketNumber.trim(),
          account_label: rocketLabel.trim(),
          is_enabled: rocketEnabled,
        }),
        updatePaymentMethodSetting('cod', {
          is_enabled: codEnabled,
        }),
      ]);

      toast.success('Store & Payment settings saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Store & Payment Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure contact information, payment recipient numbers, and policies without editing code.
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-6 h-9 flex items-center gap-1.5 shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </Button>
      </div>

      <form onSubmit={handleSaveAll} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Store Identity */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Store className="w-5 h-5 text-brand-red" />
            <h3 className="text-sm font-bold text-gray-900">Store Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Hotline Phone</label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Bangladesh Payment Configurations */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <CreditCard className="w-5 h-5 text-brand-red" />
            <h3 className="text-sm font-bold text-gray-900">
              Bangladesh Payment Configurations
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Cash on Delivery */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Cash on Delivery (COD)</p>
                <p className="text-[10px] text-gray-500">Collect payment upon courier handover</p>
              </div>
              <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
            </div>

            {/* bKash */}
            <div className="p-3 bg-pink-50/50 rounded-lg border border-pink-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-pink-700">bKash Manual Payment</p>
                <Switch checked={bkashEnabled} onCheckedChange={setBkashEnabled} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                    bKash Recipient Number
                  </label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-300 rounded p-1.5 font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                    Account Label
                  </label>
                  <input
                    type="text"
                    value={bkashLabel}
                    onChange={(e) => setBkashLabel(e.target.value)}
                    placeholder="Merchant / Personal"
                    className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Nagad */}
            <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-orange-700">Nagad Manual Payment</p>
                <Switch checked={nagadEnabled} onCheckedChange={setNagadEnabled} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                    Nagad Recipient Number
                  </label>
                  <input
                    type="text"
                    value={nagadNumber}
                    onChange={(e) => setNagadNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-300 rounded p-1.5 font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                    Account Label
                  </label>
                  <input
                    type="text"
                    value={nagadLabel}
                    onChange={(e) => setNagadLabel(e.target.value)}
                    placeholder="Personal / Merchant"
                    className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Rocket */}
            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-purple-700">Rocket (DBBL) Payment</p>
                <Switch checked={rocketEnabled} onCheckedChange={setRocketEnabled} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                    Rocket Recipient Number
                  </label>
                  <input
                    type="text"
                    value={rocketNumber}
                    onChange={(e) => setRocketNumber(e.target.value)}
                    placeholder="01XXXXXXXXX-X"
                    className="w-full border border-gray-300 rounded p-1.5 font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                    Account Label
                  </label>
                  <input
                    type="text"
                    value={rocketLabel}
                    onChange={(e) => setRocketLabel(e.target.value)}
                    placeholder="Personal / Agent"
                    className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
