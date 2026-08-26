export default function SettingsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Manage your account and preferences.</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-2xl">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Account</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              disabled 
              value="user@example.com" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Learning Language</label>
            <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="en">English</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">This is the default language AI will translate flashcards into.</p>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
