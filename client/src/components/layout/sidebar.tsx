import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  BarChartHorizontal,
  Clock,
  CheckSquare,
  Settings,
  LogOut,
  Users,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  external?: boolean;
}

const SidebarNavItem = ({
  href,
  icon,
  title,
  active,
  external,
}: SidebarNavItemProps) => {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-gray-50",
          active && "bg-primary/10 text-primary font-medium"
        )}
      >
        {icon}
        <span>{title}</span>
      </a>
    );
  }

  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-gray-50",
          active && "bg-primary/10 text-primary font-medium"
        )}
      >
        {icon}
        <span>{title}</span>
      </a>
    </Link>
  );
};

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    return location === path;
  };

  if (!user) return null;

  return (
    <aside
      className={cn(
        "bg-[#1e293b] w-64 flex-shrink-0 border-r border-[#334155] hidden md:flex md:flex-col",
        className
      )}
    >
      <div className="p-4">
        <Link href="/">
          <a className="flex items-center gap-2 py-4">
            <h2 className="text-2xl font-bold text-white">
              <span className="text-primary">S</span>take
              <span className="text-[#ec4899]">X</span>
            </h2>
          </a>
        </Link>
      </div>
      <ScrollArea className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <SidebarNavItem
            href="/"
            icon={<Home className="w-5 h-5" />}
            title="Home"
            active={isActive("/")}
          />
          <SidebarNavItem
            href="/markets"
            icon={<BarChartHorizontal className="w-5 h-5" />}
            title="Markets"
            active={isActive("/markets")}
          />
          <SidebarNavItem
            href="/my-bets"
            icon={<Clock className="w-5 h-5" />}
            title="My Bets"
            active={isActive("/my-bets")}
          />
          <SidebarNavItem
            href="/results"
            icon={<CheckSquare className="w-5 h-5" />}
            title="Results"
            active={isActive("/results")}
          />
          
          {user.role === "admin" && (
            <>
              <Separator className="my-4 bg-[#334155]" />
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold uppercase text-gray-400">
                  Admin
                </h3>
              </div>
              <SidebarNavItem
                href="/admin"
                icon={<ShieldCheck className="w-5 h-5" />}
                title="Dashboard"
                active={isActive("/admin")}
              />
              <SidebarNavItem
                href="/admin/users"
                icon={<Users className="w-5 h-5" />}
                title="Users"
                active={isActive("/admin/users")}
              />
              <SidebarNavItem
                href="/admin/settings"
                icon={<Settings className="w-5 h-5" />}
                title="Settings"
                active={isActive("/admin/settings")}
              />
            </>
          )}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#334155]"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
        <div className="mt-4 px-3 py-2 rounded-lg bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-[#ec4899] flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.username.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-gray-400">
                Balance: ₹{Number(user.balance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
