
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/transactions`],
  });

  const filteredTransactions = transactions?.filter((transaction) => {
    const matchesFilter = filter === "all" || transaction.type === filter;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTotalBalance = () => {
    if (!transactions) return 0;
    return transactions.reduce((acc, curr) => {
      return acc + (curr.type === 'credit' ? curr.amount : -curr.amount);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-semibold mb-4 md:mb-0">Transaction History</h2>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs bg-[#1e293b] border-[#334155]"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] bg-[#1e293b] border-[#334155]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="credit">Credits Only</SelectItem>
                <SelectItem value="debit">Debits Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-[#1e293b] border-[#334155]">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{getTotalBalance().toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
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
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-b border-[#334155]">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.type === 'credit' ? (
                              <ArrowDownLeft className="w-4 h-4 text-green-500" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-red-500" />
                            )}
                            {transaction.type}
                          </div>
                        </TableCell>
                        <TableCell className={transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
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
