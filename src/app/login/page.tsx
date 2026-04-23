export default function LoginPage() {
  return (
    <body className="bg-black text-text-primary min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <main className="w-full max-w-[24rem] px-lg flex flex-col items-center gap-4xl">
        <header className="text-center flex flex-col items-center gap-xs">
          <h1 className="text-style-display-xl text-text-display tracking-tighter">STUDIO_OS</h1>
          <div className="flex items-center gap-sm opacity-50">
            <span className="block w-md h-2xs bg-border-visible" />
            <span className="text-style-label text-text-secondary tracking-widest">SYS_AUTH</span>
            <span className="block w-md h-2xs bg-border-visible" />
          </div>
        </header>
        <form className="w-full flex flex-col gap-2xl">
          <div className="flex flex-col gap-xl">
            <div className="flex flex-col gap-sm group">
              <label htmlFor="email" className="text-style-label text-text-secondary group-focus-within:text-text-display transition-colors">EMAIL</label>
              <input id="email" type="email" placeholder="IDENTIFIER" autoComplete="email" className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display transition-colors" />
            </div>
            <div className="flex flex-col gap-sm group">
              <label htmlFor="access_key" className="text-style-label text-text-secondary group-focus-within:text-text-display transition-colors">ACCESS_KEY</label>
              <input id="access_key" type="password" placeholder="••••••••" autoComplete="current-password" className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display transition-colors" />
            </div>
          </div>
          <div className="flex flex-col items-center pt-md">
            <button type="button" className="bg-text-display text-black text-style-label rounded-full px-xl py-md min-w-[160px] hover:bg-text-primary transition-colors active:scale-95 duration-100">LOGIN</button>
          </div>
        </form>
      </main>
    </body>
  );
}
