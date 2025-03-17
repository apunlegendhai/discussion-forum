import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import ThreadItem from "@/components/ui/thread-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThreadWithRelations } from "@shared/schema";

export default function HomePage() {
  const [location] = useLocation();
  const [filter, setFilter] = useState("latest");
  const [timeframe, setTimeframe] = useState("all");
  const [page, setPage] = useState(1);
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const categoryId = urlParams.get("categoryId");
  const tag = urlParams.get("tag");
  
  // Construct the query key
  const queryKey = ["/api/threads", { filter, categoryId, tag, page, timeframe }];
  
  // Fetch threads
  const { data: threads, isLoading, isError } = useQuery<ThreadWithRelations[]>({
    queryKey,
  });

  // Handler for changing the filter
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when changing filter
  };
  
  // Handler for changing the timeframe
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    setPage(1); // Reset to first page when changing timeframe
  };
  
  // Handler for pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Content header with breadcrumbs */}
          <div className="px-4 py-2 sm:px-0">
            <div className="flex items-center text-sm text-gray-500">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
              <a href="/threads" className="hover:text-primary">All Threads</a>
              <span className="mx-2">/</span>
              <span className="text-gray-700 font-medium">Latest Discussions</span>
            </div>
          </div>
          
          {/* Main three-column layout */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left sidebar with categories */}
            <div className="lg:col-span-2">
              <Sidebar type="left" />
            </div>
            
            {/* Main content area with threads */}
            <div className="lg:col-span-7">
              {/* Thread filter options */}
              <div className="bg-white rounded-lg shadow p-4 mb-5">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant={filter === "latest" ? "default" : "ghost"}
                      onClick={() => handleFilterChange("latest")}
                      className={filter === "latest" ? "bg-primary text-white" : "text-gray-600"}
                    >
                      Latest
                    </Button>
                    <Button
                      variant={filter === "popular" ? "default" : "ghost"}
                      onClick={() => handleFilterChange("popular")}
                      className={filter === "popular" ? "bg-primary text-white" : "text-gray-600"}
                    >
                      Popular
                    </Button>
                    <Button
                      variant={filter === "unanswered" ? "default" : "ghost"}
                      onClick={() => handleFilterChange("unanswered")}
                      className={filter === "unanswered" ? "bg-primary text-white" : "text-gray-600"}
                    >
                      Unanswered
                    </Button>
                  </div>
                  <div className="flex space-x-2 mt-2 sm:mt-0">
                    <Select value={timeframe} onValueChange={handleTimeframeChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Thread list */}
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeletons
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-4">
                      <div className="flex">
                        <div className="w-10 flex flex-col items-center mr-4">
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <Skeleton className="h-5 w-8 my-1" />
                          <Skeleton className="h-5 w-5 rounded-full" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-6 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4 mb-3" />
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="flex space-x-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : isError ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-red-500">Failed to load threads. Please try again later.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => window.location.reload()}
                    >
                      Refresh
                    </Button>
                  </div>
                ) : threads?.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500">No threads found.</p>
                    <p className="text-gray-500 mt-2">Be the first to start a conversation!</p>
                  </div>
                ) : (
                  // Render thread list
                  threads?.map((thread) => (
                    <ThreadItem key={thread.id} thread={thread} />
                  ))
                )}
                
                {/* Pagination */}
                {!isLoading && threads && threads.length > 0 && (
                  <div className="flex items-center justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="hidden sm:flex sm:items-center sm:space-x-1">
                      {Array.from({ length: 5 }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={i}
                            variant={page === pageNum ? "default" : "outline"}
                            onClick={() => handlePageChange(pageNum)}
                            className={
                              page === pageNum
                                ? "bg-primary text-white"
                                : "text-gray-700"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {/* Show ellipsis if there might be more pages */}
                      <span className="px-3 py-1.5 text-gray-700">...</span>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(8)}
                        className="text-gray-700"
                      >
                        8
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right sidebar */}
            <div className="lg:col-span-3">
              <Sidebar type="right" />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
