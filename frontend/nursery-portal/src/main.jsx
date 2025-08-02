/* ───────────────────  src/main.jsx  ─────────────────── */
import React               from "react";
import ReactDOM            from "react-dom/client";
import { RouterProvider }  from "react-router-dom";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";      // ← v5 path

import { router }          from "./app/router";
import AuthProvider        from "./hooks/useAuth";
import ErrorBoundary       from "./components/ErrorBoundary";
import { ToastContainer }  from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/index.css";

/* initialise React-Query */
const qc = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <ErrorBoundary>
        <AuthProvider>
          <RouterProvider router={router} />
          {/* toast */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>,
);

