import { Link } from "wouter";
import { ThreadWithRelations } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown, MessageSquare, Eye, Bookmark } from "lucide-react";

type ThreadItemProps = {
  thread: ThreadWithRelations;
};

export default function ThreadItem({ thread }: ThreadItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mutation for voting on thread
  const voteMutation = useMutation({
    mutationFn: async ({ threadId, isUpvote }: { threadId: number; isUpvote: boolean }) => {
      return apiRequest("POST", "/api/vote", { threadId, isUpvote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for bookmarking thread
  const bookmarkMutation = useMutation({
    mutationFn: async (threadId: number) => {
      return apiRequest("POST", "/api/bookmarks", { threadId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bookmark failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVote = (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return;
    }
    
    voteMutation.mutate({ threadId: thread.id, isUpvote });
  };

  const handleBookmark = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to bookmark",
        variant: "destructive",
      });
      return;
    }
    
    bookmarkMutation.mutate(thread.id);
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  const getCategoryStyle = (colorClass: string) => {
    switch (colorClass) {
      case 'bg-success':
        return 'bg-green-100 text-success';
      case 'bg-accent':
        return 'bg-blue-100 text-accent';
      case 'bg-error':
        return 'bg-red-100 text-error';
      case 'bg-secondary':
        return 'bg-gray-100 text-secondary';
      case 'bg-primary':
      default:
        return 'bg-indigo-100 text-primary';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex">
          {/* Voting buttons */}
          <div className="flex flex-col items-center mr-4">
            <button
              className="text-gray-400 hover:text-primary transition-colors"
              onClick={() => handleVote(true)}
            >
              <ChevronUp size={20} />
            </button>
            <span className="text-gray-900 font-medium my-1">{thread.votes}</span>
            <button
              className="text-gray-400 hover:text-gray-500 transition-colors"
              onClick={() => handleVote(false)}
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Thread content */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium ${getCategoryStyle(thread.category.colorClass)} rounded-full`}>
                {thread.category.name}
              </span>
              <span className="text-xs text-gray-500">Posted by</span>
              <Link href={`/user/${thread.author.id}`}>
                <a className="text-xs font-medium text-gray-900 hover:underline">
                  {thread.author.username}
                </a>
              </Link>
              <span className="text-xs text-gray-500">{formatDate(thread.createdAt)}</span>
            </div>

            <h3 className="mt-1 text-lg font-semibold text-gray-900 line-clamp-2">
              <Link href={`/thread/${thread.id}`}>
                <a className="hover:text-primary">{thread.title}</a>
              </Link>
            </h3>

            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {thread.content}
            </p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-2">
              {thread.tags?.map((tag) => (
                <Link key={tag.id} href={`/?tag=${tag.name}`}>
                  <a className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                    {tag.name}
                  </a>
                </Link>
              ))}
            </div>

            {/* Thread stats */}
            <div className="mt-3 flex items-center text-xs text-gray-500 space-x-4">
              <div className="flex items-center">
                <MessageSquare size={14} className="mr-1.5" />
                <span>{thread.commentCount} comments</span>
              </div>
              <div className="flex items-center">
                <Eye size={14} className="mr-1.5" />
                <span>{thread.viewCount} views</span>
              </div>
              <div className="flex items-center cursor-pointer" onClick={handleBookmark}>
                <Bookmark size={14} className="mr-1.5" />
                <span>{thread.bookmarkCount} bookmarks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
