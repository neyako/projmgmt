import { Suspense } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { getWorkspaceId } from "@/lib/appSettings";
import { ToastProvider } from "@/components/ui/Toast";

export default async function Shell({ children }: { children: React.ReactNode }) {
  const workspaceId = await getWorkspaceId();

  return (
    <ToastProvider>
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden text-text-primary">
        <Sidebar workspaceId={workspaceId} />
        <div className="flex-1 min-w-0 h-full flex flex-col md:ml-56 lg:ml-64">
          <Suspense
            fallback={
              <div className="hidden md:block fixed top-0 right-0 left-56 lg:left-64 h-16 border-b border-border bg-background z-40" />
            }
          >
            <TopBar />
          </Suspense>
          <main className="flex-1 min-h-0 min-w-0 w-full overflow-visible pt-14 md:pt-16">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
