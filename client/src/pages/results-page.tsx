import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import GameTabs from "@/components/game-tabs";
import { useQuery } from "@tanstack/react-query";
import { Market } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ResultsPage() {
  const { data: results, isLoading } = useQuery<Market[]>({
    queryKey: ["/api/results"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <GameTabs activeTab="results" />
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Results</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results && results.length > 0 ? (
            <Card className="bg-[#1e293b] border-[#334155] text-white overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#334155]">
                      <TableRow>
                        <TableHead className="text-white">Market</TableHead>
                        <TableHead className="text-white">Result</TableHead>
                        <TableHead className="text-white">Closed On</TableHead>
                        <TableHead className="text-white">Resulted On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((market) => (
                        <TableRow key={market.id} className="border-b border-[#334155]">
                          <TableCell className="font-medium">{market.name}</TableCell>
                          <TableCell>
                            <Badge className="bg-primary font-bold text-white">
                              {market.result}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(market.closingTime), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            {market.resultDeclaredAt 
                              ? format(new Date(market.resultDeclaredAt), 'dd/MM/yyyy HH:mm')
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 bg-[#1e293b] rounded-lg">
              <p className="text-gray-400">No results available yet.</p>
              <p className="text-gray-500 text-sm mt-2">Check back after markets close.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
