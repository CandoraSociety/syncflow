import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { BrandingProvider } from '@/lib/BrandingContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import Home from "./pages/Home";
import IntakePage from "./pages/IntakePage";
import WorkerDashboard from "./pages/WorkerDashboard";
import ClientProfile from "./pages/ClientProfile";
import MasterList from "./pages/MasterList";
import Reports from "./pages/Reports";
import SupervisorPortal from "./pages/SupervisorPortal";
import Resources from "./pages/Resources";
import Compass from "./pages/Compass";
import Outcomes from "./pages/Outcomes";
import MonthlyBillingSubmissions from "./pages/MonthlyBillingSubmissions";
import AppNav from "./components/layout/AppNav";
import { useBranding } from '@/hooks/useBranding';

const AuthenticatedApp = () => {
  useBranding();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <AppNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/dashboard" element={<WorkerDashboard />} />
        <Route path="/client/:id" element={<ClientProfile />} />
        <Route path="/master" element={<MasterList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/supervisor" element={<SupervisorPortal />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/compass" element={<Compass />} />
        <Route path="/outcomes" element={<Outcomes />} />
        <Route path="/billing" element={<MonthlyBillingSubmissions />} />
        {/* Add your page Route elements here */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};


function App() {

  return (
    <BrandingProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </BrandingProvider>
  )
}

export default App