import { NavLink } from "react-router-dom";
import { 
  FiHome, FiUsers, FiLayers, FiClipboard, FiBriefcase,
  FiArchive, FiCheckSquare, FiFileText, FiCreditCard,
  FiGift, FiUserCheck, FiCalendar, FiFile, FiSun,
  FiAward, FiDollarSign, FiPackage, FiTruck, FiShare2, FiCheckCircle
} from "react-icons/fi";
import { LuGem } from "react-icons/lu";

const MenuItem = ({ to, icon: Icon, children, end = false }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={(navData) => {
        const isActive = navData.isActive;
        return `
          flex items-center gap-3 py-3 px-4 rounded-xl transition-all
          text-slate-700 hover:bg-gradient-to-r from-indigo-50 to-violet-50 hover:text-indigo-800
          ${isActive ? 
            'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-800 font-semibold border-l-4 border-indigo-500' : 
            'hover:translate-x-1'
          }
        `;
      }}
    >
      {Icon && <Icon size={20} className="flex-shrink-0" />}
      <span className="text-[15px]">{children}</span>
    </NavLink>
  );
};

export default function Sidebar() {
  return (
    <aside className="w-80 h-screen sticky top-0 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 p-6">
      {/* Logo Section - Enhanced Typography */}
      <div className="flex items-center gap-3 px-2 py-6 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
          <LuGem className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lu-mino</h1>
          <p className="text-sm text-indigo-500 font-medium mt-1 tracking-wider">EDUCATION ERP</p>
        </div>
      </div>

      <nav className="flex flex-col space-y-2">
        {/* Dashboard */}
        <MenuItem to="/" icon={FiHome} end>Home</MenuItem>

        {/* Student Section */}
        <p className="text-sm font-semibold text-slate-500 uppercase pt-6 pb-3 px-4 tracking-wider">
          STUDENT MANAGEMENT
        </p>
        <MenuItem to="/students" icon={FiUsers}>Students</MenuItem>
        <MenuItem to="/classrooms" icon={FiLayers}>Classrooms</MenuItem>
        <MenuItem to="/evaluations" icon={FiClipboard}>Evaluations</MenuItem>
        <MenuItem to="/medical" icon={FiClipboard}>Medical Records</MenuItem>

        {/* HR Section */}
        <p className="text-sm font-semibold text-slate-500 uppercase pt-6 pb-3 px-4 tracking-wider">
          HUMAN RESOURCES
        </p>
        <MenuItem to="/hr/staff" icon={FiUserCheck}>Staff Directory</MenuItem>
        <MenuItem to="/hr/attendance" icon={FiCalendar}>Attendance</MenuItem>
        <MenuItem to="/hr/documents" icon={FiFile}>Documents</MenuItem>
        <MenuItem to="/hr/vacations" icon={FiSun}>Leave Management</MenuItem>
        <MenuItem to="/hr/evaluations" icon={FiAward}>Performance</MenuItem>
        <MenuItem to="/hr/contracts" icon={FiFileText}>Payroll</MenuItem>
        <MenuItem to="/hr/salary-records" icon={FiDollarSign}>Salary Records</MenuItem>

        {/* Inventory Section */}
        <p className="text-sm font-semibold text-slate-500 uppercase pt-6 pb-3 px-4 tracking-wider">
          INVENTORY SYSTEM
        </p>
        <MenuItem to="/inventory/vendors" icon={FiTruck}>Vendors</MenuItem>
        <MenuItem to="/inventory/items" icon={FiPackage}>Inventory Items</MenuItem>
        <MenuItem to="/inventory/custody" icon={FiShare2}>Custody Tracking</MenuItem>
        <MenuItem to="/inventory/stock-takes" icon={FiCheckCircle}>Stock Audits</MenuItem>

        {/* Finance Section */}
        <p className="text-sm font-semibold text-slate-500 uppercase pt-6 pb-3 px-4 tracking-wider">
          FINANCE DEPARTMENT
        </p>
        <MenuItem to="/finance/invoices" icon={FiFileText}>Invoices</MenuItem>
        <MenuItem to="/finance/payments" icon={FiCheckSquare}>Payments</MenuItem>
        <MenuItem to="/finance/expenses" icon={FiCreditCard}>Expenses</MenuItem>
        <MenuItem to="/finance/purchase-orders" icon={FiBriefcase}>Procurement</MenuItem>
        <MenuItem to="/finance/salary-payments" icon={FiGift}>Payroll Processing</MenuItem>
        <MenuItem to="/finance/treasuries" icon={FiArchive}>Treasury</MenuItem>
      </nav>
    </aside>
  );
}
