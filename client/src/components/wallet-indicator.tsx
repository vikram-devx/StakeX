import { Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function WalletIndicator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center bg-[#334155] rounded-full px-3 py-1">
        <Loader2 className="h-4 w-4 animate-spin mr-1 text-primary" />
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Format the balance with commas
  const formattedBalance = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(user.balance));

  return (
    <div className="flex items-center bg-[#334155] rounded-full px-3 py-1">
      <Wallet className="h-4 w-4 text-[#22c55e] mr-1" />
      <span className="text-sm text-gray-400">{formattedBalance}</span>
    </div>
  );
}
