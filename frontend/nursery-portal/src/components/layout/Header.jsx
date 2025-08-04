import { useAuth } from "../../hooks/useAuth";
import { FiLogOut, FiChevronDown } from "react-icons/fi";

export default function Header() {
  const { logout, user } = useAuth();
  
  return (
    <header className="border-b border-gray-100 bg-white px-8 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
          <span className="text-indigo-600 font-medium text-sm">
            {user?.name?.split(' ').map(n => n[0]).join('') || "LU"}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-800">{user?.name || "Lu-mino Admin"}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            {user?.role || "System Administrator"}
            <FiChevronDown size={14} className="mt-0.5" />
          </p>
        </div>
      </div>
      
      <button 
        onClick={logout}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-all"
      >
        <FiLogOut size={16} />
        <span>Sign Out</span>
      </button>
    </header>
  );
}
