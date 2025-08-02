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
import Staff from "../features/hr/pages/Staff";
import StaffForm from "../features/hr/pages/StaffForm";
import StaffAttendance from "../features/hr/pages/StaffAttendance";
import StaffAttendanceForm from "../features/hr/pages/StaffAttendanceForm";
import StaffDocuments from "../features/hr/pages/StaffDocuments.jsx";
import StaffDocumentForm from "../features/hr/pages/StaffDocumentForm.jsx";

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

      /* Classrooms */
      { path: "classrooms", element: <Classrooms /> },
      { path: "classrooms/new", element: <ClassroomForm /> },
      { path: "classrooms/:id", element: <ClassroomForm /> },

      /* Enrollments */
      { path: "enrollments", element: <Enrollments /> },
      { path: "enrollments/new", element: <EnrollmentForm /> },
      { path: "enrollments/:id", element: <EnrollmentForm /> },

      /* Medical */
      { path: "medical", element: <MedicalRecords /> },
      { path: "medical/new", element: <MedicalForm /> },
      { path: "medical/:id", element: <MedicalForm /> },

      /* Evaluations */
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

