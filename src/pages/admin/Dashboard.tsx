import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardStats, getRecentArticles, getPopularProducts, getRecentQuestions } from "@/db/api";
import { FileText, Package, MessageCircle, Users, Eye } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total_articles: 0,
    total_products: 0,
    total_questions: 0,
    total_users: 0,
    total_views: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getRecentArticles(5),
      getPopularProducts(5),
      getRecentQuestions(5)
    ]).then(([statsData]) => {
      setStats(statsData);
      setLoading(false);
    }).catch(error => {
      console.error("Failed to load statistics data:", error);
      setLoading(false);
    });
  }, []);

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.username}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_articles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_products}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_questions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_views}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Quick access to common management functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20" asChild>
                <a href="/admin/articles">
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Article Management</div>
                  </div>
                </a>
              </Button>
              <Button variant="outline" className="h-20" asChild>
                <a href="/admin/products">
                  <div className="text-center">
                    <Package className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Product Management</div>
                  </div>
                </a>
              </Button>
              <Button variant="outline" className="h-20" asChild>
                <a href="/admin/questions">
                  <div className="text-center">
                    <MessageCircle className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Q&A Management</div>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
