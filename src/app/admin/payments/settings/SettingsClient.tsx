"use client";

import { useState } from "react";
import { Plus, Trash, Check, QrCode, Banknote, Mail, CreditCard, Building, Loader2, ChevronDown, AlertCircle } from "lucide-react";
import { savePaymentSettingsAction, deletePaymentSettingsAction, setDefaultPaymentSettingsAction } from "@/app/actions/payment_settings";
import toast from "react-hot-toast";

const POPULAR_BANKS = [
  { id: "MB", name: "MBBank (Ngân hàng Quân Đội)" },
  { id: "VCB", name: "Vietcombank (Ngân hàng Ngoại Thương)" },
  { id: "TCB", name: "Techcombank (Ngân hàng Kỹ Thương)" },
  { id: "ACB", name: "ACB (Ngân hàng Á Châu)" },
  { id: "BIDV", name: "BIDV (Ngân hàng Đầu tư và Phát triển)" },
  { id: "CTG", name: "VietinBank (Ngân hàng Công Thương)" },
  { id: "VPB", name: "VPBank (Ngân hàng Việt Nam Thịnh Vượng)" },
  { id: "VIB", name: "VIB (Ngân hàng Quốc Tế)" },
  { id: "STB", name: "Sacombank (Ngân hàng Sài Gòn Thương Tín)" },
  { id: "HDB", name: "HDBank (Ngân hàng Phát triển TP.HCM)" },
  { id: "TPB", name: "TPBank (Ngân hàng Tiên Phong)" },
];

export function SettingsClient({ initialSettings }: { initialSettings: any[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(false);
    setLoadingId('new');
    const formData = new FormData(e.currentTarget);
    const data = {
      bank_code: formData.get('bank_code') as string,
      account_number: formData.get('account_number') as string,
      account_name: formData.get('account_name') as string,
      support_contact: formData.get('support_contact') as string,
      is_active: formData.get('is_active') === 'on',
      is_default: settings.length === 0, // make default if first one
    };

    const res = await savePaymentSettingsAction(data);
    if (res.success && res.data) {
      setSettings(prev => [res.data, ...prev]);
      toast.success("Bank account added successfully");
    } else {
      toast.error("Error: " + res.error);
    }
    setLoadingId(null);
  };

  const handleSetDefault = async (id: string) => {
    setLoadingId(id);
    const res = await setDefaultPaymentSettingsAction(id);
    if (res.success) {
      setSettings(prev => prev.map(s => ({ ...s, is_default: s.id === id })));
      toast.success("Default bank account updated");
    } else {
      toast.error("Error: " + res.error);
    }
    setLoadingId(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    setLoadingId(id);
    setDeletingId(null);
    const res = await deletePaymentSettingsAction(id);
    if (res.success) {
      setSettings(prev => prev.filter(s => s.id !== id));
      toast.success("Bank account deleted");
    } else {
      toast.error("Error: " + res.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-[#0a0a0a] border border-neutral-800 rounded-lg p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Bank Accounts</h2>
          <p className="text-sm text-neutral-400 mt-1">Manage multiple receiving bank accounts for VietQR.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors flex items-center gap-2"
        >
          {isAdding ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancel" : "Add Bank Account"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-medium text-emerald-500 mb-4 uppercase tracking-widest">New Bank Account</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Ngân hàng (Bank)</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 z-10" />
                <select 
                  required 
                  name="bank_code" 
                  className="w-full appearance-none bg-neutral-900 border border-neutral-800 rounded-md py-2 pl-9 pr-8 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>-- Chọn Ngân hàng --</option>
                  {POPULAR_BANKS.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Account Number</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input required name="account_number" placeholder="123456789" className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-neutral-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Account Name</label>
              <div className="relative">
                <Banknote className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input required name="account_name" placeholder="NGUYEN VAN A" className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-neutral-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Support Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input required name="support_contact" type="email" placeholder="support@vocabflow.com" className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-neutral-600" />
              </div>
            </div>
            
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input type="checkbox" name="is_active" id="is_active" defaultChecked className="rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900" />
              <label htmlFor="is_active" className="text-sm text-neutral-300">Active (Allow receiving payments)</label>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button disabled={loadingId === 'new'} type="submit" className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loadingId === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Bank"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map((s) => (
          <div key={s.id} className={`bg-[#0a0a0a] border rounded-lg p-6 relative overflow-hidden transition-colors ${s.is_default ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-neutral-800 hover:border-neutral-700'}`}>
            
            {s.is_default && (
              <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-500 text-xs font-bold px-3 py-1 rounded-bl-lg">
                DEFAULT
              </div>
            )}
            
            <div className="flex items-start justify-between mb-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{s.bank_code}</h3>
                  <p className="text-sm text-neutral-400">{s.account_number}</p>
                </div>
              </div>
              
              {!s.is_active && (
                <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">Inactive</span>
              )}
            </div>

            <div className="space-y-3 mb-6 bg-neutral-900/30 p-4 rounded-lg border border-neutral-800/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500 uppercase text-xs font-medium">Account Name</span>
                <span className="text-neutral-300 font-mono">{s.account_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500 uppercase text-xs font-medium">Support Contact</span>
                <span className="text-neutral-300">{s.support_contact}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
              <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <QrCode className="w-4 h-4" /> Preview QR
              </button>
              
              <div className="flex gap-2">
                {!s.is_default && (
                  <button 
                    onClick={() => handleSetDefault(s.id)}
                    disabled={loadingId === s.id}
                    className="px-3 py-1.5 text-xs font-medium bg-neutral-900 border border-neutral-700 text-white rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {loadingId === s.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Set Default"}
                  </button>
                )}
                
                <button 
                  onClick={() => setDeletingId(s.id)}
                  disabled={loadingId === s.id}
                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}

        {settings.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-800 rounded-lg">
            <Building className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Bank Accounts Found</h3>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto">You haven't configured any payment gateways. Add a bank account to start accepting VietQR payments.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeletingId(null)}>
          <div className="bg-[#0a0a0a] border border-neutral-800 p-6 rounded-xl w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Delete Bank Account</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-6">Are you sure you want to delete this bank account? This action cannot be undone.</p>
            
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
