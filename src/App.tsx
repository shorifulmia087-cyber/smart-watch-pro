import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { lazy, Suspense, type ReactNode } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

// Eagerly load landing page for fastest initial render
import Index from "./pages/Index";

// Lazy load everything else
const Admin = lazy(() => import("./pages/Admin"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

/** Content-area-only loader — keeps Navbar visible so navigation feels instant */
const ContentLoader = () => (
  <div className="flex items-center justify-center py-32">
    <div className="flex items-center gap-2">
      <motion.div
        className="w-4 h-4 rounded-full bg-accent"
        animate={{ x: [0, 20, 0], scale: [1, 0.85, 1] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-4 h-4 rounded-full bg-accent/25"
        animate={{ x: [0, -20, 0], scale: [0.85, 1, 0.85] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  </div>
);

/** Wraps a lazy page with Navbar + content-area spinner */
const LazyPage = ({ children }: { children: ReactNode }) => (
  <>
    <Navbar />
    <Suspense fallback={<ContentLoader />}>
      {children}
    </Suspense>
  </>
);

/** Full-screen loader only for admin (has its own layout) */
const AdminLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex items-center gap-2">
      <motion.div
        className="w-5 h-5 rounded-full bg-accent"
        animate={{ x: [0, 24, 0], scale: [1, 0.85, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-5 h-5 rounded-full bg-accent/25"
        animate={{ x: [0, -24, 0], scale: [0.85, 1, 0.85] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/track" element={<LazyPage><TrackOrder /></LazyPage>} />
            <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
            <Route path="/signup" element={<LazyPage><Signup /></LazyPage>} />
            <Route path="/my-orders" element={<LazyPage><MyOrders /></LazyPage>} />
            <Route path="/admin/*" element={<Suspense fallback={<AdminLoader />}><Admin /></Suspense>} />
            <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
