// src/app/router.jsx
import { createBrowserRouter, redirect } from "react-router-dom";

/* --- Layouts, Guards & Pages --- */
import Login from "../pages/Login";
import Layout from "../components/layout/Layout";
import Protected from "../components/auth/ProtectedRoute";
import Dashboard from "../pages/Dashboard";

/* --- Student Management --- */
import Students from "../features/students/pages/Students";
import Classrooms from "../features/students/pages/Classrooms";
import Enrollments from "../features/students/pages/Enrollments";
import Evaluations from "../features/students/pages/Evaluations";
import MedicalRecords from "../features/students/pages/MedicalRecords";
import Documents from "../features/students/pages/Documents";

/* --- HR Management --- */
import Staff from "../features/hr/pages/Staff";
import StaffForm from "../features/hr/pages/StaffForm";
import StaffAttendance from "../features/hr/pages/StaffAttendance";
import StaffAttendanceForm from "../features/hr/pages/StaffAttendanceForm";
import StaffDocuments from "../features/hr/pages/StaffDocuments";
import StaffDocumentForm from "../features/hr/pages/StaffDocumentForm";
import Vacations from "../features/hr/pages/Vacations";
import VacationForm from "../features/hr/pages/VacationForm";
import StaffEvaluations from "../features/hr/pages/StaffEvaluations";
import StaffEvaluationForm from "../features/hr/pages/StaffEvaluationForm";
import PayrollContracts from "../features/hr/pages/PayrollContracts";
import PayrollContractForm from "../features/hr/pages/PayrollContractForm";
import SalaryRecords from "../features/hr/pages/SalaryRecords";

/* --- Inventory Management --- */
import Vendors from "../features/inventory/pages/Vendors";
import VendorForm from "../features/inventory/pages/VendorForm";
import Items from "../features/inventory/pages/Items";
import ItemForm from "../features/inventory/pages/ItemForm";
import CustodyAssignments from "../features/inventory/pages/CustodyAssignments";
import CustodyAssignmentForm from "../features/inventory/pages/CustodyAssignmentForm";
import StockTakes from "../features/inventory/pages/StockTakes";
import StockTakeForm from "../features/inventory/pages/StockTakeForm";

/* --- Finance Management --- */
import Invoices from "../features/finance/pages/Invoices";
import InvoiceForm from "../features/finance/pages/InvoiceForm";
import Expenses from "../features/finance/pages/Expenses";
import ExpenseForm from "../features/finance/pages/ExpenseForm";
import Treasuries from "../features/finance/pages/Treasuries";
import TreasuryForm from "../features/finance/pages/TreasuryForm";
import TreasuryTransactions from "../features/finance/pages/TreasuryTransactions";
import Payments from "../features/finance/pages/Payments";
import PaymentForm from "../features/finance/pages/PaymentForm";
import PurchaseOrders from "../features/finance/pages/PurchaseOrders";
import PurchaseOrderForm from "../features/finance/pages/PurchaseOrderForm";
import SalaryPayments from "../features/finance/pages/SalaryPayments";
import SalaryPaymentForm from "../features/finance/pages/SalaryPaymentForm";

/* --- Reporting Module --- */
import ReportsPage from "../features/reporting/pages/ReportsPage";


export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: ( <Protected> <Layout /> </Protected> ),
    children: [
      { index: true, element: <Dashboard /> },

      // Student Module
      { path: "students", element: <Students /> },
      { path: "classrooms", element: <Classrooms /> },
      { path: "enrollments", element: <Enrollments /> },
      { path: "evaluations", element: <Evaluations /> },
      { path: "medical", element: <MedicalRecords /> },
      { path: "documents", element: <Documents /> },

      // HR Module
      { path: "hr/staff", element: <Staff /> },
      { path: "hr/staff/new", element: <StaffForm /> },
      { path: "hr/staff/:id", element: <StaffForm /> },
      { path: "hr/attendance", element: <StaffAttendance /> },
      { path: "hr/attendance/new", element: <StaffAttendanceForm /> },
      { path: "hr/attendance/:id", element: <StaffAttendanceForm /> },
      { path: "hr/documents", element: <StaffDocuments /> },
      { path: "hr/documents/new", element: <StaffDocumentForm /> },
      { path: "hr/documents/:id", element: <StaffDocumentForm /> },
      { path: "hr/vacations", element: <Vacations /> },
      { path: "hr/vacations/new", element: <VacationForm /> },
      { path: "hr/vacations/:id", element: <VacationForm /> },
      { path: "hr/evaluations", element: <StaffEvaluations /> },
      { path: "hr/evaluations/new", element: <StaffEvaluationForm /> },
      { path: "hr/evaluations/:id", element: <StaffEvaluationForm /> },
      { path: "hr/contracts", element: <PayrollContracts /> },
      { path: "hr/contracts/new", element: <PayrollContractForm /> },
      { path: "hr/contracts/:id", element: <PayrollContractForm /> },
      { path: "hr/salary-records", element: <SalaryRecords /> },

      // Inventory Module
      { path: "inventory/vendors", element: <Vendors /> },
      { path: "inventory/vendors/new", element: <VendorForm /> },
      { path: "inventory/vendors/:id", element: <VendorForm /> },
      { path: "inventory/items", element: <Items /> },
      { path: "inventory/items/new", element: <ItemForm /> },
      { path: "inventory/items/:id", element: <ItemForm /> },
      { path: "inventory/custody", element: <CustodyAssignments /> },
      { path: "inventory/custody/new", element: <CustodyAssignmentForm /> },
      { path: "inventory/custody/:id", element: <CustodyAssignmentForm /> },
      { path: "inventory/stock-takes", element: <StockTakes /> },
      { path: "inventory/stock-takes/new", element: <StockTakeForm /> },
      { path: "inventory/stock-takes/:id", element: <StockTakeForm /> },
      
      // Finance Module
      { path: "finance/invoices", element: <Invoices /> },
      { path: "finance/invoices/new", element: <InvoiceForm /> },
      { path: "finance/invoices/:id", element: <InvoiceForm /> },
      { path: "finance/expenses", element: <Expenses /> },
      { path: "finance/expenses/new", element: <ExpenseForm /> },
      { path: "finance/expenses/:id", element: <ExpenseForm /> },
      { path: "finance/treasuries", element: <Treasuries /> },
      { path: "finance/treasuries/new", element: <TreasuryForm /> },
      { path: "finance/treasuries/:id", element: <TreasuryForm /> },
      { path: "finance/treasuries/:id/transactions", element: <TreasuryTransactions /> },
      { path: "finance/payments", element: <Payments /> },
      { path: "finance/payments/new", element: <PaymentForm /> },
      { path: "finance/payments/:id", element: <PaymentForm /> },
      { path: "finance/purchase-orders", element: <PurchaseOrders /> },
      { path: "finance/purchase-orders/new", element: <PurchaseOrderForm /> },
      { path: "finance/purchase-orders/:id", element: <PurchaseOrderForm /> },
      { path: "finance/salary-payments", element: <SalaryPayments /> },
      { path: "finance/salary-payments/new", element: <SalaryPaymentForm /> },

      // Reporting Module
      { path: "reports", element: <ReportsPage /> },

      { path: "*", loader: () => redirect("/") },
    ],
  },
]);
