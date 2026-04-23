import Shell from "@/components/layout/Shell";

export default function SettingsPage() {
  return (
    <Shell>
      <div className="flex-1 p-xl md:p-3xl max-w-5xl mx-auto w-full overflow-y-auto">
        <div className="mb-3xl">
          <h2 className="text-style-display-md text-text-display mb-sm">SYSTEM SETTINGS</h2>
          <p className="text-text-secondary text-style-body max-w-2xl">Manage your local workspace, rendering preferences, and user account parameters.</p>
        </div>
        <div className="space-y-2xl mb-4xl">
          <section className="border-t border-border-visible pt-xl">
            <h3 className="text-style-heading text-text-display mb-lg">PROFILE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              <div className="flex flex-col gap-sm">
                <label className="text-style-label text-text-secondary">DISPLAY NAME</label>
                <input type="text" defaultValue="System Admin" className="bg-transparent border-0 border-b border-border-visible focus:border-text-display focus:outline-none px-0 py-sm text-style-label text-text-display w-full h-11" />
              </div>
              <div className="flex flex-col gap-sm">
                <label className="text-style-label text-text-secondary">EMAIL ADDRESS</label>
                <input type="email" defaultValue="admin@studio-os.net" className="bg-transparent border-0 border-b border-border-visible focus:border-text-display focus:outline-none px-0 py-sm text-style-label text-text-display w-full h-11" />
              </div>
            </div>
          </section>
          <section className="border-t border-border-visible pt-xl">
            <h3 className="text-style-heading text-text-display mb-lg">STORAGE</h3>
            <div className="flex flex-col gap-sm mb-lg">
              <label className="text-style-label text-text-secondary">RAW STORAGE PATH</label>
              <div className="flex gap-sm">
                <input type="text" defaultValue="/Volumes/STUDIO_DATA/Raw_Assets" className="bg-transparent border-0 border-b border-border-visible focus:border-text-display focus:outline-none px-0 py-sm text-style-label text-text-display w-full h-11" />
                <button className="px-md h-11 border border-border-visible text-text-secondary text-style-label hover:text-text-display transition-colors">BROWSE</button>
              </div>
            </div>
          </section>
        </div>
        <div className="sticky bottom-xl flex justify-end pt-lg pb-md">
          <button className="bg-text-display text-black text-style-label px-xl h-11 rounded-full hover:bg-text-primary transition-colors flex items-center gap-sm">
            <span className="material-symbols-outlined text-[16px]">save</span>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </Shell>
  );
}
