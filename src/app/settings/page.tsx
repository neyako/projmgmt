import Shell from "@/components/layout/Shell";

export default function SettingsPage() {
  return (
    <Shell>
      <div className="flex-1 w-full h-full overflow-y-auto p-8">
        <div className="w-full max-w-[48rem] mx-auto flex flex-col gap-12">

          {/* Header Section */}
          <header>
            <h1 className="text-3xl font-bold text-white uppercase tracking-widest mb-4">System Settings</h1>
            <p className="text-sm font-mono text-gray-500 max-w-[28rem]">
              Manage your local workspace, rendering preferences, and user account parameters.
            </p>
          </header>

          <section className="border-t border-white/10 pt-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">PROFILE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">DISPLAY NAME</label>
                <input type="text" defaultValue="System Admin" className="bg-transparent border-0 border-b border-white/10 focus:border-white/50 focus:outline-none px-0 py-2 text-xs font-mono text-white w-full" />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">EMAIL ADDRESS</label>
                <input type="email" defaultValue="admin@studio-os.net" className="bg-transparent border-0 border-b border-white/10 focus:border-white/50 focus:outline-none px-0 py-2 text-xs font-mono text-white w-full" />
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 pt-8 w-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">STORAGE</h3>
            <div className="flex flex-col gap-2 mb-6 w-full">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">RAW STORAGE PATH</label>
              <div className="flex gap-4 w-full">
                <input type="text" defaultValue="/Volumes/STUDIO_DATA/Raw_Assets" className="bg-transparent border-0 border-b border-white/10 focus:border-white/50 focus:outline-none px-0 py-2 text-xs font-mono text-white w-full" />
                <button className="px-4 py-2 border border-white/10 text-gray-500 text-[10px] font-mono uppercase tracking-widest hover:text-white transition-colors shrink-0">BROWSE</button>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-6 pb-4 w-full">
            <button className="bg-white text-black text-[10px] font-mono uppercase tracking-widest px-6 py-2 hover:bg-gray-200 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">save</span>
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
