import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Market, GameType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import GameTabs from "@/components/game-tabs";
import TeamMatchModal from "@/components/team-match-modal";

export default function TeamMatchesPage() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    queryFn: async () => {
      const response = await fetch('/api/markets');
      if (!response.ok) throw new Error('Failed to fetch markets');
      return response.json();
    }
  });

  // Filter only markets with teamMatch game types
  const teamMatchMarkets = markets?.filter(market => {
    return market.status === "open" || market.status === "closing_soon";
  });

  const { data: allGameTypes, isLoading: loadingGameTypes } = useQuery<GameType[]>({
    queryKey: ["/api/gametypes/teamMatch"],
    queryFn: async () => {
      const response = await fetch('/api/gametypes?category=teamMatch');
      if (!response.ok) throw new Error('Failed to fetch team match game types');
      return response.json();
    },
    enabled: !!markets
  });

  const handlePlayMatch = (market: Market) => {
    setSelectedMarket(market);
    setShowMatchModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <GameTabs activeTab="team-matches" />
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 gradient-text">Team Matches</h1>
        <p className="text-gray-400">Bet on your favorite sports teams and win big!</p>
      </div>

      {isLoading || loadingGameTypes ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : teamMatchMarkets && teamMatchMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMatchMarkets.map(market => (
            <Card key={market.id} className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-md overflow-hidden hover:border-[#94a3b8] transition-colors shadow-lg hover:shadow-xl hover-scale">
              <div className="p-4">
                <h3 className="text-xl font-bold card-title-gradient drop-shadow-lg mb-4">{market.name}</h3>
                
                {market.description && (
                  <p className="text-sm text-gray-400 mb-4">{market.description}</p>
                )}
                
                <div className="space-y-4">
                  {allGameTypes?.filter(gameType => 
                    gameType.gameCategory === "teamMatch" && 
                    (market.gameTypes as unknown as number[]).includes(gameType.id)
                  ).map(match => (
                    <div key={match.id} className="p-3 bg-[#111827] rounded-lg border border-[#1f2937]">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-base font-medium card-title-gradient">{match.name}</div>
                        <div className="text-xs text-gray-400">Odds: {match.payoutMultiplier}x</div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex-1 text-center">
                          {match.teamLogoUrl1 ? (
                            <div className="w-10 h-10 mx-auto mb-1">
                              <img src={match.teamLogoUrl1} alt={match.team1 || ''} className="w-full h-full object-contain" />
                            </div>
                          ) : null}
                          <div className="text-sm font-medium text-white">{match.team1}</div>
                        </div>
                        
                        <div className="text-lg font-bold text-gray-500 px-3">VS</div>
                        
                        <div className="flex-1 text-center">
                          {match.teamLogoUrl2 ? (
                            <div className="w-10 h-10 mx-auto mb-1">
                              <img src={match.teamLogoUrl2} alt={match.team2 || ''} className="w-full h-full object-contain" />
                            </div>
                          ) : null}
                          <div className="text-sm font-medium text-white">{match.team2}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => handlePlayMatch(market)}
                  className="w-full mt-4 bg-gradient-to-r from-primary to-pink-600 hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                  Place Bet
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-gray-400">No team matches available right now.</p>
          <p className="text-gray-500 mt-2">Check back later for upcoming matches!</p>
        </div>
      )}

      {selectedMarket && showMatchModal && (
        <TeamMatchModal
          open={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          market={selectedMarket}
          gameTypes={allGameTypes?.filter(gameType => 
            gameType.gameCategory === "teamMatch" && 
            (selectedMarket.gameTypes as unknown as number[]).includes(gameType.id)
          ) || []}
        />
      )}
    </div>
  );
}