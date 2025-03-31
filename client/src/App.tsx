import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/layout/MainLayout";
import { useEffect, useState } from "react";
import { AppLoader } from "@/components/AppLoader";
import { LoadingScreen } from "@/components/ui/loading-screen";

// Pages
import NotFound from "@/pages/not-found";
import Discover from "@/pages/discover";
import Invitations from "@/pages/invitations";
import Chats from "@/pages/chats";
import Profile from "@/pages/profile";
import Register from "@/pages/auth/register";
import Login from "@/pages/auth/login";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        await apiRequest("GET", "/api/auth/me");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return <LoadingScreen message="Проверка авторизации..." />;
  }
  
  // If not authenticated, only show auth pages
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/*">
          <Login />
        </Route>
      </Switch>
    );
  }
  
  // If authenticated, show main app
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Discover} />
        <Route path="/discover" component={Discover} />
        <Route path="/invitations" component={Invitations} />
        <Route path="/chats" component={Chats} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLoader>
        <Router />
        <Toaster />
      </AppLoader>
    </QueryClientProvider>
  );
}

export default App;
