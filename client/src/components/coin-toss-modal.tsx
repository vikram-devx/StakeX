import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Market, GameType, insertBetSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RotateCw } from "lucide-react";
import BetConfirmationModal from "./bet-confirmation-modal";
import CoinFlipAnimation from "./coin-flip-animation";
import ThreeDCoin from "./3d-coin";
import { z } from "zod";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | undefined>(undefined);
  const [useAdvanced3D, setUseAdvanced3D] = useState(true);

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

  // Function to simulate a coin flip
  const simulateCoinFlip = () => {
    if (isFlipping) return;
    
    // Start animation
    setIsFlipping(true);
    setFlipResult(undefined);
    
    // Simulate coin flip result after a delay
    // For demonstration only - in a real app, this would come from the server
    setTimeout(() => {
      const result = Math.random() > 0.5 ? 'heads' : 'tails';
      setFlipResult(result);
    }, 1000); // This delay is just to simulate server response time
  };
  
  // Handle animation completion
  const handleAnimationComplete = () => {
    // Animation is done, show bet confirmation if this was from a placed bet
    if (placedBet) {
      setTimeout(() => {
        setIsFlipping(false);
        setShowConfirmation(true);
      }, 1000); // Slight delay to let the user see the final result
    } else {
      // Just a test flip, reset after a moment
      setTimeout(() => {
        setIsFlipping(false);
      }, 2000);
    }
  };

  const placeBetMutation = useMutation({
    mutationFn: async (betData: z.infer<typeof insertBetSchema>) => {
      // Start the coin flip animation as soon as bet is placed
      simulateCoinFlip();
      
      const res = await apiRequest("POST", "/api/bets", betData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setPlacedBet(data);
      
      // The animation completion will be handled by the handleAnimationComplete function
      // which will show the confirmation modal after animation completes
    },
    onError: (error: Error) => {
      // Stop the animation if bet fails
      setIsFlipping(false);
      
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
          
          <DialogDescription className="text-gray-400 text-sm">
            Place your bet and watch the coin flip in 3D!
          </DialogDescription>
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-sm text-gray-400">Closing in:</span>
                <span className="font-semibold text-white ml-1">{getTimeRemaining()}</span>
              </div>
              {getStatusBadge()}
            </div>
            
            {/* Game Instructions */}
            <div className="mb-4 p-3 bg-[#0f172a] rounded-lg text-sm">
              <p><strong>Coin Toss:</strong> Select Heads or Tails. Win if your selection matches the result. Payout: 1.9x</p>
            </div>
            
            {/* 3D Mode Toggle */}
            <div className="flex items-center justify-end mb-4 space-x-2">
              <Label htmlFor="3d-mode" className="text-sm text-gray-400">3D Mode</Label>
              <Switch
                id="3d-mode"
                checked={useAdvanced3D}
                onCheckedChange={setUseAdvanced3D}
              />
            </div>
            
            {/* Coin Toss Animation */}
            <div className="flex justify-center mb-8 h-52">
              {isFlipping || flipResult ? (
                useAdvanced3D ? (
                  <ThreeDCoin 
                    isFlipping={isFlipping} 
                    result={flipResult}
                    onAnimationComplete={handleAnimationComplete}
                    className="scale-110"
                  />
                ) : (
                  <CoinFlipAnimation 
                    isFlipping={isFlipping} 
                    result={flipResult}
                    onAnimationComplete={handleAnimationComplete}
                  />
                )
              ) : (
                <div className="coin-initial w-40 h-40 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200" onClick={simulateCoinFlip}>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="coin-content flex flex-col items-center">
                    <span className="text-slate-800 text-4xl font-bold mb-1">?</span>
                    <RotateCw className="w-5 h-5 text-slate-800 animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs text-slate-800 mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Test Flip</span>
                  </div>
                </div>
              )}
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
