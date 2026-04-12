import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Admin/analytics pages are lazy-loaded — never included in the kiosk bundle.
// They're only accessed by staff via the /stats and /manager routes.
const Stats         = lazy(() => import("./pages/Stats.tsx"));
const Manager       = lazy(() => import("./pages/Manager.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));

const AdminFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-muted-foreground text-sm">Caricamento…</div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ── Quiz kiosk (eager) ───────────────────────────── */}
            <Route path="/" element={<Index />} />

            {/* ── Admin pages (lazy) ──────────────────────────── */}
            <Route path="/stats" element={
              <Suspense fallback={<AdminFallback />}><Stats /></Suspense>
            } />
            <Route path="/manager" element={
              <Suspense fallback={<AdminFallback />}><Manager /></Suspense>
            } />
            <Route path="/reset-password" element={
              <Suspense fallback={<AdminFallback />}><ResetPassword /></Suspense>
            } />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
