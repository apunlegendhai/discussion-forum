import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BellIcon, SearchIcon, MenuIcon } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "All Threads", path: "/threads" },
    { name: "Categories", path: "/categories" },
    { name: "About", path: "/about" },
  ];

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <h1 className="text-xl font-bold text-primary cursor-pointer">ForumClone</h1>
              </Link>
            </div>
            {/* Desktop navigation */}
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8" aria-label="Main Navigation">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`${
                      isActive(item.path)
                        ? "border-primary text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <MenuIcon className="block h-6 w-6" />
            </button>
          </div>

          {/* Search and user menu */}
          <div className="hidden sm:flex items-center">
            <div className="flex-shrink-0">
              {/* Search */}
              <div className="relative w-64 md:w-80">
                <Input 
                  type="text" 
                  placeholder="Search threads..." 
                  className="pl-10 pr-3 py-2"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* User menu */}
            <div className="ml-4 flex items-center md:ml-6">
              {/* Create new post button */}
              <Link href={user ? "/thread/new" : "/auth"}>
                <Button className="bg-primary text-white hover:bg-accent">
                  New Post
                </Button>
              </Link>

              {/* Notifications */}
              <button
                type="button"
                className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              {user ? (
                <div className="ml-3 relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <span className="sr-only">Open user menu</span>
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.username} />
                          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Link href="/settings">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => logoutMutation.mutate()}
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="ml-3">
                  <Link href="/auth">
                    <Button variant="outline">Login</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`${
                    isActive(item.path)
                      ? "bg-neutral border-primary text-gray-900"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  {item.name}
                </a>
              </Link>
            ))}
            {/* Mobile search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search threads..." 
                  className="pl-10 pr-3 py-2 w-full"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            {/* Mobile new post button */}
            <div className="px-3 py-2">
              <Link href={user ? "/thread/new" : "/auth"}>
                <Button className="bg-primary text-white hover:bg-accent w-full">
                  New Post
                </Button>
              </Link>
            </div>
            {!user && (
              <div className="px-3 py-2">
                <Link href="/auth">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
