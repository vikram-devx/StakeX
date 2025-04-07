import Header from "@/components/layout/header";
import GameTabs from "@/components/game-tabs";
import { useQuery } from "@tanstack/react-query";
import { Market } from "@shared/schema";
import MarketCard from "@/components/market-card";
import { Loader2 } from "lucide-react";

export default function MarketsPage() {
  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <GameTabs activeTab="markets" />
        
        <div>
          <h2 className="text-xl font-semibold mb-4">All Markets</h2>
          
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
              <p className="text-gray-400">No markets available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Please check back later.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
