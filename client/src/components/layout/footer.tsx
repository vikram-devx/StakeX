import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#1e293b] py-4 text-center text-gray-400 text-sm">
      <div className="container mx-auto px-4">
        <p>© {new Date().getFullYear()} StakeX Gaming. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/terms">
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
          </Link>
          <Link href="/privacy">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          </Link>
          <Link href="/responsible-gaming">
            <span className="hover:text-white cursor-pointer">Responsible Gaming</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
