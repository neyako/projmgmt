import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="h-screen flex flex-col w-full md:ml-64 overflow-hidden">
        <TopBar />
        <main className="flex-1 w-full overflow-x-auto overflow-y-hidden">{children}</main>
      </div>
    </div>
  );
}
