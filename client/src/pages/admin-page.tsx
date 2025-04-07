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
import { Loader2, ExternalLink, Clock, Award, Check, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Schema for creating a new market
const createMarketSchema = z.object({
  name: z.string().min(3, "Market name must be at least 3 characters"),
  openingHours: z.coerce.number().min(1, "Opening hours must be at least 1").max(24),
  closingHours: z.coerce.number().min(1, "Closing hours must be at least 1").max(24),
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
      openingHours: 1,
      closingHours: 3,
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

  // Handlers
  const onCreateMarketSubmit = (values: z.infer<typeof createMarketSchema>) => {
    const now = new Date();
    const openingTime = new Date(now);
    const closingTime = addHours(now, values.closingHours);
    
    createMarketMutation.mutateAsync({
      name: values.name,
      openingTime,
      closingTime,
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
          <TabsList className="w-full sm:w-auto mb-4 bg-[#334155]">
            <TabsTrigger value="markets" className="text-white data-[state=active]:text-primary">
              <ExternalLink className="mr-2 h-4 w-4" />
              Markets
            </TabsTrigger>
            <TabsTrigger value="bets" className="text-white data-[state=active]:text-primary">
              <Clock className="mr-2 h-4 w-4" />
              Bets
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:text-primary">
              <Award className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>
          
          {/* Markets Tab */}
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createMarketForm.control}
                          name="openingHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opening (hours)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="1"
                                  max="24"
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
                          name="closingHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (hours)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="1"
                                  max="24"
                                  className="bg-[#334155] border-[#475569] text-white" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                              ) : gameTypes?.map((type) => (
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
                  ) : markets && markets.length > 0 ? (
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
                          {markets.map((market) => (
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
                          <TableHead className="text-white">User ID</TableHead>
                          <TableHead className="text-white">Market</TableHead>
                          <TableHead className="text-white">Game Type</TableHead>
                          <TableHead className="text-white">Selection</TableHead>
                          <TableHead className="text-white">Amount</TableHead>
                          <TableHead className="text-white">Potential Win</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bets.map((bet) => (
                          <TableRow key={bet.id} className="border-b border-[#334155]">
                            <TableCell>{bet.userId}</TableCell>
                            <TableCell>{bet.marketId}</TableCell>
                            <TableCell>{bet.gameTypeId}</TableCell>
                            <TableCell className="font-medium">{bet.selection}</TableCell>
                            <TableCell>₹{Number(bet.betAmount).toFixed(2)}</TableCell>
                            <TableCell className="text-[#22c55e]">₹{Number(bet.potentialWin).toFixed(2)}</TableCell>
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
