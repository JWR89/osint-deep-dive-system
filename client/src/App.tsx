import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewInvestigation from "./pages/NewInvestigation";
import InvestigationReport from "./pages/InvestigationReport";
import InvestigationProgress from "./pages/InvestigationProgress";
import History from "./pages/History";
import DashboardLayout from "./components/DashboardLayout";
import Compare from "./pages/Compare";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/new"} component={NewInvestigation} />
        <Route path={"/investigation/:id"} component={InvestigationReport} />
        <Route path={"/investigation/:id/progress"} component={InvestigationProgress} />
        <Route path={"/history"} component={History} />
        <Route path={"/compare"} component={Compare} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
