
import Header from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-[#e2e8f0]">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400">Configure game and payment settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>Minimum Bet Amount</Label>
                  <Input type="number" defaultValue={settings?.minBet} />
                </div>
                <div>
                  <Label>Maximum Bet Amount</Label>
                  <Input type="number" defaultValue={settings?.maxBet} />
                </div>
                <div>
                  <Label>Default Win Odds</Label>
                  <Input type="number" step="0.1" defaultValue={settings?.defaultOdds} />
                </div>
                <Button className="w-full">Save Game Settings</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label>UPI Payment Details</Label>
                  <Textarea defaultValue={settings?.upiDetails} />
                </div>
                <div>
                  <Label>Bank Account Details</Label>
                  <Textarea defaultValue={settings?.bankDetails} />
                </div>
                <Button className="w-full">Save Payment Settings</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
