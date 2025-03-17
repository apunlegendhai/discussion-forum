import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Category, Tag } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

type SidebarProps = {
  type: "left" | "right";
};

export default function Sidebar({ type }: SidebarProps) {
  const { user } = useAuth();

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch tags
  const { data: tags, isLoading: tagsLoading } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  // Fetch user stats
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ["/api/user-stats"],
    enabled: !!user,
  });

  // Fetch trending threads
  const { data: trendingThreads, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/trending"],
  });

  // Fetch community stats
  const { data: communityStats, isLoading: communityStatsLoading } = useQuery({
    queryKey: ["/api/community-stats"],
  });

  if (type === "left") {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Categories</h2>
        <nav className="space-y-2">
          {categoriesLoading ? (
            <>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </>
          ) : (
            categories?.map((category) => (
              <Link key={category.id} href={`/?categoryId=${category.id}`}>
                <a className="flex items-center text-gray-600 hover:text-primary hover:bg-gray-50 px-2 py-2 rounded-md group">
                  <span className={`w-2 h-2 ${category.colorClass} rounded-full mr-2`}></span>
                  <span>{category.name}</span>
                  <span className="ml-auto text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-1">
                    {category.threadCount}
                  </span>
                </a>
              </Link>
            ))
          )}
        </nav>

        <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Popular Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tagsLoading ? (
            <>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-6 w-18" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-16" />
            </>
          ) : (
            tags?.map((tag) => (
              <Link key={tag.id} href={`/?tag=${tag.name}`}>
                <a className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                  {tag.name}
                </a>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* User stats card */}
      {user && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Activity</h2>
          <div className="space-y-3">
            {userStatsLoading ? (
              <>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Threads created</span>
                  <span className="text-sm font-medium text-gray-900">{userStats?.threadsCreated || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Comments posted</span>
                  <span className="text-sm font-medium text-gray-900">{userStats?.commentsPosted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Upvotes received</span>
                  <span className="text-sm font-medium text-gray-900">{userStats?.upvotesReceived || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days active</span>
                  <span className="text-sm font-medium text-gray-900">{userStats?.daysActive || 1}</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <Link href="/profile">
              <a className="text-primary text-sm font-medium hover:text-accent">View your profile →</a>
            </Link>
          </div>
        </div>
      )}

      {/* Trending threads */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Trending</h2>
        <div className="space-y-4">
          {trendingLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            trendingThreads?.map((thread) => (
              <div key={thread.id} className="group">
                <Link href={`/thread/${thread.id}`}>
                  <a className="text-sm font-medium text-gray-900 group-hover:text-primary line-clamp-2">
                    {thread.title}
                  </a>
                </Link>
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <span>{thread.commentCount} comments</span>
                  <span className="mx-1.5">•</span>
                  <span>trending in</span>
                  <Link href={`/?categoryId=${thread.category.id}`}>
                    <a className="ml-1 text-primary hover:underline">{thread.category.name}</a>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Link href="/trending">
            <a className="text-primary text-sm font-medium hover:text-accent">View all trending →</a>
          </Link>
        </div>
      </div>

      {/* Community stats */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Community Stats</h2>
        <div className="space-y-3">
          {communityStatsLoading ? (
            <>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Members</span>
                <span className="text-sm font-medium text-gray-900">{communityStats?.memberCount.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Threads</span>
                <span className="text-sm font-medium text-gray-900">{communityStats?.threadCount.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Comments</span>
                <span className="text-sm font-medium text-gray-900">{communityStats?.commentCount.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Online now</span>
                <span className="text-sm font-medium text-green-500">{communityStats?.onlineCount || 0}</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Link href="/guidelines">
            <a className="text-primary text-sm font-medium hover:text-accent">Community guidelines →</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
