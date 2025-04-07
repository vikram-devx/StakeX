import { useState } from "react";
import { Link } from "wouter";
import WalletIndicator from "@/components/wallet-indicator";
import UserMenu from "@/components/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#1e293b] px-4 py-3 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-white cursor-pointer">
              <span className="text-primary">S</span>take<span className="text-[#ec4899]">X</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/markets">
            <span className="text-white hover:text-primary cursor-pointer">Markets</span>
          </Link>
          <Link href="/my-bets">
            <span className="text-white hover:text-primary cursor-pointer">My Bets</span>
          </Link>
          <Link href="/results">
            <span className="text-white hover:text-primary cursor-pointer">Results</span>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <span className="text-white hover:text-primary cursor-pointer">Admin</span>
            </Link>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white">
                <Menu />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#1e293b] text-white">
              <div className="flex flex-col space-y-4 mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-[#ec4899] flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {user?.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.username}</p>
                    <p className="text-gray-400 text-sm capitalize">{user?.role}</p>
                  </div>
                </div>
                <Link href="/markets" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-white hover:text-primary text-lg block py-2">Markets</span>
                </Link>
                <Link href="/my-bets" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-white hover:text-primary text-lg block py-2">My Bets</span>
                </Link>
                <Link href="/results" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-white hover:text-primary text-lg block py-2">Results</span>
                </Link>
                <Link href="/my-bets" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-white hover:text-primary text-lg block py-2">Transactions</span>
                </Link>
                {user?.role === "admin" && (
                  <>
                    <div className="my-2 border-t border-gray-700" />
                    <span className="text-gray-400 text-sm px-2">Admin</span>
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-white hover:text-primary text-lg block py-2">Dashboard</span>
                    </Link>
                    <Link href="/admin/users" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-white hover:text-primary text-lg block py-2">Users</span>
                    </Link>
                    <Link href="/admin/settings" onClick={() => setMobileMenuOpen(false)}>
                      <span className="text-white hover:text-primary text-lg block py-2">Settings</span>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
