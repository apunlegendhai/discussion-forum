import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
    <header className="bg-card shadow dark:border-b dark:border-border">
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
                <Link key={item.path} href={item.path} 
                  className={`${
                    isActive(item.path)
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Theme toggle */}
            <div className="ml-3">
              <ThemeToggle />
            </div>

            {/* User menu */}
            <div className="ml-4 flex items-center md:ml-6">
              {/* Create new post button */}
              <Link href={user ? "/thread/new" : "/auth"}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  New Post
                </Button>
              </Link>

              {/* Notifications */}
              <button
                type="button"
                className="ml-3 p-1 rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              {user ? (
                <div className="ml-3 relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="max-w-xs bg-card rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <span className="sr-only">Open user menu</span>
                        <Avatar>
                          <AvatarImage src={user.avatar || undefined} alt={user.username} />
                          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href="/profile">
                        <DropdownMenuItem className="cursor-pointer">
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/settings">
                        <DropdownMenuItem className="cursor-pointer">
                          Settings
                        </DropdownMenuItem>
                      </Link>
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
                <div className="ml-3 flex space-x-2">
                  <Link href="/auth?tab=register">
                    <Button variant="outline">Register</Button>
                  </Link>
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
              <Link key={item.path} href={item.path}
                className={`${
                  isActive(item.path)
                    ? "bg-muted border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:border-border hover:text-foreground"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                {item.name}
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
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            {/* Theme toggle in mobile menu */}
            <div className="px-3 py-2 flex justify-between items-center">
              <span className="text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            {/* Mobile new post button */}
            <div className="px-3 py-2">
              <Link href={user ? "/thread/new" : "/auth"}>
                <Button className="bg-primary text-white hover:bg-primary/90 w-full">
                  New Post
                </Button>
              </Link>
            </div>
            {!user && (
              <div className="px-3 py-2 space-y-2">
                <Link href="/auth?tab=register">
                  <Button variant="outline" className="w-full">Register</Button>
                </Link>
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
