import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSearchKeywords, getHotSearchKeywords } from "@/db/api";
import { Search, TrendingUp, Calendar, Hash, BarChart3 } from "lucide-react";

interface SearchKeyword {
  id: string;
  keyword: string;
  search_count: number;
  last_searched_at: string;
  created_at: string;
}

export default function SearchStats() {
  const [allKeywords, setAllKeywords] = useState<SearchKeyword[]>([]);
  const [hotKeywords, setHotKeywords] = useState<SearchKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSearches, setTotalSearches] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [all, hot] = await Promise.all([
        getSearchKeywords(),
        getHotSearchKeywords(20)
      ]);
      setAllKeywords(all);
      setHotKeywords(hot);
      
      // Calculate total search count
      const total = all.reduce((sum, item) => sum + item.search_count, 0);
      setTotalSearches(total);
    } catch (error) {
      console.error("Failed to load search statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading search statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Search Statistics
        </h1>
        <p className="text-muted-foreground">
          Track user search behavior and discover trending keywords
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSearches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative search count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Keywords</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allKeywords.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Different search terms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trending Keywords</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotKeywords.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Searches ≥ 2 times
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trending and Recent Searches */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top 20 Trending Searches
            </CardTitle>
            <CardDescription>
              Most popular search keywords ranked by frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hotKeywords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No trending searches yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hotKeywords.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                        ${index === 1 ? 'bg-gray-400 text-white' : ''}
                        ${index === 2 ? 'bg-orange-600 text-white' : ''}
                        ${index > 2 ? 'bg-muted-foreground/20 text-muted-foreground' : ''}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.keyword}</div>
                        <div className="text-xs text-muted-foreground">
                          Last: {formatDateShort(item.last_searched_at)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {item.search_count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Searches
            </CardTitle>
            <CardDescription>
              Latest search activity ordered by time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allKeywords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No search records</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allKeywords.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.keyword}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(item.last_searched_at)}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {item.search_count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            All Search Keywords
          </CardTitle>
          <CardDescription>
            Complete list of all search terms with detailed statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allKeywords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No search records</p>
              <p className="text-sm">Search data will appear here once users start searching</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 font-medium">Keyword</th>
                    <th className="text-left py-3 px-4 font-medium">Search Count</th>
                    <th className="text-left py-3 px-4 font-medium">Last Searched</th>
                    <th className="text-left py-3 px-4 font-medium">First Searched</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeywords.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{item.keyword}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{item.search_count}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(item.last_searched_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
