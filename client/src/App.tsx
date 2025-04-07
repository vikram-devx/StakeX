import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import { ProtectedRoute } from "./lib/protected-route";
import MarketsPage from "@/pages/markets-page";
import MyBetsPage from "@/pages/my-bets-page";
import ResultsPage from "@/pages/results-page";
import AdminPage from "@/pages/admin-page";
import TeamMatchesPage from "@/pages/team-matches-page";
import TransactionsPage from "@/pages/transactions-page";
import FundManagementPage from "@/pages/fund-management-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/markets" component={MarketsPage} />
      <ProtectedRoute path="/team-matches" component={TeamMatchesPage} />
      <ProtectedRoute path="/my-bets" component={MyBetsPage} />
      <ProtectedRoute path="/results" component={ResultsPage} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin/fund-management" component={FundManagementPage} />
      <ProtectedRoute path="/admin/risk-management" component={RiskManagementPage} />
      <ProtectedRoute path="/admin/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
