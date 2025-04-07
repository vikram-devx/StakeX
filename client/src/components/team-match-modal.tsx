import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Market, GameType, insertBetSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import BetConfirmationModal from "./bet-confirmation-modal";
import { Card } from "./ui/card";

interface TeamMatchModalProps {
  open: boolean;
  onClose: () => void;
  market: Market;
  gameTypes: GameType[];
}

export default function TeamMatchModal({ open, onClose, market, gameTypes }: TeamMatchModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [betDetails, setBetDetails] = useState<any>(null);

  const validationSchema = z.object({
    betAmount: z.string()
      .min(1, "Bet amount is required")
      .refine(val => !isNaN(Number(val)), "Bet amount must be a number")
      .refine(val => Number(val) > 0, "Bet amount must be greater than 0")
      .refine(val => Number(val) <= Number(user?.balance), "Insufficient balance"),
    gameTypeId: z.string().min(1, "Please select a match"),
    selection: z.string().min(1, "Please select a team")
  });

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      betAmount: "",
      gameTypeId: "",
      selection: ""
    },
  });

  const placeBetMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bets", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Bet placed successfully",
        description: "Good luck!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onGameTypeChange = (gameTypeId: string) => {
    const gameType = gameTypes.find(g => g.id === parseInt(gameTypeId));
    if (gameType) {
      setSelectedGameType(gameType);
      form.setValue("selection", ""); // Reset selection when game type changes
    }
  };

  const onSubmit = (data: z.infer<typeof validationSchema>) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "Please log in to place a bet",
        variant: "destructive",
      });
      return;
    }

    const gameType = gameTypes.find(g => g.id === parseInt(data.gameTypeId));
    if (!gameType) {
      toast({
        title: "Error",
        description: "Invalid game type selected",
        variant: "destructive",
      });
      return;
    }

    // Calculate potential win
    const betAmount = parseFloat(data.betAmount);
    const potentialWin = betAmount * parseFloat(gameType.payoutMultiplier.toString());

    const betData = {
      userId: user.id,
      marketId: market.id,
      gameTypeId: parseInt(data.gameTypeId),
      selection: data.selection,
      betAmount: data.betAmount,
      potentialWin: potentialWin.toString()
    };

    // Store bet details for confirmation dialog
    setBetDetails({
      ...betData,
      gameTypeName: gameType.name,
      marketName: market.name,
      gameType
    });

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleConfirmBet = () => {
    placeBetMutation.mutate(betDetails);
    setShowConfirmation(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#1e293b] text-white border-[#334155] max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text">Place Bet - {market.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a match, choose your team, and place your bet
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="gameTypeId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select Match</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          onGameTypeChange(value);
                        }}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        {gameTypes.map((gameType) => (
                          <div key={gameType.id} className={`border rounded-md p-3 ${field.value === gameType.id.toString() ? "border-primary" : "border-[#334155]"}`}>
                            <div className="flex justify-between">
                              <RadioGroupItem
                                value={gameType.id.toString()}
                                id={`gameType-${gameType.id}`}
                                className="peer sr-only"
                              />
                              <label 
                                htmlFor={`gameType-${gameType.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium">{gameType.name}</div>
                                <div className="text-sm text-gray-400">{gameType.description}</div>
                              </label>
                              <div className="text-primary">
                                {gameType.payoutMultiplier}x
                              </div>
                            </div>

                            {field.value === gameType.id.toString() && (
                              <div className="mt-3 pt-3 border-t border-[#334155]">
                                <div className="flex justify-between items-center gap-4">
                                  <div className="flex-1 text-center">
                                    {gameType.teamLogoUrl1 ? (
                                      <div className="w-10 h-10 mx-auto mb-1">
                                        <img src={gameType.teamLogoUrl1} alt={gameType.team1 || ''} className="w-full h-full object-contain" />
                                      </div>
                                    ) : null}
                                    <div className="text-sm font-medium">{gameType.team1}</div>
                                  </div>
                                  <div className="text-lg font-bold text-gray-500">VS</div>
                                  <div className="flex-1 text-center">
                                    {gameType.teamLogoUrl2 ? (
                                      <div className="w-10 h-10 mx-auto mb-1">
                                        <img src={gameType.teamLogoUrl2} alt={gameType.team2 || ''} className="w-full h-full object-contain" />
                                      </div>
                                    ) : null}
                                    <div className="text-sm font-medium">{gameType.team2}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedGameType && (
                <FormField
                  control={form.control}
                  name="selection"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select Team</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-1"
                        >
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <Card className={`p-3 cursor-pointer hover:bg-[#111827] transition-colors ${field.value === selectedGameType.team1 ? "bg-[#111827] border-primary ring-2 ring-primary/70 shadow-md shadow-primary/30" : "bg-[#1a2436] border-[#334155]"}`}>
                              <RadioGroupItem
                                value={selectedGameType.team1 as string}
                                id={`team1-${selectedGameType.id}`}
                                className="peer sr-only"
                              />
                              <label
                                htmlFor={`team1-${selectedGameType.id}`}
                                className="flex flex-col items-center justify-center cursor-pointer"
                              >
                                {field.value === selectedGameType.team1 && (
                                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                                {selectedGameType.teamLogoUrl1 ? (
                                  <div className="w-14 h-14 mb-2">
                                    <img src={selectedGameType.teamLogoUrl1} alt={selectedGameType.team1 || ''} className="w-full h-full object-contain" />
                                  </div>
                                ) : null}
                                <div className="font-medium text-center">{selectedGameType.team1}</div>
                                {field.value === selectedGameType.team1 && (
                                  <div className="mt-1 text-xs font-medium text-primary">Selected</div>
                                )}
                              </label>
                            </Card>

                            <Card className={`p-3 cursor-pointer hover:bg-[#111827] transition-colors ${field.value === selectedGameType.team2 ? "bg-[#111827] border-primary ring-2 ring-primary/70 shadow-md shadow-primary/30" : "bg-[#1a2436] border-[#334155]"}`}>
                              <RadioGroupItem
                                value={selectedGameType.team2 as string}
                                id={`team2-${selectedGameType.id}`}
                                className="peer sr-only"
                              />
                              <label
                                htmlFor={`team2-${selectedGameType.id}`}
                                className="flex flex-col items-center justify-center cursor-pointer"
                              >
                                {field.value === selectedGameType.team2 && (
                                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                                {selectedGameType.teamLogoUrl2 ? (
                                  <div className="w-14 h-14 mb-2">
                                    <img src={selectedGameType.teamLogoUrl2} alt={selectedGameType.team2 || ''} className="w-full h-full object-contain" />
                                  </div>
                                ) : null}
                                <div className="font-medium text-center">{selectedGameType.team2}</div>
                                {field.value === selectedGameType.team2 && (
                                  <div className="mt-1 text-xs font-medium text-primary">Selected</div>
                                )}
                              </label>
                            </Card>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="betAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bet Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Enter bet amount"
                        className="bg-[#111827] border-[#334155] text-white"
                        min="1"
                        step="0.01"
                      />
                    </FormControl>
                    <div className="text-sm text-gray-400">Balance: ₹{user?.balance}</div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedGameType && form.watch("betAmount") && form.watch("selection") && (
                <div className="p-3 bg-[#111827] rounded-md border border-[#334155]">
                  <div className="text-sm text-gray-400">Potential Win:</div>
                  <div className="text-lg font-bold text-primary">
                    ₹{(parseFloat(form.watch("betAmount") || "0") * parseFloat(selectedGameType.payoutMultiplier.toString())).toFixed(2)}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-[#334155] text-white hover:bg-[#334155] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-pink-600 hover:shadow-lg hover:shadow-primary/30"
                  disabled={placeBetMutation.isPending}
                >
                  {placeBetMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Bet...</>
                  ) : (
                    "Place Bet"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showConfirmation && betDetails && (
        <BetConfirmationModal
          open={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          bet={betDetails}
          onConfirm={handleConfirmBet}
        />
      )}
    </>
  );
}