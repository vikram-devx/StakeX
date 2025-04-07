import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { differenceInHours, differenceInMinutes } from "date-fns";

interface CoinTossModalProps {
  open: boolean;
  onClose: () => void;
  market: Market;
  gameTypes: GameType[];
}

export default function CoinTossModal({ open, onClose, market, gameTypes }: CoinTossModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [placedBet, setPlacedBet] = useState<any>(null);

  const coinTossGameType = gameTypes.find(g => g.gameCategory === "cointoss");

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
    if (!coinTossGameType || !selectedSide || betAmount <= 0 || !user) {
      toast({
        title: "Invalid bet",
        description: "Please select heads or tails and enter a valid amount",
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

    const potentialWin = betAmount * Number(coinTossGameType.payoutMultiplier);

    placeBetMutation.mutateAsync({
      userId: user.id,
      marketId: market.id,
      gameTypeId: coinTossGameType.id,
      betAmount: betAmount.toString(), // Convert to string for Drizzle decimal column
      selection: selectedSide,
      potentialWin: potentialWin.toString() // Convert to string for Drizzle decimal column
    });
  };

  // Handle close and reset
  const handleClose = () => {
    setSelectedSide(null);
    setBetAmount(100);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-[#1e293b] text-white max-w-lg">
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
            
            {/* Game Instructions */}
            <div className="mb-6 p-3 bg-[#0f172a] rounded-lg text-sm">
              <p><strong>Coin Toss:</strong> Select Heads or Tails. Win if your selection matches the result. Payout: 1.9x</p>
            </div>
            
            {/* Coin Toss UI */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow-lg flex items-center justify-center animate-pulse">
                <span className="text-slate-800 text-2xl font-bold">?</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                variant="outline"
                className={`game-option flex flex-col items-center py-4 h-auto ${
                  selectedSide === "heads" 
                    ? 'border-primary bg-primary/20' 
                    : 'border-gray-700 bg-[#0f172a] hover:bg-primary/10'
                }`}
                onClick={() => setSelectedSide("heads")}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow flex items-center justify-center mb-2">
                  <span className="text-slate-800 font-bold">H</span>
                </div>
                <span className="font-medium">Heads</span>
              </Button>
              
              <Button
                variant="outline"
                className={`game-option flex flex-col items-center py-4 h-auto ${
                  selectedSide === "tails" 
                    ? 'border-primary bg-primary/20' 
                    : 'border-gray-700 bg-[#0f172a] hover:bg-primary/10'
                }`}
                onClick={() => setSelectedSide("tails")}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow flex items-center justify-center mb-2">
                  <span className="text-slate-800 font-bold">T</span>
                </div>
                <span className="font-medium">Tails</span>
              </Button>
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
            {selectedSide && (
              <Card className="bg-[#0f172a] border-gray-700 rounded-lg mb-4">
                <CardContent className="p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Selected:</span>
                    <span className="font-medium capitalize">{selectedSide}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Bet Amount:</span>
                    <span className="font-medium">₹{betAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Potential Win:</span>
                    <span className="font-medium text-[#22c55e]">
                      ₹{(betAmount * Number(coinTossGameType?.payoutMultiplier || 0)).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Place Bet Button */}
            <Button 
              className="w-full py-3" 
              onClick={handleBet}
              disabled={!selectedSide || betAmount <= 0 || placeBetMutation.isPending}
            >
              {placeBetMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Bet...</>
              ) : (
                "Place Bet"
              )}
            </Button>
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
