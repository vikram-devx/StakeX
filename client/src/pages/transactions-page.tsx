
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/transactions`],
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-4">My Transactions</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions && transactions.length > 0 ? (
          <Card className="bg-[#1e293b] border-[#334155] text-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#334155]">
                    <TableRow>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Description</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-b border-[#334155]">
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell className={transaction.type === 'credit' ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Badge className={transaction.status === 'completed' ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 bg-[#1e293b] rounded-lg">
            <p className="text-gray-400">No transactions found.</p>
          </div>
        )}
      </main>
    </div>
  );
}
