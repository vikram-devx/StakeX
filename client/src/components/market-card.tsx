import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Market, GameType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { differenceInHours, differenceInMinutes } from "date-fns";
import GameModal from "./game-modal";
import CoinTossModal from "./coin-toss-modal";
import TeamMatchModal from "./team-match-modal";
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
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#22c55e]/20 text-[#22c55e] pulse-effect">
            Open
          </span>
        );
      case "closing_soon":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#f59e0b]/20 text-[#f59e0b] pulse-effect" style={{animation: "pulse 1s infinite"}}>
            Closing Soon
          </span>
        );
      case "closed":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#ef4444]/20 text-[#ef4444]">
            Closed
          </span>
        );
      case "resulted":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#3b82f6]/20 text-[#3b82f6]">
            Resulted
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

  const isTeamMatch = gameTypes?.some(game => game.gameCategory === "teamMatch");
  const isCoinToss = gameTypes?.some(game => game.gameCategory === "cointoss");

  return (
    <>
      <Card className="market-card bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-[#334155] hover-scale shadow-lg hover:shadow-xl" data-market-id={market.id}>
        {market.bannerImage && (
          <div className="w-full h-40 overflow-hidden relative">
            <img 
              src={market.bannerImage} 
              alt={market.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute top-2 right-2">
              {getStatusBadge(market.status)}
            </div>
            {!isLoading && isTeamMatch && !market.bannerImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/20 to-pink-600/20">
                <div className="text-2xl font-bold text-white">Team Match</div>
              </div>
            )}
          </div>
        )}
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold card-title-gradient drop-shadow-lg">{market.name}</h3>
            {!market.bannerImage && getStatusBadge(market.status)}
          </div>
          
          {market.description && (
            <p className="text-sm text-gray-400 mb-3">{market.description}</p>
          )}
          
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
          
          {!isLoading && isTeamMatch && gameTypes && (
            <div className="mb-4">
              {gameTypes?.filter(g => g.gameCategory === "teamMatch").slice(0, 1).map(game => (
                <div key={game.id} className="p-2 bg-[#0f172a] rounded-lg border border-[#334155] mb-2">
                  <div className="text-xs text-gray-400 mb-1">Featured Match:</div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col items-center text-center flex-1">
                      {game.teamLogoUrl1 ? (
                        <div className="w-8 h-8 mb-1">
                          <img src={game.teamLogoUrl1} alt={game.team1 || ''} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 mb-1 bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-xs">{game.team1?.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="text-xs font-medium truncate max-w-[60px]">{game.team1}</div>
                    </div>
                    <div className="mx-2 text-xs font-bold">VS</div>
                    <div className="flex flex-col items-center text-center flex-1">
                      {game.teamLogoUrl2 ? (
                        <div className="w-8 h-8 mb-1">
                          <img src={game.teamLogoUrl2} alt={game.team2 || ''} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 mb-1 bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-xs">{game.team2?.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="text-xs font-medium truncate max-w-[60px]">{game.team2}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 mb-3">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading game types...
              </div>
            ) : (
              gameTypes?.map(game => (
                <span 
                  key={game.id} 
                  className="px-2 py-1 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-xs rounded-md border border-[#334155] hover:border-[#94a3b8] transition-colors shadow-sm"
                >
                  {game.name}
                </span>
              ))
            )}
          </div>
          
          {market.status === "resulted" && market.result && (
            <div className="p-2 bg-[#101c2d] rounded-md border border-[#334155] mb-3">
              <div className="text-xs text-gray-400 mb-1">Result:</div>
              <div className="text-sm font-semibold text-white">{market.result}</div>
            </div>
          )}
          
          <Button 
            className={`w-full py-2 text-white rounded-md font-medium transition-all ${
              market.status === "closed" || market.status === "resulted"
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-gradient-to-r from-primary to-pink-600 hover:shadow-lg hover:shadow-primary/30"
            }`}
            onClick={() => setShowGameModal(true)}
            disabled={market.status === "closed" || market.status === "resulted"}
            variant="ghost"
          >
            {market.status === "closed" || market.status === "resulted" ? "Closed" : "Play Now"}
          </Button>
        </div>
      </Card>

      {showGameModal && isTeamMatch ? (
        <TeamMatchModal 
          open={showGameModal} 
          onClose={() => setShowGameModal(false)} 
          market={market}
          gameTypes={gameTypes?.filter(g => g.gameCategory === "teamMatch") || []}
        />
      ) : showGameModal && isCoinToss ? (
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
