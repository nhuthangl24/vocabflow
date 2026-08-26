export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Track your learning progress and AI usage.</p>
      </div>
      
      <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-4">
          <span className="text-2xl">📈</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Detailed analytics coming soon</h3>
        <p className="text-sm text-slate-500 max-w-sm">We are actively building beautiful charts to help you visualize your vocabulary retention, learning streaks, and total immersion time.</p>
      </div>
    </div>
  );
}
