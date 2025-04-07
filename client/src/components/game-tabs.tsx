import { Link } from "wouter";

interface GameTabsProps {
  activeTab: "markets" | "team-matches" | "my-bets" | "results";
}

export default function GameTabs({ activeTab }: GameTabsProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-700">
        <nav className="flex -mb-px">
          <Link href="/markets">
            <a className={`mr-8 py-4 px-1 text-sm font-medium ${
              activeTab === "markets" 
                ? "text-primary border-b-2 border-primary" 
                : "text-gray-400 hover:text-gray-300"
            }`}>
              Markets
            </a>
          </Link>
          <Link href="/team-matches">
            <a className={`mr-8 py-4 px-1 text-sm font-medium ${
              activeTab === "team-matches" 
                ? "text-primary border-b-2 border-primary" 
                : "text-gray-400 hover:text-gray-300"
            }`}>
              Team Matches
            </a>
          </Link>
          <Link href="/my-bets">
            <a className={`mr-8 py-4 px-1 text-sm font-medium ${
              activeTab === "my-bets" 
                ? "text-primary border-b-2 border-primary" 
                : "text-gray-400 hover:text-gray-300"
            }`}>
              My Bets
            </a>
          </Link>
          <Link href="/results">
            <a className={`mr-8 py-4 px-1 text-sm font-medium ${
              activeTab === "results" 
                ? "text-primary border-b-2 border-primary" 
                : "text-gray-400 hover:text-gray-300"
            }`}>
              Results
            </a>
          </Link>
        </nav>
      </div>
    </div>
  );
}
