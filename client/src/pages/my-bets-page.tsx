import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import GameTabs from "@/components/game-tabs";
import { useQuery } from "@tanstack/react-query";
import { Bet, Market, GameType } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

type BetWithDetails = Bet & {
  market: Market;
  gameType: GameType;
};

export default function MyBetsPage() {
  const { user } = useAuth();
  
  const { data: bets, isLoading } = useQuery<BetWithDetails[]>({
    queryKey: [`/api/users/${user?.id}/bets`],
  });

  const getBetStatusBadge = (status: string) => {
    switch(status) {
      case "won":
        return <Badge className="bg-[#22c55e]">Won</Badge>;
      case "lost":
        return <Badge className="bg-[#ef4444]">Lost</Badge>;
      default:
        return <Badge className="bg-[#f59e0b]">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <GameTabs activeTab="my-bets" />
        
        <div>
          <h2 className="text-xl font-semibold mb-4">My Bets</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bets && bets.length > 0 ? (
            <Card className="bg-[#1e293b] border-[#334155] text-white overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#334155]">
                      <TableRow>
                        <TableHead className="text-white">Market</TableHead>
                        <TableHead className="text-white">Game</TableHead>
                        <TableHead className="text-white">Selection</TableHead>
                        <TableHead className="text-white">Amount</TableHead>
                        <TableHead className="text-white">Potential Win</TableHead>
                        <TableHead className="text-white">Result</TableHead>
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bets.map((bet) => (
                        <TableRow key={bet.id} className="border-b border-[#334155]">
                          <TableCell>{bet.market.name}</TableCell>
                          <TableCell>{bet.gameType.name}</TableCell>
                          <TableCell className="font-medium">{bet.selection}</TableCell>
                          <TableCell>₹{Number(bet.betAmount).toFixed(2)}</TableCell>
                          <TableCell className="text-[#22c55e]">₹{Number(bet.potentialWin).toFixed(2)}</TableCell>
                          <TableCell>{bet.market.result || 'Pending'}</TableCell>
                          <TableCell>{format(new Date(bet.placedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>{getBetStatusBadge(bet.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 bg-[#1e293b] rounded-lg">
              <p className="text-gray-400">You haven't placed any bets yet.</p>
              <p className="text-gray-500 text-sm mt-2">Head over to the Markets tab to place your first bet!</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
