import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GameType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import GameTabs from "@/components/game-tabs";
import TeamMatchModal from "@/components/team-match-modal";

export default function TeamMatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<GameType | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Only fetch active team matches
  const { data: teamMatches, isLoading } = useQuery<GameType[]>({
    queryKey: ["/api/gametypes/teamMatch"],
    queryFn: async () => {
      const response = await fetch('/api/gametypes?category=teamMatch');
      if (!response.ok) throw new Error('Failed to fetch team matches');
      return response.json();
    }
  });

  const handlePlayMatch = (match: GameType) => {
    setSelectedMatch(match);
    setShowMatchModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <GameTabs activeTab="team-matches" />
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white/90 to-white/70 bg-clip-text text-transparent drop-shadow-sm">Team Matches</h1>
        <p className="text-gray-500">Bet on your favorite sports teams and win big!</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : teamMatches && teamMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMatches.map(match => (
            <Card key={match.id} className="match-card bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-md overflow-hidden hover:border-[#94a3b8] transition-colors shadow-lg hover:shadow-xl hover-scale">
              <div className="w-full h-40 overflow-hidden relative">
                {match.bannerImage ? (
                  <img 
                    src={match.bannerImage} 
                    alt={match.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('bg-gradient-to-r', 'from-primary/20', 'to-pink-600/20');
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/20 to-pink-600/20 flex items-center justify-center">
                    <div className="text-2xl font-bold text-white">{match.name}</div>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-[#22c55e]">Live</Badge>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <div className="flex items-center px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                    {match.teamLogoUrl1 && (
                      <div className="w-6 h-6 mr-1">
                        <img 
                          src={match.teamLogoUrl1} 
                          alt={match.team1 || ''} 
                          className="w-full h-full object-contain"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      </div>
                    )}
                    <div className="text-xs font-medium text-white">{match.team1}</div>
                  </div>

                  <div className="text-xs font-bold text-white px-1">VS</div>

                  <div className="flex items-center px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                    {match.teamLogoUrl2 && (
                      <div className="w-6 h-6 mr-1">
                        <img 
                          src={match.teamLogoUrl2} 
                          alt={match.team2 || ''} 
                          className="w-full h-full object-contain"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      </div>
                    )}
                    <div className="text-xs font-medium text-white">{match.team2}</div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold card-title-gradient drop-shadow-lg">{match.description}</h3>
                </div>

                <div className="space-y-4 mb-3">
                  <div className="p-3 bg-[#111827] rounded-lg border border-[#1f2937]">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-base font-medium card-title-gradient">Payout</div>
                      <div className="text-xs text-gray-400">Odds: {match.payoutMultiplier}x</div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handlePlayMatch(match)}
                  className="w-full py-2 text-white rounded-md font-medium transition-all bg-gradient-to-r from-primary to-pink-600 hover:shadow-lg hover:shadow-primary/30"
                  variant="ghost"
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

      {selectedMatch && showMatchModal && (
        <TeamMatchModal
          open={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          match={selectedMatch}
        />
      )}
    </div>
  );
}