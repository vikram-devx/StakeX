import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Market, GameType, InsertMarket, Bet, User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, addHours } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ExternalLink, Clock, Award, Check, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// Schema for creating a new market
const createMarketSchema = z.object({
  name: z.string().min(3, "Market name must be at least 3 characters"),
  description: z.string().optional(),
  bannerImage: z.string().optional(),
  openingDate: z.string(),
  openingTime: z.string(),
  closingDate: z.string(),
  closingTime: z.string(),
  resultDate: z.string().optional(),
  resultTime: z.string().optional(),
  gameTypes: z.array(z.number()).min(1, "Select at least one game type")
});

// Schema for declaring a result
const declareResultSchema = z.object({
  result: z.string().min(1, "Result is required")
});

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  // Queries
  const { data: markets, isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets/all"],
  });

  const { data: gameTypes, isLoading: gameTypesLoading } = useQuery<GameType[]>({
    queryKey: ["/api/gametypes"],
  });

  // Filter markets based on game types
  const standardMarkets = markets?.filter(market => 
    !market.gameTypes?.some(gtId => 
      gameTypes?.some(gt => 
        gt.id === gtId && gt.gameCategory === "teamMatch"
      )
    )
  );

  const teamMatchMarkets = markets?.filter(market => 
    market.gameTypes?.some(gtId => 
      gameTypes?.some(gt => 
        gt.id === gtId && gt.gameCategory === "teamMatch"
      )
    )
  );

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: bets, isLoading: betsLoading } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
  });

  // Create market form
  const createMarketForm = useForm<z.infer<typeof createMarketSchema>>({
    resolver: zodResolver(createMarketSchema),
    defaultValues: {
      name: "",
      description: "",
      bannerImage: "",
      openingDate: format(new Date(), 'yyyy-MM-dd'),
      openingTime: format(new Date(), 'HH:mm'),
      closingDate: format(addHours(new Date(), 3), 'yyyy-MM-dd'),
      closingTime: format(addHours(new Date(), 3), 'HH:mm'),
      resultDate: "",
      resultTime: "",
      gameTypes: []
    }
  });

  // Declare result form
  const declareResultForm = useForm<z.infer<typeof declareResultSchema>>({
    resolver: zodResolver(declareResultSchema),
    defaultValues: {
      result: ""
    }
  });

  // Mutations
  const createMarketMutation = useMutation({
    mutationFn: async (data: InsertMarket) => {
      const res = await apiRequest("POST", "/api/markets", data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate both admin and user-facing market lists
      queryClient.invalidateQueries({ queryKey: ["/api/markets/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      toast({
        title: "Market created",
        description: "The market has been created successfully",
      });
      createMarketForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create market",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMarketStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/markets/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate both admin and user-facing market lists
      queryClient.invalidateQueries({ queryKey: ["/api/markets/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      toast({
        title: "Status updated",
        description: "The market status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const declareResultMutation = useMutation({
    mutationFn: async ({ id, result }: { id: number, result: string }) => {
      const res = await apiRequest("POST", `/api/markets/${id}/result`, { result });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/markets/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      toast({
        title: "Result declared",
        description: "The result has been declared and winners processed",
      });
      setSelectedMarketId(null);
      declareResultForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to declare result",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createGameTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/gametypes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gametypes"] });
      toast({
        title: "Game type created",
        description: "New game type has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create game type",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handlers
  const onCreateMarketSubmit = (values: z.infer<typeof createMarketSchema>) => {
    // Combine date and time strings into Date objects
    const openingTime = new Date(`${values.openingDate}T${values.openingTime}`);
    const closingTime = new Date(`${values.closingDate}T${values.closingTime}`);

    // Create resultTime if both date and time are provided
    let resultTime = null;
    if (values.resultDate && values.resultTime) {
      resultTime = new Date(`${values.resultDate}T${values.resultTime}`);
    }

    createMarketMutation.mutateAsync({
      name: values.name,
      description: values.description || null,
      bannerImage: values.bannerImage || null,
      openingTime,
      closingTime,
      resultTime,
      createdBy: user.id,
      gameTypes: values.gameTypes
    });
  };

  const onDeclareResultSubmit = (values: z.infer<typeof declareResultSchema>) => {
    if (selectedMarketId) {
      declareResultMutation.mutateAsync({
        id: selectedMarketId,
        result: values.result
      });
    }
  };

  // Get team match game types for a market
  const getTeamMatchGameTypes = (marketId: number) => {
    if (!gameTypes) return [];

    const market = markets?.find(m => m.id === marketId);
    if (!market) return [];

    const marketGameTypeIds = market.gameTypes as number[];
    return gameTypes.filter(gt => 
      marketGameTypeIds.includes(gt.id) && 
      gt.gameCategory === 'teamMatch'
    );
  };

  const handleStatusChange = (id: number, status: string) => {
    updateMarketStatusMutation.mutateAsync({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "open":
        return <Badge className="bg-[#22c55e]">Open</Badge>;
      case "closing_soon":
        return <Badge className="bg-[#f59e0b]">Closing Soon</Badge>;
      case "closed":
        return <Badge className="bg-[#ef4444]">Closed</Badge>;
      case "resulted":
        return <Badge className="bg-primary">Resulted</Badge>;
      default:
        return <Badge className="bg-gray-500">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400">Manage markets, games, and view statistics</p>
        </div>

        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="w-full sm:w-auto mb-4 bg-[#1e293b] rounded-lg border border-[#334155]">
            <TabsTrigger value="markets" className="text-gray-400 hover:text-white data-[state=active]:bg-[#334155] data-[state=active]:text-white transition-colors">
              <ExternalLink className="mr-2 h-4 w-4" />
              Market Games
            </TabsTrigger>
            <TabsTrigger value="team-matches" className="text-gray-400 hover:text-white data-[state=active]:bg-[#334155] data-[state=active]:text-white transition-colors">
              <ExternalLink className="mr-2 h-4 w-4" />
              Team Matches
            </TabsTrigger>
            <TabsTrigger value="bets" className="text-gray-400 hover:text-white data-[state=active]:bg-[#334155] data-[state=active]:text-white transition-colors">
              <Clock className="mr-2 h-4 w-4" />
              Bets
            </TabsTrigger>
            <TabsTrigger value="users" className="text-gray-400 hover:text-white data-[state=active]:bg-[#334155] data-[state=active]:text-white transition-colors">
              <Award className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Market Games Tab */}
          <TabsContent value="markets">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Create Market Form */}
              <Card className="bg-[#1e293b] border-[#334155] text-white md:col-span-1">
                <CardHeader>
                  <CardTitle>Create New Market</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...createMarketForm}>
                    <form onSubmit={createMarketForm.handleSubmit(onCreateMarketSubmit)} className="space-y-4">
                      <FormField
                        control={createMarketForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Market Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="E.g. Mumbai Matka" 
                                className="bg-[#334155] border-[#475569] text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createMarketForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Market Description</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter a description" 
                                className="bg-[#334155] border-[#475569] text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createMarketForm.control}
                        name="bannerImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banner Image URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.jpg" 
                                className="bg-[#334155] border-[#475569] text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Opening Time</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createMarketForm.control}
                            name="openingDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    className="bg-[#334155] border-[#475569] text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={createMarketForm.control}
                            name="openingTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="time"
                                    className="bg-[#334155] border-[#475569] text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Closing Time</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createMarketForm.control}
                            name="closingDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    className="bg-[#334155] border-[#475569] text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={createMarketForm.control}
                            name="closingTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="time"
                                    className="bg-[#334155] border-[#475569] text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Result Time (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createMarketForm.control}
                            name="resultDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    className="bg-[#334155] border-[#475569] text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={createMarketForm.control}
                            name="resultTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="time"
                                    className="bg-[#334155] border-[#475569] text-white" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={createMarketForm.control}
                        name="gameTypes"
                        render={() => (
                          <FormItem>
                            <div className="mb-2">
                              <FormLabel>Game Types</FormLabel>
                            </div>
                            <div className="space-y-2">
                              {gameTypesLoading ? (
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading game types...
                                </div>
                              ) : gameTypes?.filter(type => type.gameCategory !== "teamMatch").map((type) => (
                                <FormField
                                  key={type.id}
                                  control={createMarketForm.control}
                                  name="gameTypes"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={type.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(type.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, type.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== type.id
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {type.name}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createMarketMutation.isPending}
                      >
                        {createMarketMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                        ) : (
                          "Create Market"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Markets List */}
              <Card className="bg-[#1e293b] border-[#334155] text-white md:col-span-2">
                <CardHeader>
                  <CardTitle>Manage Markets</CardTitle>
                </CardHeader>
                <CardContent>
                  {marketsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : standardMarkets && standardMarkets.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-[#334155]">
                          <TableRow>
                            <TableHead className="text-white">Name</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white">Closing Time</TableHead>
                            <TableHead className="text-white">Games</TableHead>
                            <TableHead className="text-white">Result</TableHead>
                            <TableHead className="text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {standardMarkets.map((market) => (
                            <TableRow key={market.id} className="border-b border-[#334155]">
                              <TableCell className="font-medium">{market.name}</TableCell>
                              <TableCell>{getStatusBadge(market.status)}</TableCell>
                              <TableCell>{format(new Date(market.closingTime), 'dd/MM/yyyy HH:mm')}</TableCell>
                              <TableCell>
                                {Array.isArray(market.gameTypes) && market.gameTypes.length} types
                              </TableCell>
                              <TableCell>
                                {market.result || 'Not declared'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {market.status === "pending" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleStatusChange(market.id, "open")}
                                    >
                                      Open
                                    </Button>
                                  )}

                                  {market.status === "open" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleStatusChange(market.id, "closing_soon")}
                                    >
                                      Set Closing Soon
                                    </Button>
                                  )}

                                  {(market.status === "open" || market.status === "closing_soon") && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleStatusChange(market.id, "closed")}
                                    >
                                      Close
                                    </Button>
                                  )}

                                  {market.status === "closed" && !market.result && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          onClick={() => setSelectedMarketId(market.id)}
                                        >
                                          Declare Result
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="bg-[#1e293b] text-white">
                                        <DialogHeader>
                                          <DialogTitle>Declare Result - {market.name}</DialogTitle>
                                          <DialogDescription className="text-gray-400">
                                            Enter the final result for this market.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <Form {...declareResultForm}>
                                          <form onSubmit={declareResultForm.handleSubmit(onDeclareResultSubmit)}>
                                            <FormField
                                              control={declareResultForm.control}
                                              name="result"
                                              render={({ field }) => (
                                                <FormItem className="mb-4">
                                                  <FormLabel>Result</FormLabel>
                                                  <FormControl>
                                                    <Input 
                                                      placeholder="Enter result" 
                                                      className="bg-[#334155] border-[#475569] text-white" 
                                                      {...field} 
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <DialogFooter>
                                              <Button 
                                                type="submit" 
                                                disabled={declareResultMutation.isPending}
                                              >
                                                {declareResultMutation.isPending ? (
                                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Declaring...</>
                                                ) : (
                                                  "Declare Result"
                                                )}
                                              </Button>
                                            </DialogFooter>
                                          </form>
                                        </Form>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No markets available.</p>
                      <p className="text-gray-500 text-sm mt-2">Create your first market using the form.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Matches Tab */}
          <TabsContent value="team-matches">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Create Team Match Form */}
              <Card className="bg-[#1e293b] border-[#334155] text-white">
                <CardHeader>
                  <CardTitle>Create Team Match</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = {
                      name: formData.get('name') as string,
                      description: formData.get('description') as string,
                      payoutMultiplier: formData.get('payoutMultiplier') as string,
                      gameCategory: 'teamMatch',
                      team1: formData.get('team1') as string,
                      team2: formData.get('team2') as string,
                      teamLogoUrl1: formData.get('teamLogoUrl1') as string || null,
                      teamLogoUrl2: formData.get('teamLogoUrl2') as string || null,
                    };

                    createGameTypeMutation.mutate(data);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Match Name</Label>
                      <Input 
                        id="name"
                        name="name"
                        placeholder="e.g. IPL Match"
                        className="bg-[#334155] border-[#475569] text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input 
                        id="description"
                        name="description"
                        placeholder="Match description"
                        className="bg-[#334155] border-[#475569] text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payoutMultiplier">Payout Multiplier</Label>
                      <Input 
                        id="payoutMultiplier"
                        name="payoutMultiplier"
                        type="number"
                        step="0.1"
                        min="1"
                        placeholder="e.g. 1.9"
                        className="bg-[#334155] border-[#475569] text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="team1">Team 1 Name</Label>
                        <Input 
                          id="team1"
                          name="team1"
                          placeholder="e.g. Mumbai Indians"
                          className="bg-[#334155] border-[#475569] text-white"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="team2">Team 2 Name</Label>
                        <Input 
                          id="team2"
                          name="team2"
                          placeholder="e.g. Chennai Super Kings"
                          className="bg-[#334155] border-[#475569] text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="teamLogoUrl1">Team 1 Logo URL</Label>
                        <Input 
                          id="teamLogoUrl1"
                          name="teamLogoUrl1"
                          placeholder="https://example.com/logo1.png"
                          className="bg-[#334155] border-[#475569] text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="teamLogoUrl2">Team 2 Logo URL</Label>
                        <Input 
                          id="teamLogoUrl2"
                          name="teamLogoUrl2"
                          placeholder="https://example.com/logo2.png"
                          className="bg-[#334155] border-[#475569] text-white"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-pink-600"
                      disabled={createGameTypeMutation.isPending}
                    >
                      {createGameTypeMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                      ) : (
                        "Create Team Match"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Team Matches List */}
              <Card className="bg-[#1e293b] border-[#334155] text-white md:col-span-2">
                <CardHeader>
                  <CardTitle>Manage Team Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  {marketsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : teamMatchMarkets && teamMatchMarkets.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-[#334155]">
                          <TableRow>
                            <TableHead className="text-white">Name</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white">Teams</TableHead>
                            <TableHead className="text-white">Result</TableHead>
                            <TableHead className="text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamMatchMarkets.map((market) => (
                            <TableRow key={market.id} className="border-b border-[#334155]">
                              <TableCell className="font-medium">{market.name}</TableCell>
                              <TableCell>{getStatusBadge(market.status)}</TableCell>
                              <TableCell>
                                {gameTypes?.filter(gt => 
                                  gt.gameCategory === "teamMatch" && 
                                  market.gameTypes?.includes(gt.id)
                                ).map(gt => (
                                  <div key={gt.id} className="text-sm">
                                    {gt.team1} vs {gt.team2}
                                  </div>
                                ))}
                              </TableCell>
                              <TableCell>
                                {market.result || 'Not declared'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {market.status === "pending" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleStatusChange(market.id, "open")}
                                    >
                                      Open
                                    </Button>
                                  )}

                                  {market.status === "open" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleStatusChange(market.id, "closing_soon")}
                                    >
                                      Set Closing Soon
                                    </Button>
                                  )}

                                  {(market.status === "open" || market.status === "closing_soon") && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleStatusChange(market.id, "closed")}
                                    >
                                      Close
                                    </Button>                                    )}

                                  {market.status === "closed" && !market.result && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          onClick           size="sm" 
                                          onClick={() => setSelectedMarketId(market.id)}
                                        >
                                          Declare Result
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="bg-[#1e293b] text-white">
                                        <DialogHeader>
                                          <DialogTitle>Declare Result - {market.name}</DialogTitle>
                                          <DialogDescription className="text-gray-400">
                                            Enter the final result for this market.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <Form {...declareResultForm}>
                                          <form onSubmit={declareResultForm.handleSubmit(onDeclareResultSubmit)}>
                                            <FormField
                                              control={declareResultForm.control}
                                              name="result"
                                              render={({ field }) => (
                                                <FormItem className="mb-4">
                                                  <FormLabel>Result</FormLabel>
                                                  <FormControl>
                                                    <Input 
                                                      placeholder="Enter result" 
                                                      className="bg-[#334155] border-[#475569] text-white" 
                                                      {...field} 
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <DialogFooter>
                                              <Button 
                                                type="submit" 
                                                disabled={declareResultMutation.isPending}
                                              >
                                                {declareResultMutation.isPending ? (
                                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Declaring...</>
                                                ) : (
                                                  "Declare Result"
                                                )}
                                              </Button>
                                            </DialogFooter>
                                          </form>
                                        </Form>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No team matches available.</p>
                      <p className="text-gray-500 text-sm mt-2">Create your first team match using the form.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bets Tab */}
          <TabsContent value="bets">
            <Card className="bg-[#1e293b] border-[#334155] text-white">
              <CardHeader>
                <CardTitle>All Bets</CardTitle>
              </CardHeader>
              <CardContent>
                {betsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : bets && bets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-[#334155]">
                        <TableRow>
                          <TableHead className="text-white">User</TableHead>
                          <TableHead className="text-white">Market</TableHead>
                          <TableHead className="text-white">Game Type</TableHead>
                          <TableHead className="text-white">Selection</TableHead>
                          <TableHead className="text-white">Amount</TableHead>
                          <TableHead className="text-white">Potential Win</TableHead>
                          <TableHead className="text-white">Result</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bets?.map((bet) => (
                          <TableRow key={bet.id} className="border-b border-[#334155]">
                            <TableCell>{users?.find(u => u.id === bet.userId)?.username || bet.userId}</TableCell>
                            <TableCell>{markets?.find(m => m.id === bet.marketId)?.name || bet.marketId}</TableCell>
                            <TableCell>{gameTypes?.find(g => g.id === bet.gameTypeId)?.name || bet.gameTypeId}</TableCell>
                            <TableCell className="font-medium">{bet.selection}</TableCell>
                            <TableCell>₹{Number(bet.betAmount).toFixed(2)}</TableCell>
                            <TableCell className="text-[#22c55e]">₹{Number(bet.potentialWin).toFixed(2)}</TableCell>
                            <TableCell>
                              {markets?.find(m => m.id === bet.marketId)?.result || 'Pending'}
                            </TableCell>
                            <TableCell>
                              {bet.status === "won" ? (
                                <Check className="h-5 w-5 text-[#22c55e]" />
                              ) : bet.status === "lost" ? (
                                <X className="h-5 w-5 text-[#ef4444]" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-[#f59e0b]" />
                              )}
                            </TableCell>
                            <TableCell>{format(new Date(bet.placedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No bets placed yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-[#1e293b] border-[#334155] text-white">
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-[#334155]">
                        <TableRow>
                          <TableHead className="text-white">ID</TableHead>
                          <TableHead className="text-white">Username</TableHead>
                          <TableHead className="text-white">Balance</TableHead>
                          <TableHead className="text-white">Role</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="border-b border-[#334155]">
                            <TableCell>{user.id}</TableCell>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>₹{Number(user.balance).toFixed(2)}</TableCell>
                            <TableCell>
                              {user.role === "admin" ? (
                                <Badge className="bg-[#ec4899]">Admin</Badge>
                              ) : (
                                <Badge className="bg-primary">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.isBanned ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">Edit</Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-[#1e293b] text-white">
                                    <DialogHeader>
                                      <DialogTitle>Edit User: {user.username}</DialogTitle>
                                      <DialogDescription>
                                        Update user details and manage funds
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label>Username</Label>
                                        <Input 
                                          defaultValue={user.username}
                                          className="bg-[#334155] border-[#475569] text-white"
                                        />
                                      </div>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Current Password</Label>
                                          <div className="relative">
                                            <Input 
                                              type={showPassword ? "text" : "password"}
                                              defaultValue={user.password}
                                              disabled
                                              className="bg-[#334155] border-[#475569] text-white opacity-50 pr-10"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setShowPassword(!showPassword)}
                                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            >
                                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>New Password</Label>
                                          <Input 
                                            type="password"
                                            placeholder="Enter new password"
                                            className="bg-[#334155] border-[#475569] text-white"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Confirm New Password</Label>
                                          <Input 
                                            type="password"
                                            placeholder="Confirm new password"
                                            className="bg-[#334155] border-[#475569] text-white"
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Fund Adjustment</Label>
                                        <div className="flex space-x-2">
                                          <Input 
                                            type="number"
                                            placeholder="Amount"
                                            className="bg-[#334155] border-[#475569] text-white"
                                          />
                                          <Select defaultValue="deposit">
                                            <SelectTrigger className="w-[120px]">
                                              <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="deposit">Deposit</SelectItem>
                                              <SelectItem value="withdraw">Withdraw</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => {}}>
                                        Save Changes
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                {!user.isBanned ? (
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => {}}
                                  >
                                    Ban
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {}}
                                  >
                                    Unban
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No users registered yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}