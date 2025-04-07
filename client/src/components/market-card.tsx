import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Market, GameType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { differenceInHours, differenceInMinutes } from "date-fns";
import GameModal from "./game-modal";
import CoinTossModal from "./coin-toss-modal";
import { Loader2 } from "lucide-react";

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  const [showGameModal, setShowGameModal] = useState(false);
  
  const { data: gameTypes, isLoading } = useQuery<GameType[]>({
    queryKey: ["/api/gametypes", market.id],
    queryFn: async ({ queryKey }) => {
      const marketId = queryKey[1] as number;
      const response = await fetch(`/api/markets/${marketId}/gametypes`);
      if (!response.ok) throw new Error("Failed to fetch game types");
      return response.json();
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "open":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#22c55e]/20 text-[#22c55e]">
            Open
          </span>
        );
      case "closing_soon":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#f59e0b]/20 text-[#f59e0b]">
            Closing Soon
          </span>
        );
      case "closed":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#ef4444]/20 text-[#ef4444]">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-500">
            Pending
          </span>
        );
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const closing = new Date(market.closingTime);
    
    if (now > closing) {
      return "Closed";
    }
    
    const hoursRemaining = differenceInHours(closing, now);
    const minutesRemaining = differenceInMinutes(closing, now) % 60;
    
    return `${hoursRemaining}h ${minutesRemaining}m`;
  };

  const isCoinToss = gameTypes?.some(game => game.gameCategory === "cointoss");

  return (
    <>
      <Card className="market-card bg-[#1e293b] rounded-lg overflow-hidden shadow-lg transition-transform hover:translate-y-[-2px] hover:shadow-xl" data-market-id={market.id}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold">{market.name}</h3>
            {getStatusBadge(market.status)}
          </div>
          <div className="flex justify-between text-sm text-gray-400 mb-3">
            <span>
              {market.status === "closed" ? "Opens in:" : "Closes in:"} 
              <span className="text-white ml-1">{getTimeRemaining()}</span>
            </span>
            <span>
              Games: 
              <span className="text-white ml-1">
                {isLoading ? (
                  <Loader2 className="inline-block h-3 w-3 animate-spin ml-1" />
                ) : (
                  gameTypes?.length || 0
                )}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading game types...
              </div>
            ) : (
              gameTypes?.map(game => (
                <span key={game.id} className="px-2 py-1 bg-[#0f172a] text-xs rounded-md">
                  {game.name}
                </span>
              ))
            )}
          </div>
          <Button 
            className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium transition-colors"
            onClick={() => setShowGameModal(true)}
            disabled={market.status === "closed" || market.status === "resulted"}
            variant={market.status === "closed" || market.status === "resulted" ? "secondary" : "default"}
          >
            {market.status === "closed" || market.status === "resulted" ? "Closed" : "Play Now"}
          </Button>
        </div>
      </Card>

      {showGameModal && isCoinToss ? (
        <CoinTossModal 
          open={showGameModal} 
          onClose={() => setShowGameModal(false)} 
          market={market}
          gameTypes={gameTypes || []}
        />
      ) : (
        <GameModal 
          open={showGameModal} 
          onClose={() => setShowGameModal(false)} 
          market={market}
          gameTypes={gameTypes || []}
        />
      )}
    </>
  );
}
