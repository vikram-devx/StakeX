
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, History, LogOut } from "lucide-react";

export default function UserMenu() {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/auth');
  };

  // Generate user initials from username
  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')}>
        Login
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center text-white p-0 hover:bg-transparent">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-[#ec4899] flex items-center justify-center">
            <span className="text-white font-semibold">{getUserInitials(user.username)}</span>
          </div>
          <span className="hidden md:block ml-2 font-medium">{user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#334155] text-white border-[#475569]">
        <DropdownMenuItem 
          className="flex items-center cursor-pointer hover:bg-[#1e293b]"
          onClick={() => navigate('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center cursor-pointer hover:bg-[#1e293b]"
          onClick={() => navigate('/my-bets')}
        >
          <History className="mr-2 h-4 w-4" />
          <span>Transaction History</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#475569]" />
        <DropdownMenuItem 
          className="flex items-center text-[#ef4444] cursor-pointer hover:bg-[#1e293b]"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
