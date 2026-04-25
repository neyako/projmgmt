import { Suspense } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { ToastProvider } from "@/components/ui/Toast";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden text-text-primary">
        <Sidebar />
        <div className="flex-1 min-w-0 h-full flex flex-col md:ml-64">
          <Suspense
            fallback={
              <div className="hidden md:block shrink-0 h-16 w-full border-b border-border bg-background" />
            }
          >
            <TopBar />
          </Suspense>
          <main className="flex-1 min-w-0 w-full h-full overflow-y-auto pt-14 md:pt-0">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
