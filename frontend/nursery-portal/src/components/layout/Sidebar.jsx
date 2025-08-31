import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { 
  FiHome, FiUsers, FiLayers, FiClipboard, FiBriefcase, FiArchive, 
  FiCheckSquare, FiFileText, FiCreditCard, FiGift, FiUserCheck, 
  FiCalendar, FiFile, FiSun, FiAward, FiDollarSign, FiPackage, 
  FiTruck, FiShare2, FiCheckCircle, FiHeart, FiUserPlus, 
  FiBarChart2, FiChevronDown, FiLogOut 
} from "react-icons/fi";
import { LuGem } from "react-icons/lu";

// Sub-component for individual links
const SidebarLink = ({ to, icon: Icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 text-slate-300 hover:bg-indigo-900 hover:text-white hover:shadow-md ${
        isActive ? "bg-indigo-900 text-white font-semibold shadow-md" : ""
      }`
    }
  >
    <Icon size={18} className="flex-shrink-0" />
    <span className="text-sm">{children}</span>
  </NavLink>
);

// Sub-component for the collapsible sections
const CollapsibleMenuItem = ({ icon: Icon, title, links = [] }) => {
  const location = useLocation();
  const isInitiallyOpen = links.some(link => location.pathname.startsWith(link.to));
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full gap-3 py-3 px-4 rounded-xl transition-all duration-300 text-slate-200 hover:bg-gradient-to-r from-indigo-700 to-violet-700 hover:text-white hover:shadow-lg ${
          isInitiallyOpen ? 'bg-gradient-to-r from-indigo-700 to-violet-700 text-white font-semibold shadow-lg' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="flex-shrink-0" />
          <span className="text-[15px]">{title}</span>
        </div>
        <FiChevronDown
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden pl-6 pt-2"
          >
            <div className="flex flex-col space-y-2 border-l-2 border-indigo-600 pl-4">
              {links.map((link) => (
                <SidebarLink key={link.to} {...link} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Sidebar Component
export default function Sidebar() {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: "Student Management",
      icon: FiUsers,
      links: [
        { to: "/students", icon: FiUsers, children: "Students" },
        { to: "/classrooms", icon: FiLayers, children: "Classrooms" },
        { to: "/enrollments", icon: FiUserPlus, children: "Enrollments" },
        { to: "/attendance", icon: FiCalendar, children: "Attendance" },
        { to: "/evaluations", icon: FiClipboard, children: "Evaluations" },
        { to: "/medical", icon: FiHeart, children: "Medical Records" },
        { to: "/documents", icon: FiFile, children: "Documents" },
      ],
    },
    {
      title: "Human Resources",
      icon: FiBriefcase,
      links: [
        { to: "/hr/staff", icon: FiUserCheck, children: "Staff Directory" },
        { to: "/hr/attendance", icon: FiCalendar, children: "Staff Attendance" },
        { to: "/hr/documents", icon: FiFile, children: "Staff Documents" },
        { to: "/hr/vacations", icon: FiSun, children: "Leave Management" },
        { to: "/hr/evaluations", icon: FiAward, children: "Performance" },
        { to: "/hr/contracts", icon: FiFileText, children: "Payroll" },
        { to: "/hr/salary-records", icon: FiDollarSign, children: "Salary Records" },
      ],
    },
    {
      title: "Finance Department",
      icon: FiDollarSign,
      links: [
        { to: "/finance/invoices", icon: FiFileText, children: "Invoices" },
        { to: "/finance/payments", icon: FiCheckSquare, children: "Payments" },
        { to: "/finance/expenses", icon: FiCreditCard, children: "Expenses" },
        { to: "/finance/purchase-orders", icon: FiBriefcase, children: "Procurement" },
        { to: "/finance/salary-payments", icon: FiGift, children: "Payroll Processing" },
        { to: "/finance/treasuries", icon: FiArchive, children: "Treasury" },
      ],
    },
    {
      title: "Inventory System",
      icon: FiPackage,
      links: [
        { to: "/inventory/vendors", icon: FiTruck, children: "Vendors" },
        { to: "/inventory/items", icon: FiPackage, children: "Inventory Items" },
        { to: "/inventory/custody", icon: FiShare2, children: "Custody Tracking" },
        { to: "/inventory/stock-takes", icon: FiCheckCircle, children: "Stock Audits" },
      ],
    },
  ];

  return (
    <aside className="w-72 h-screen sticky top-0 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
          <LuGem className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Lu-mino</h1>
          <p className="text-xs text-slate-400">Nursery Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => 
            `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 text-slate-200 hover:bg-gradient-to-r from-indigo-700 to-violet-700 hover:text-white hover:shadow-lg ${
              isActive ? 'bg-gradient-to-r from-indigo-700 to-violet-700 text-white font-semibold shadow-lg' : ''
            }`
          }
        >
          <FiHome size={20} />
          <span className="text-[15px]">Home</span>
        </NavLink>
        
        {menuItems.map((item) => (
          <CollapsibleMenuItem key={item.title} {...item} />
        ))}

        <NavLink 
          to="/reports" 
          className={({ isActive }) => 
            `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 text-slate-200 hover:bg-gradient-to-r from-indigo-700 to-violet-700 hover:text-white hover:shadow-lg ${
              isActive ? 'bg-gradient-to-r from-indigo-700 to-violet-700 text-white font-semibold shadow-lg' : ''
            }`
          }
        >
          <FiBarChart2 size={20} />
          <span className="text-[15px]">Reports</span>
        </NavLink>
      </nav>

      {/* User Profile / Logout */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white shadow-md">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'A'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400">{user?.role || 'Administrator'}</p>
          </div>
          <button 
            onClick={logout} 
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors duration-300" 
            title="Sign Out"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
