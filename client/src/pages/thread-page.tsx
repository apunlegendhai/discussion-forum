import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertThreadSchema, insertCommentSchema } from "@shared/schema";
import { ChevronUp, ChevronDown, MessageSquare, Eye, Bookmark } from "lucide-react";

type ThreadPageProps = {
  isNewThread?: boolean;
};

export default function ThreadPage({ isNewThread = false }: ThreadPageProps) {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch thread details
  const { 
    data: thread, 
    isLoading: threadLoading, 
    isError: threadError 
  } = useQuery({
    queryKey: [`/api/threads/${id}`],
    enabled: !isNewThread && !!id,
  });
  
  // Fetch comments
  const { 
    data: comments, 
    isLoading: commentsLoading, 
    isError: commentsError 
  } = useQuery({
    queryKey: [`/api/threads/${id}/comments`],
    enabled: !isNewThread && !!id,
  });
  
  // Fetch categories for new thread form
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isNewThread,
  });

  // Create thread form schema
  const createThreadSchema = insertThreadSchema.extend({
    tags: z.string().transform(tags => tags.split(',').map(tag => tag.trim())),
  });

  // Create thread form
  const createThreadForm = useForm<z.infer<typeof createThreadSchema>>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: "",
      tags: "",
    },
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createThreadSchema>) => {
      const res = await apiRequest("POST", "/api/threads", data);
      return await res.json();
    },
    onSuccess: (newThread) => {
      toast({
        title: "Thread created",
        description: "Your thread has been successfully created!",
      });
      navigate(`/thread/${newThread.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating thread",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Comment form schema
  const commentSchema = insertCommentSchema.pick({ content: true });

  // Comment form
  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof commentSchema>) => {
      const res = await apiRequest("POST", `/api/threads/${id}/comments`, data);
      return await res.json();
    },
    onSuccess: () => {
      commentForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${id}`] });
      toast({
        title: "Comment added",
        description: "Your comment has been successfully added!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ 
      threadId, 
      commentId, 
      isUpvote 
    }: { 
      threadId?: number; 
      commentId?: number; 
      isUpvote: boolean;
    }) => {
      return apiRequest("POST", "/api/vote", { threadId, commentId, isUpvote });
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: [`/api/threads/${id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/threads/${id}/comments`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (threadId: number) => {
      return apiRequest("POST", "/api/bookmarks", { threadId });
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: [`/api/threads/${id}`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Bookmark failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle vote on thread
  const handleThreadVote = (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return;
    }
    
    voteMutation.mutate({ threadId: Number(id), isUpvote });
  };

  // Handle vote on comment
  const handleCommentVote = (commentId: number, isUpvote: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return;
    }
    
    voteMutation.mutate({ commentId, isUpvote });
  };

  // Handle bookmark thread
  const handleBookmarkThread = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to bookmark",
        variant: "destructive",
      });
      return;
    }
    
    bookmarkMutation.mutate(Number(id));
  };

  // Handle thread creation submission
  const onCreateThreadSubmit = (values: z.infer<typeof createThreadSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to create a thread",
        variant: "destructive",
      });
      return;
    }

    createThreadMutation.mutate(values);
  };

  // Handle comment submission
  const onCommentSubmit = (values: z.infer<typeof commentSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to add a comment",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(values);
  };

  // Format date helper
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Get category style
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

  // Redirect if not authenticated and trying to create new thread
  useEffect(() => {
    if (isNewThread && !user) {
      navigate('/auth');
    }
  }, [isNewThread, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Content header with breadcrumbs */}
          <div className="px-4 py-2 sm:px-0">
            <div className="flex items-center text-sm text-gray-500">
              <Link href="/">
                <a className="hover:text-primary">Home</a>
              </Link>
              <span className="mx-2">/</span>
              <Link href="/threads">
                <a className="hover:text-primary">All Threads</a>
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700 font-medium">
                {isNewThread ? "Create New Thread" : thread?.title || "Thread"}
              </span>
            </div>
          </div>
          
          {/* Main three-column layout */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left sidebar with categories */}
            <div className="lg:col-span-2">
              <Sidebar type="left" />
            </div>
            
            {/* Main content area */}
            <div className="lg:col-span-7">
              {isNewThread ? (
                /* New Thread Form */
                <div className="bg-white rounded-lg shadow p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Thread</h1>
                  
                  <Form {...createThreadForm}>
                    <form onSubmit={createThreadForm.handleSubmit(onCreateThreadSubmit)} className="space-y-6">
                      <FormField
                        control={createThreadForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Thread Title" 
                                className="text-lg font-semibold"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createThreadForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem 
                                    key={category.id} 
                                    value={category.id.toString()}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createThreadForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Write your thread content here..." 
                                className="min-h-[200px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createThreadForm.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Add tags (comma separated, e.g. javascript, react, web)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(-1)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-primary text-white"
                          disabled={createThreadMutation.isPending}
                        >
                          {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              ) : (
                /* Thread View */
                <>
                  {/* Thread details */}
                  {threadLoading ? (
                    <div className="bg-white rounded-lg shadow p-6">
                      <Skeleton className="h-8 w-3/4 mb-4" />
                      <div className="flex items-center mb-4">
                        <Skeleton className="h-6 w-24 rounded-full mr-3" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  ) : threadError ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                      <p className="text-red-500">Failed to load thread. Please try again later.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.reload()}
                      >
                        Refresh
                      </Button>
                    </div>
                  ) : thread ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-6">
                        <div className="flex">
                          {/* Voting buttons */}
                          <div className="flex flex-col items-center mr-4">
                            <button
                              className="text-gray-400 hover:text-primary transition-colors"
                              onClick={() => handleThreadVote(true)}
                            >
                              <ChevronUp size={24} />
                            </button>
                            <span className="text-gray-900 font-medium my-1 text-lg">{thread.votes}</span>
                            <button
                              className="text-gray-400 hover:text-gray-500 transition-colors"
                              onClick={() => handleThreadVote(false)}
                            >
                              <ChevronDown size={24} />
                            </button>
                          </div>
                          
                          {/* Thread content */}
                          <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{thread.title}</h1>
                            
                            <div className="flex items-center space-x-2 mb-4">
                              <span className={`px-2 py-1 text-xs font-medium ${getCategoryStyle(thread.category.colorClass)} rounded-full`}>
                                {thread.category.name}
                              </span>
                              <span className="text-xs text-gray-500">Posted by</span>
                              <Link href={`/user/${thread.author.id}`}>
                                <a className="text-xs font-medium text-gray-900 hover:underline flex items-center">
                                  <Avatar className="h-5 w-5 mr-1">
                                    <AvatarImage src={thread.author.avatar} alt={thread.author.username} />
                                    <AvatarFallback>{thread.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  {thread.author.username}
                                </a>
                              </Link>
                              <span className="text-xs text-gray-500">{formatDate(thread.createdAt)}</span>
                            </div>
                            
                            <div className="text-gray-700 mb-6 whitespace-pre-line">
                              {thread.content}
                            </div>
                            
                            {/* Tags */}
                            {thread.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {thread.tags.map((tag) => (
                                  <Link key={tag.id} href={`/?tag=${tag.name}`}>
                                    <a className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                                      {tag.name}
                                    </a>
                                  </Link>
                                ))}
                              </div>
                            )}
                            
                            {/* Thread stats */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-500 space-x-4">
                              <div className="flex items-center">
                                <MessageSquare size={14} className="mr-1.5" />
                                <span>{thread.commentCount} comments</span>
                              </div>
                              <div className="flex items-center">
                                <Eye size={14} className="mr-1.5" />
                                <span>{thread.viewCount} views</span>
                              </div>
                              <div 
                                className="flex items-center cursor-pointer" 
                                onClick={handleBookmarkThread}
                              >
                                <Bookmark size={14} className="mr-1.5" />
                                <span>{thread.bookmarkCount} bookmarks</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Comment form */}
                  {user && (
                    <div className="bg-white rounded-lg shadow p-6 mt-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a Comment</h2>
                      
                      <Form {...commentForm}>
                        <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-4">
                          <FormField
                            control={commentForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Write your comment here..." 
                                    className="min-h-[100px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit"
                              className="bg-primary text-white"
                              disabled={addCommentMutation.isPending}
                            >
                              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                  
                  {/* Comments */}
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Comments ({thread?.commentCount || 0})
                    </h2>
                    
                    {commentsLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-4 mb-4">
                          <div className="flex">
                            <div className="w-10 flex flex-col items-center mr-4">
                              <Skeleton className="h-4 w-4 rounded-full" />
                              <Skeleton className="h-5 w-6 my-1" />
                              <Skeleton className="h-4 w-4 rounded-full" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <Skeleton className="h-6 w-6 rounded-full mr-2" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16 ml-2" />
                              </div>
                              <Skeleton className="h-4 w-full mb-1" />
                              <Skeleton className="h-4 w-full mb-1" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : commentsError ? (
                      <div className="bg-white rounded-lg shadow p-6 text-center">
                        <p className="text-red-500">Failed to load comments. Please try again later.</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => window.location.reload()}
                        >
                          Refresh
                        </Button>
                      </div>
                    ) : comments && comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex">
                              {/* Voting buttons */}
                              <div className="flex flex-col items-center mr-4">
                                <button
                                  className="text-gray-400 hover:text-primary transition-colors"
                                  onClick={() => handleCommentVote(comment.id, true)}
                                >
                                  <ChevronUp size={18} />
                                </button>
                                <span className="text-gray-900 font-medium my-1">{comment.votes}</span>
                                <button
                                  className="text-gray-400 hover:text-gray-500 transition-colors"
                                  onClick={() => handleCommentVote(comment.id, false)}
                                >
                                  <ChevronDown size={18} />
                                </button>
                              </div>
                              
                              {/* Comment content */}
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src={comment.author.avatar} alt={comment.author.username} />
                                    <AvatarFallback>{comment.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <Link href={`/user/${comment.author.id}`}>
                                    <a className="text-sm font-medium text-gray-900 hover:underline">
                                      {comment.author.username}
                                    </a>
                                  </Link>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                
                                <div className="text-sm text-gray-700 whitespace-pre-line">
                                  {comment.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow p-6 text-center">
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                        {!user && (
                          <Link href="/auth">
                            <Button className="mt-4 bg-primary text-white">
                              Sign in to comment
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
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
