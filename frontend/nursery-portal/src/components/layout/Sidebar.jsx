import { NavLink } from "react-router-dom";
import { 
  FiHome, 
  FiUsers, 
  FiLayers, 
  FiClipboard, 
  FiBriefcase,
  FiArchive,
  FiCheckSquare,
  FiFileText,
  FiCreditCard,
  FiGift,
  FiUserCheck,
  FiCalendar,
  FiFile // Icon for Documents
} from "react-icons/fi";

const MenuItem = ({ to, icon: Icon, children, end = false }) => {
  const baseClasses = "flex items-center gap-2 py-2 px-4 rounded transition-colors";
  const idleClasses = "text-gray-700 hover:bg-gray-100";
  const activeClasses = "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : idleClasses}`}
    >
      <Icon size={16} />
      <span>{children}</span>
    </NavLink>
  );
};

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen sticky top-0 border-r bg-white p-4 space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800">Nursery ERP</h1>

      <nav className="flex flex-col space-y-1">
        <MenuItem to="/" icon={FiHome} end={true}>Dashboard</MenuItem>
        
        {/* Student Section */}
        <p className="text-xs font-semibold text-gray-400 uppercase pt-4 pb-1 px-4">Student</p>
        <MenuItem to="/students" icon={FiUsers}>Students</MenuItem>
        <MenuItem to="/classrooms" icon={FiLayers}>Classrooms</MenuItem>
        <MenuItem to="/evaluations" icon={FiClipboard}>Evaluations</MenuItem>
        <MenuItem to="/medical" icon={FiClipboard}>Medical</MenuItem>

        {/* HR Section */}
        <p className="text-xs font-semibold text-gray-400 uppercase pt-4 pb-1 px-4">HR</p>
        <MenuItem to="/hr/staff" icon={FiUserCheck}>Staff</MenuItem>
        <MenuItem to="/hr/attendance" icon={FiCalendar}>Attendance</MenuItem>
        <MenuItem to="/hr/documents" icon={FiFile}>Documents</MenuItem>

        {/* Finance Section */}
        <p className="text-xs font-semibold text-gray-400 uppercase pt-4 pb-1 px-4">Business</p>
        <MenuItem to="/finance/invoices" icon={FiFileText}>Invoices</MenuItem>
        <MenuItem to="/finance/payments" icon={FiCheckSquare}>Payments</MenuItem>
        <MenuItem to="/finance/expenses" icon={FiCreditCard}>Expenses</MenuItem>
        <MenuItem to="/finance/purchase-orders" icon={FiBriefcase}>Purchase Orders</MenuItem>
        <MenuItem to="/finance/salary-payments" icon={FiGift}>Salary Payments</MenuItem>
        <MenuItem to="/finance/treasuries" icon={FiArchive}>Treasury</MenuItem>
      </nav>
    </aside>
  );
}

