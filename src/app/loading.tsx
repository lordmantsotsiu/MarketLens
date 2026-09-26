export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-8">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-slate-800 animate-pulse" />
          <div className="h-3 w-56 rounded bg-slate-800/70 animate-pulse" />
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
        <div className="lg:col-span-2 h-72 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
      </div>
      <div className="h-80 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
    </main>
  );
}
