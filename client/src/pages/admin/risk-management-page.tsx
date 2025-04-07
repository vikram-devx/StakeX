
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Chart } from "@/components/ui/chart";

export default function RiskManagementPage() {
  const { data: riskMetrics, isLoading } = useQuery({
    queryKey: ["/api/risk-metrics"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Risk Management</h1>
          <p className="text-gray-400">Monitor betting patterns and risk metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-[#1e293b] border-[#334155]">
            <CardHeader>
              <CardTitle>Active Bets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {riskMetrics?.activeBets || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-[#334155]">
            <CardHeader>
              <CardTitle>Potential Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-500">
                ₹{riskMetrics?.potentialLiability || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-[#334155]">
            <CardHeader>
              <CardTitle>High Risk Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-500">
                {riskMetrics?.highRiskUsers || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#1e293b] border-[#334155]">
            <CardHeader>
              <CardTitle>Top Betters</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">User</TableHead>
                    <TableHead className="text-white">Total Bets</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskMetrics?.topBetters?.map((better) => (
                    <TableRow key={better.id}>
                      <TableCell>{better.username}</TableCell>
                      <TableCell>{better.totalBets}</TableCell>
                      <TableCell>₹{better.totalAmount}</TableCell>
                      <TableCell>
                        <Badge variant={better.riskLevel === 'high' ? 'destructive' : 'default'}>
                          {better.riskLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-[#334155]">
            <CardHeader>
              <CardTitle>Most Bet Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Number</TableHead>
                    <TableHead className="text-white">Total Bets</TableHead>
                    <TableHead className="text-white">Total Amount</TableHead>
                    <TableHead className="text-white">Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskMetrics?.popularNumbers?.map((number) => (
                    <TableRow key={number.value}>
                      <TableCell>{number.value}</TableCell>
                      <TableCell>{number.totalBets}</TableCell>
                      <TableCell>₹{number.totalAmount}</TableCell>
                      <TableCell>
                        <Badge variant={number.riskLevel === 'high' ? 'destructive' : 'default'}>
                          {number.riskLevel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
