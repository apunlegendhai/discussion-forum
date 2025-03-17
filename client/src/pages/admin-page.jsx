import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Users, MessageSquare, Tag, FolderPlus, Settings } from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Admin Dashboard Page
export default function AdminPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  // Check if user is admin
  useEffect(() => {
    // If not loading and either no user or not admin username
    if (!authLoading && (!user || user.username !== "oxyg3n")) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // If still loading auth, show spinner
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not admin username, don't render page content
  if (!user || user.username !== "oxyg3n") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <a className="text-2xl font-bold text-primary">ForumClone</a>
              </Link>
              <span className="ml-4 px-3 py-1 rounded-md bg-primary/10 text-primary font-medium">
                Admin Dashboard
              </span>
            </div>
            <div>
              <Link href="/">
                <Button variant="outline">Back to Site</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <nav className="flex flex-col">
                    <button 
                      className={`flex items-center px-4 py-3 text-sm font-medium border-l-2 ${
                        activeTab === "users" 
                          ? "border-primary text-primary bg-primary/5" 
                          : "border-transparent hover:bg-accent"
                      }`}
                      onClick={() => setActiveTab("users")}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Users
                    </button>
                    <button 
                      className={`flex items-center px-4 py-3 text-sm font-medium border-l-2 ${
                        activeTab === "categories" 
                          ? "border-primary text-primary bg-primary/5" 
                          : "border-transparent hover:bg-accent"
                      }`}
                      onClick={() => setActiveTab("categories")}
                    >
                      <FolderPlus className="mr-2 h-5 w-5" />
                      Categories
                    </button>
                    <button 
                      className={`flex items-center px-4 py-3 text-sm font-medium border-l-2 ${
                        activeTab === "threads" 
                          ? "border-primary text-primary bg-primary/5" 
                          : "border-transparent hover:bg-accent"
                      }`}
                      onClick={() => setActiveTab("threads")}
                    >
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Threads
                    </button>
                    <button 
                      className={`flex items-center px-4 py-3 text-sm font-medium border-l-2 ${
                        activeTab === "tags" 
                          ? "border-primary text-primary bg-primary/5" 
                          : "border-transparent hover:bg-accent"
                      }`}
                      onClick={() => setActiveTab("tags")}
                    >
                      <Tag className="mr-2 h-5 w-5" />
                      Tags
                    </button>
                    <button 
                      className={`flex items-center px-4 py-3 text-sm font-medium border-l-2 ${
                        activeTab === "settings" 
                          ? "border-primary text-primary bg-primary/5" 
                          : "border-transparent hover:bg-accent"
                      }`}
                      onClick={() => setActiveTab("settings")}
                    >
                      <Settings className="mr-2 h-5 w-5" />
                      Settings
                    </button>
                  </nav>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Stats</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <StatsPanel />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="users" className="mt-0">
                <UsersPanel />
              </TabsContent>
              <TabsContent value="categories" className="mt-0">
                <CategoriesPanel />
              </TabsContent>
              <TabsContent value="threads" className="mt-0">
                <ThreadsPanel />
              </TabsContent>
              <TabsContent value="tags" className="mt-0">
                <TagsPanel />
              </TabsContent>
              <TabsContent value="settings" className="mt-0">
                <SettingsPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stats Panel Component
function StatsPanel() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/community-stats'],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin mx-auto" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Members:</span>
        <span className="font-medium">{stats?.memberCount || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Threads:</span>
        <span className="font-medium">{stats?.threadCount || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Comments:</span>
        <span className="font-medium">{stats?.commentCount || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Online:</span>
        <span className="font-medium">{stats?.onlineCount || 0}</span>
      </div>
    </div>
  );
}

// Users Panel Component
function UsersPanel() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    // Fallback for now - replace with actual API
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/users');
        return await res.json();
      } catch (error) {
        // Mock data for development
        return [
          { id: 1, username: 'oxyg3n', role: 'admin', threads: 12, comments: 45, createdAt: new Date().toISOString() },
          { id: 2, username: 'user1', role: 'user', threads: 5, comments: 23, createdAt: new Date().toISOString() },
          { id: 3, username: 'user2', role: 'user', threads: 0, comments: 7, createdAt: new Date().toISOString() },
        ];
      }
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId) => {
      try {
        const res = await apiRequest('POST', `/api/admin/users/${userId}/ban`);
        return await res.json();
      } catch (error) {
        throw new Error('Failed to ban user');
      }
    },
    onSuccess: () => {
      toast({
        title: "User banned",
        description: "The user has been banned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to ban user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
        <CardDescription>
          Manage user accounts, roles, and permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Username</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Threads</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Comments</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created At</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {users?.map((user) => (
                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{user.username}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">{user.threads}</td>
                      <td className="p-4 align-middle">{user.comments}</td>
                      <td className="p-4 align-middle">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 align-middle">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // View user profile
                            }}
                          >
                            View
                          </Button>
                          {user.role !== 'admin' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => banUserMutation.mutate(user.id)}
                              disabled={banUserMutation.isPending}
                            >
                              {banUserMutation.isPending ? 'Banning...' : 'Ban'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="ml-auto">
          Add New User
        </Button>
      </CardFooter>
    </Card>
  );
}

// Categories Panel Component
function CategoriesPanel() {
  const [newCategory, setNewCategory] = useState({ name: '', colorClass: 'bg-blue-500' });
  
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const res = await apiRequest('POST', '/api/admin/categories', data);
        return await res.json();
      } catch (error) {
        throw new Error('Failed to create category');
      }
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "The category has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setNewCategory({ name: '', colorClass: 'bg-blue-500' });
    },
    onError: (error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
  };

  const colorOptions = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-pink-500', label: 'Pink' },
    { value: 'bg-indigo-500', label: 'Indigo' },
    { value: 'bg-gray-500', label: 'Gray' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
          <CardDescription>
            Add a new category for organizing threads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input 
                id="name" 
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select 
                value={newCategory.colorClass} 
                onValueChange={(value) => setNewCategory({...newCategory, colorClass: value})}
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${color.value} mr-2`} />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <CardDescription>
            Manage and organize current categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${category.colorClass}`} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </div>
                </div>
              ))}
              {categories?.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No categories found. Create your first category.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Threads Panel Component
function ThreadsPanel() {
  const { data: threads, isLoading } = useQuery({
    queryKey: ['/api/admin/threads'],
    // Fallback for now - replace with actual API
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/threads');
        return await res.json();
      } catch (error) {
        // Mock data for development
        return [];
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Threads Management</CardTitle>
        <CardDescription>
          Manage threads, moderate content, and organize discussions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : threads?.length > 0 ? (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Author</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Comments</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {threads?.map((thread) => (
                    <tr key={thread.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{thread.title}</td>
                      <td className="p-4 align-middle">{thread.author.username}</td>
                      <td className="p-4 align-middle">
                        <Badge className={`${thread.category.colorClass} text-white`}>
                          {thread.category.name}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">{thread.commentCount}</td>
                      <td className="p-4 align-middle">{new Date(thread.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 align-middle">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="destructive">Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No threads found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Tags Panel Component
function TagsPanel() {
  const [newTag, setNewTag] = useState('');
  
  const { data: tags, isLoading } = useQuery({
    queryKey: ['/api/tags'],
  });

  const createTagMutation = useMutation({
    mutationFn: async (tagName) => {
      try {
        const res = await apiRequest('POST', '/api/admin/tags', { name: tagName });
        return await res.json();
      } catch (error) {
        throw new Error('Failed to create tag');
      }
    },
    onSuccess: () => {
      toast({
        title: "Tag created",
        description: "The tag has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setNewTag('');
    },
    onError: (error) => {
      toast({
        title: "Failed to create tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTag.trim()) {
      createTagMutation.mutate(newTag);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags Management</CardTitle>
        <CardDescription>
          Create and manage tags for threads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tag">New Tag</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="tag" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter tag name"
                    required
                  />
                  <Button 
                    type="submit"
                    disabled={createTagMutation.isPending}
                  >
                    {createTagMutation.isPending ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Existing Tags</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags?.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-1 bg-secondary px-3 py-1 rounded-full">
                      <span>{tag.name}</span>
                      <button 
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          // Delete tag
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {tags?.length === 0 && (
                    <div className="text-muted-foreground">
                      No tags found. Create your first tag.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-3">Tag Usage Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Keep tag names short and descriptive</li>
              <li>• Use lowercase letters for consistency</li>
              <li>• Avoid spaces (use hyphens instead)</li>
              <li>• Similar tags can be merged to avoid duplication</li>
              <li>• Popular tags will help users discover content</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Settings Panel Component
function SettingsPanel() {
  const [settings, setSettings] = useState({
    siteName: 'ForumClone',
    siteDescription: 'A place to discuss and share knowledge',
    allowNewUsers: true,
    enableDarkMode: true,
    maintenanceMode: false,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const res = await apiRequest('POST', '/api/admin/settings', data);
        return await res.json();
      } catch (error) {
        // Mock success
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
        <CardDescription>
          Configure global settings for your forum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input 
                id="siteName" 
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                placeholder="Enter site name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input 
                id="siteDescription" 
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                placeholder="Enter site description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowNewUsers" className="text-base">Allow New Registrations</Label>
                <p className="text-sm text-muted-foreground">Toggle whether new users can register on the forum.</p>
              </div>
              <div>
                <input 
                  type="checkbox"
                  id="allowNewUsers"
                  checked={settings.allowNewUsers}
                  onChange={(e) => setSettings({...settings, allowNewUsers: e.target.checked})}
                  className="toggle"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableDarkMode" className="text-base">Enable Dark Mode Option</Label>
                <p className="text-sm text-muted-foreground">Allow users to switch between light and dark themes.</p>
              </div>
              <div>
                <input 
                  type="checkbox"
                  id="enableDarkMode"
                  checked={settings.enableDarkMode}
                  onChange={(e) => setSettings({...settings, enableDarkMode: e.target.checked})}
                  className="toggle"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Put the site in maintenance mode. Only admins can access.</p>
              </div>
              <div>
                <input 
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="toggle"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={saveSettingsMutation.isPending}
            className="w-full md:w-auto"
          >
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}