import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Market, GameType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock } from "lucide-react";
import GameTabs from "@/components/game-tabs";
import TeamMatchModal from "@/components/team-match-modal";
import { differenceInHours, differenceInMinutes, format } from "date-fns";

export default function TeamMatchesPage() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const { data: teamMatches, isLoading } = useQuery<GameType[]>({
    queryKey: ["/api/gametypes/teamMatch"],
    queryFn: async () => {
      const response = await fetch('/api/gametypes?category=teamMatch');
      if (!response.ok) throw new Error('Failed to fetch team matches');
      return response.json();
    }
  });

  const handlePlayMatch = (market: Market) => {
    setSelectedMarket(market);
    setShowMatchModal(true);
  };

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

  const getTimeRemaining = (market: Market) => {
    const now = new Date();
    const closing = new Date(market.closingTime);
    
    if (now > closing) {
      return "Closed";
    }
    
    const hoursRemaining = differenceInHours(closing, now);
    const minutesRemaining = differenceInMinutes(closing, now) % 60;
    
    return `${hoursRemaining}h ${minutesRemaining}m`;
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

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : teamMatches && teamMatches.filter(match => match.gameCategory === "teamMatch").length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMatches.filter(match => match.gameCategory === "teamMatch").map(match => (
            <Card key={match.id} className="match-card bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-md overflow-hidden hover:border-[#94a3b8] transition-colors shadow-lg hover:shadow-xl hover-scale">
              <div className="w-full h-40 overflow-hidden relative">
                <div className="w-full h-full bg-gradient-to-r from-primary/20 to-pink-600/20 flex items-center justify-center">
                  <div className="text-2xl font-bold text-white">{match.name}</div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-[#22c55e]">Live</Badge>
                </div>
                
                {/* Show teams in banner */}
                {teamMatches?.slice(0, 1).map(match => (
                  <div key={match.id} className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="flex items-center px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                      {match.teamLogoUrl1 && (
                        <div className="w-6 h-6 mr-1">
                          <img src={match.teamLogoUrl1} alt={match.team1 || ''} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="text-xs font-medium text-white">{match.team1}</div>
                    </div>
                    
                    <div className="text-xs font-bold text-white px-1">VS</div>
                    
                    <div className="flex items-center px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                      {match.teamLogoUrl2 && (
                        <div className="w-6 h-6 mr-1">
                          <img src={match.teamLogoUrl2} alt={match.team2 || ''} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="text-xs font-medium text-white">{match.team2}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold card-title-gradient drop-shadow-lg">{market.name}</h3>
                </div>
                
                {market.description && (
                  <p className="text-sm text-gray-400 mb-3">{market.description}</p>
                )}
                
                <div className="space-y-1 mb-3">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Open: {format(new Date(market.openingTime), 'MMM dd, h:mm a')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>
                      {market.status === "closed" || market.status === "resulted" ? "Closed" : "Closes in:"} 
                      <span className="text-white ml-1">{getTimeRemaining(market)}</span>
                    </span>
                  </div>
                </div>
                
                {/* Show result if available */}
                {market.result && market.status === "resulted" && (
                  <div className="mb-3 p-2 bg-[#111827] rounded-md border border-[#334155]">
                    <div className="text-sm text-gray-400">Result:</div>
                    <div className="text-base font-medium text-primary">{market.result}</div>
                  </div>
                )}
                
                <div className="space-y-4 mb-3">
                  {allGameTypes?.filter(gameType => 
                    gameType.gameCategory === "teamMatch" && 
                    (market.gameTypes as unknown as number[]).includes(gameType.id)
                  ).map(match => (
                    <div key={match.id} className="p-3 bg-[#111827] rounded-lg border border-[#1f2937]">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-base font-medium card-title-gradient">{match.name}</div>
                        <div className="text-xs text-gray-400">Odds: {match.payoutMultiplier}x</div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex-1 text-center">
                          {match.teamLogoUrl1 ? (
                            <div className="w-10 h-10 mx-auto mb-1">
                              <img src={match.teamLogoUrl1} alt={match.team1 || ''} className="w-full h-full object-contain" />
                            </div>
                          ) : null}
                          <div className="text-sm font-medium text-white">{match.team1}</div>
                          
                          {/* Highlight winner */}
                          {market.result === match.team1 && (
                            <div className="text-xs text-[#22c55e] mt-1">Winner!</div>
                          )}
                        </div>
                        
                        <div className="text-lg font-bold text-gray-500 px-3">VS</div>
                        
                        <div className="flex-1 text-center">
                          {match.teamLogoUrl2 ? (
                            <div className="w-10 h-10 mx-auto mb-1">
                              <img src={match.teamLogoUrl2} alt={match.team2 || ''} className="w-full h-full object-contain" />
                            </div>
                          ) : null}
                          <div className="text-sm font-medium text-white">{match.team2}</div>
                          
                          {/* Highlight winner */}
                          {market.result === match.team2 && (
                            <div className="text-xs text-[#22c55e] mt-1">Winner!</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => handlePlayMatch(market)}
                  className={`w-full py-2 text-white rounded-md font-medium transition-all ${
                    market.status === "closed" || market.status === "resulted"
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-gradient-to-r from-primary to-pink-600 hover:shadow-lg hover:shadow-primary/30"
                  }`}
                  disabled={market.status === "closed" || market.status === "resulted"}
                  variant="ghost"
                >
                  {market.status === "closed" || market.status === "resulted" ? "Closed" : "Place Bet"}
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