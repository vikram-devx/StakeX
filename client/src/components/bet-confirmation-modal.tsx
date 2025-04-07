import { 
  Dialog, 
  DialogContent, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bet, Market, GameType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BetConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  bet: Bet;
  onConfirm?: () => void;
}

export default function BetConfirmationModal({ open, onClose, bet, onConfirm }: BetConfirmationModalProps) {
  const [_, navigate] = useLocation();

  const { data: market } = useQuery<Market>({
    queryKey: [`/api/markets/${bet.marketId}`],
    enabled: !!bet.marketId,
  });

  const { data: gameType } = useQuery<GameType>({
    queryKey: [`/api/gametypes/${bet.gameTypeId}`],
    enabled: !!bet.gameTypeId,
  });

  const viewMyBets = () => {
    navigate("/my-bets");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e293b] text-white max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-[#22c55e]" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-center mb-2">Bet Placed Successfully!</h3>
        <p className="text-gray-400 text-center mb-4">Your bet has been confirmed.</p>
        
        <Card className="bg-[#0f172a] border-gray-700 rounded-lg mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Market:</span>
              <span className="font-medium">{market?.name || `Market #${bet.marketId}`}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Game:</span>
              <span className="font-medium">{gameType?.name || `Game #${bet.gameTypeId}`}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Selected:</span>
              <span className="font-medium">{bet.selection}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Bet Amount:</span>
              <span className="font-medium">₹{Number(bet.betAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Potential Win:</span>
              <span className="font-medium text-[#22c55e]">₹{Number(bet.potentialWin).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        
        <DialogFooter className="flex space-x-3 sm:space-x-0">
          <Button 
            variant="outline"
            className="flex-1"
            onClick={viewMyBets}
          >
            View My Bets
          </Button>
          <Button 
            className="flex-1"
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              }
              onClose();
            }}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
