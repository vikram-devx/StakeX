import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Market, GameType, insertBetSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import BetConfirmationModal from "./bet-confirmation-modal";
import { z } from "zod";
import { format, differenceInHours, differenceInMinutes } from "date-fns";

interface GameModalProps {
  open: boolean;
  onClose: () => void;
  market: Market;
  gameTypes: GameType[];
}

export default function GameModal({ open, onClose, market, gameTypes }: GameModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeGame, setActiveGame] = useState<GameType | null>(gameTypes[0] || null);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [placedBet, setPlacedBet] = useState<any>(null);

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

  const getStatusBadge = () => {
    switch(market.status) {
      case "open":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#22c55e]/20 text-[#22c55e]">
            Open for Betting
          </span>
        );
      case "closing_soon":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#f59e0b]/20 text-[#f59e0b]">
            Closing Soon
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-500">
            {market.status}
          </span>
        );
    }
  };

  const placeBetMutation = useMutation({
    mutationFn: async (betData: z.infer<typeof insertBetSchema>) => {
      const res = await apiRequest("POST", "/api/bets", betData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setPlacedBet(data);
      setShowConfirmation(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Bet failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleBet = () => {
    if (!activeGame || !selectedNumber || betAmount <= 0 || !user) {
      toast({
        title: "Invalid bet",
        description: "Please select a number and enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (betAmount > Number(user.balance)) {
      toast({
        title: "Insufficient balance",
        description: "Please enter a lower amount or add funds to your wallet",
        variant: "destructive",
      });
      return;
    }

    const potentialWin = betAmount * Number(activeGame.payoutMultiplier);

    placeBetMutation.mutateAsync({
      userId: user.id,
      marketId: market.id,
      gameTypeId: activeGame.id,
      betAmount: betAmount.toString(), // Convert to string for Drizzle decimal column
      selection: selectedNumber,
      potentialWin: potentialWin.toString() // Convert to string for Drizzle decimal column
    });
  };

  // Generate numbers for Jodi game (00-99)
  const generateNumbers = () => {
    return Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
  };

  // Handle close and reset
  const handleClose = () => {
    setSelectedNumber(null);
    setBetAmount(100);
    onClose();
  };

  const gameInstructionsMap: Record<string, string> = {
    "Jodi": "Choose a two-digit number (00-99). Win if your number matches the result. Payout: 90x",
    "Hurf": "Choose a single digit (0-9). Win if your digit appears in the result. Payout: 9x",
    "Cross": "Choose two digits. Win if both digits appear in the result in any order. Payout: 15x",
    "Odd-Even": "Choose whether the result will be odd or even. Payout: 1.9x"
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-[#1e293b] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{market.name}</DialogTitle>
          </DialogHeader>
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-sm text-gray-400">Closing in:</span>
                <span className="font-semibold text-white ml-1">{getTimeRemaining()}</span>
              </div>
              {getStatusBadge()}
            </div>
            
            {/* Game Type Tabs */}
            <Tabs 
              defaultValue={activeGame?.id?.toString() || ""} 
              onValueChange={(value) => {
                const gameType = gameTypes.find(g => g.id.toString() === value);
                if (gameType) setActiveGame(gameType);
                setSelectedNumber(null);
              }}
              className="mb-4"
            >
              <TabsList className="border-b border-gray-700 bg-transparent w-full justify-start overflow-x-auto space-x-4 h-auto p-0">
                {gameTypes.map(gameType => (
                  <TabsTrigger 
                    key={gameType.id} 
                    value={gameType.id.toString()}
                    className="whitespace-nowrap py-2 px-1 text-sm font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                  >
                    {gameType.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {gameTypes.map(gameType => (
                <TabsContent key={gameType.id} value={gameType.id.toString()}>
                  {/* Game Instructions */}
                  <div className="mb-4 p-3 bg-[#0f172a] rounded-lg text-sm">
                    <p><strong>{gameType.name} Game:</strong> {gameType.description}</p>
                  </div>
                  
                  {/* Game UI */}
                  <div className="game-content">
                    {/* Number Grid */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {generateNumbers().map(num => (
                        <Button
                          key={num}
                          variant="outline"
                          className={`game-option h-12 ${selectedNumber === num 
                            ? 'bg-primary/20 border-primary' 
                            : 'bg-[#0f172a] border-gray-700'}`}
                          onClick={() => setSelectedNumber(num)}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Bet Amount Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Bet Amount (₹)</label>
                      <Input 
                        type="number" 
                        className="w-full bg-[#0f172a] border border-gray-700 rounded p-2 text-white" 
                        placeholder="Enter amount" 
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min="10" 
                        step="10"
                      />
                    </div>
                    
                    {/* Bet Summary */}
                    {selectedNumber && (
                      <Card className="bg-[#0f172a] border-gray-700 rounded-lg mb-4">
                        <CardContent className="p-3">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Selected Number:</span>
                            <span className="font-medium">{selectedNumber}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Bet Amount:</span>
                            <span className="font-medium">₹{betAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Potential Win:</span>
                            <span className="font-medium text-[#22c55e]">
                              ₹{(betAmount * Number(activeGame?.payoutMultiplier || 0)).toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Place Bet Button */}
                    <Button 
                      className="w-full py-3" 
                      onClick={handleBet}
                      disabled={!selectedNumber || betAmount <= 0 || placeBetMutation.isPending}
                    >
                      {placeBetMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Bet...</>
                      ) : (
                        "Place Bet"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {showConfirmation && placedBet && (
        <BetConfirmationModal
          open={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            handleClose();
          }}
          bet={placedBet}
        />
      )}
    </>
  );
}
