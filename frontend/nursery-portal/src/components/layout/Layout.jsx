import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header  from "./Header";

export default function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-gray-50">
        <Header />
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  );
}
