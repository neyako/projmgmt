import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { ToastProvider } from "@/components/ui/Toast";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden text-white">
        <Sidebar />
        <div className="flex-1 min-w-0 h-full flex flex-col md:ml-64">
          <TopBar />
          <main className="flex-1 min-w-0 w-full h-full overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
