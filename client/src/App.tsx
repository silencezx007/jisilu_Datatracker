import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LofList from "./pages/LofList";
import ConfigManagement from "./pages/ConfigManagement";
import PushHistory from "./pages/PushHistory";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={LofList} />
      <Route path={"/config"} component={ConfigManagement} />
      <Route path={"/history"} component={PushHistory} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
