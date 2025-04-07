import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Market } from "@shared/schema";
import { Button } from "@/components/ui/button";
import MarketCard from "@/components/market-card";
import GameTabs from "@/components/game-tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(!localStorage.getItem("welcomeShown"));

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  if (user?.role === "admin") {
    return <Redirect to="/admin" />;
  }

  const dismissWelcome = () => {
    localStorage.setItem("welcomeShown", "true");
    setShowWelcome(false);
    toast({
      title: "Welcome to StakeX!",
      description: "Explore our markets and place your bets.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {showWelcome && (
          <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Welcome to StakeX!</h2>
            <p className="text-gray-300 mb-4">
              Get started by exploring our available markets and placing your first bet!
            </p>
            <Button variant="outline" onClick={dismissWelcome}>Got it</Button>
          </div>
        )}

        <GameTabs activeTab="markets" />
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Markets</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : markets && markets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map(market => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#1e293b] rounded-lg">
              <p className="text-gray-400">No active markets available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Please check back later.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
