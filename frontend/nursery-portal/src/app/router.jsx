// src/app/router.jsx
import { createBrowserRouter, redirect } from "react-router-dom";

/* --- Layouts, Guards & Pages --- */
import Login from "../pages/Login";
import Layout from "../components/layout/Layout";
import Protected from "../components/auth/ProtectedRoute";
import Dashboard from "../pages/Dashboard";

/* --- Student Management --- */
import Students from "../features/students/pages/Students";
import StudentForm from "../features/students/pages/StudentForm";
import Classrooms from "../features/classrooms/pages/Classrooms";
import ClassroomForm from "../features/classrooms/pages/ClassroomForm";
import Enrollments from "../features/enrollments/pages/Enrollments";
import EnrollmentForm from "../features/enrollments/pages/EnrollmentForm";
import MedicalRecords from "../features/medical/pages/MedicalRecords";
import MedicalForm from "../features/medical/pages/MedicalForm";
import Evaluations from "../features/evaluations/pages/Evaluations";
import EvaluationForm from "../features/evaluations/pages/EvaluationForm";

/* --- HR Management --- */
import Staff from "../features/hr/pages/Staff.jsx";
import StaffForm from "../features/hr/pages/StaffForm.jsx";
import StaffAttendance from "../features/hr/pages/StaffAttendance.jsx";
import StaffAttendanceForm from "../features/hr/pages/StaffAttendanceForm.jsx";
import StaffDocuments from "../features/hr/pages/StaffDocuments.jsx";
import StaffDocumentForm from "../features/hr/pages/StaffDocumentForm.jsx";
import Vacations from "../features/hr/pages/Vacations.jsx";
import VacationForm from "../features/hr/pages/VacationForm.jsx";
import StaffEvaluations from "../features/hr/pages/StaffEvaluations.jsx";
import StaffEvaluationForm from "../features/hr/pages/StaffEvaluationForm.jsx";
import PayrollContracts from "../features/hr/pages/PayrollContracts.jsx";
import PayrollContractForm from "../features/hr/pages/PayrollContractForm.jsx";
import SalaryRecords from "../features/hr/pages/SalaryRecords.jsx";

/* --- Inventory Management --- */
import Vendors from "../features/inventory/pages/Vendors.jsx";
import VendorForm from "../features/inventory/pages/VendorForm.jsx";
import Items from "../features/inventory/pages/Items.jsx";
import ItemForm from "../features/inventory/pages/ItemForm.jsx";
import CustodyAssignments from "../features/inventory/pages/CustodyAssignments.jsx";
import CustodyAssignmentForm from "../features/inventory/pages/CustodyAssignmentForm.jsx";
import StockTakes from "../features/inventory/pages/StockTakes.jsx";
import StockTakeForm from "../features/inventory/pages/StockTakeForm.jsx";

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
import SalaryPayments from "../features/finance/pages/SalaryPayments.jsx";
import SalaryPaymentForm from "../features/finance/pages/SalaryPaymentForm.jsx";


export const router = createBrowserRouter([
  /* --- Public Route --- */
  { path: "/login", element: <Login /> },

  /* --- Protected Section --- */
  {
    path: "/",
    element: ( <Protected> <Layout /> </Protected> ),
    children: [
      /* Dashboard */
      { index: true, element: <Dashboard /> },

      /* Students */
      { path: "students", element: <Students /> },
      { path: "students/new", element: <StudentForm /> },
      { path: "students/:id", element: <StudentForm /> },
      { path: "classrooms", element: <Classrooms /> },
      { path: "classrooms/new", element: <ClassroomForm /> },
      { path: "classrooms/:id", element: <ClassroomForm /> },
      { path: "enrollments", element: <Enrollments /> },
      { path: "enrollments/new", element: <EnrollmentForm /> },
      { path: "enrollments/:id", element: <EnrollmentForm /> },
      { path: "medical", element: <MedicalRecords /> },
      { path: "medical/new", element: <MedicalForm /> },
      { path: "medical/:id", element: <MedicalForm /> },
      { path: "evaluations", element: <Evaluations /> },
      { path: "evaluations/new", element: <EvaluationForm /> },
      { path: "evaluations/:id", element: <EvaluationForm /> },

      /* HR */
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

      /* Inventory */
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
      
      /* Finance */
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

      /* Fallback Redirect */
      { path: "*", loader: () => redirect("/") },
    ],
  },
]);

