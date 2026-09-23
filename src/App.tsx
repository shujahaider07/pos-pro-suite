import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/pos-context";
import Login from "./pages/Login";
import OrderScreen from "./pages/OrderScreen";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'employee' | 'admin-or-employee';
}) => {
  const { isAuthenticated, role, logout } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const userRole = (role || '').toLowerCase();

  // Global: must be either admin or employee to access any protected route
  if (userRole !== 'admin' && userRole !== 'employee') {
    logout();
    return <Navigate to="/" replace />;
  }

  // Role-based restrictions
  if (requiredRole === 'admin' && userRole !== 'admin') {
    // Staff trying to access Admin-only area — redirect to POS screen (/order)
    return <Navigate to="/order" replace />;
  }
  if (requiredRole === 'employee' && userRole !== 'employee' && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            {/* POS Counter Screen — accessible to Admin AND Staff (Cashier) */}
            <Route path="/order" element={<ProtectedRoute requiredRole="admin-or-employee"><OrderScreen /></ProtectedRoute>} />
            {/* Admin Dashboard, Inventory, Reports, Settings — Admin ONLY */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
