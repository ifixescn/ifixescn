import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getQuestions, getCategories, createQuestion, getPopularProducts } from "@/db/api";
import type { QuestionWithAnswers, Category, ProductWithImages } from "@/types";
import { ArrowRight, MessageCircle, Plus, FolderOpen, Clock, TrendingUp } from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import PageMeta from "@/components/common/PageMeta";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function Questions() {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestQuestions, setLatestQuestions] = useState<QuestionWithAnswers[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionContent, setQuestionContent] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const itemsPerPage = 7; // 每页7条

  useEffect(() => {
    loadData();
  }, [currentPage]); // 当页码变化时重新加载数据

  const loadData = async () => {
    try {
      setLoading(true);
      const [questionsData, categoriesData, latestData, productsData] = await Promise.all([
        getQuestions(currentPage, itemsPerPage, "approved"),
        getCategories("question"),
        getQuestions(1, 5, "approved"),
        getPopularProducts(5)
      ]);
      setQuestions(questionsData.questions);
      setTotalPages(Math.ceil(questionsData.total / itemsPerPage));
      setCategories(categoriesData);
      setLatestQuestions(latestData.questions);
      setLatestProducts(productsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const categoryId = formData.get("category_id") as string;
    const guestName = formData.get("guest_name") as string;
    const guestEmail = formData.get("guest_email") as string;

    // Validate content
    if (!questionContent.trim()) {
      toast({
        title: "Error",
        description: "Question content cannot be empty",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    try {
      await createQuestion({
        title,
        content: questionContent,
        category_id: categoryId === "none" ? null : categoryId,
        author_id: user?.id || null,
        guest_name: !user ? guestName : undefined,
        guest_email: !user ? guestEmail : undefined,
      });

      toast({
        title: "Success",
        description: "Your question has been submitted and is awaiting administrator approval. Thank you for your support!"
      });

      setDialogOpen(false);
      setQuestionContent("");
      e.currentTarget.reset();
    } catch (error) {
      console.error("Submit failed:", error);
      toast({
        title: "Error",
        description: "Failed to submit question, please try again",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-64 mx-auto mb-4 bg-muted" />
            <Skeleton className="h-6 w-96 mx-auto mb-6 bg-muted" />
            <Skeleton className="h-10 w-32 mx-auto bg-muted" />
          </div>
          <div className="flex gap-6">
            <div className="w-64 space-y-4">
              <Skeleton className="h-48 w-full bg-muted" />
              <Skeleton className="h-48 w-full bg-muted" />
              <Skeleton className="h-64 w-full bg-muted" />
            </div>
            <div className="flex-1 grid grid-cols-2 xl:grid-cols-2 gap-4 xl:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2 bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <PageMeta 
        title="Q&A Community"
        description="Join our mobile phone repair Q&A community. Ask questions, get expert answers, and share your repair knowledge with fellow technicians and enthusiasts."
        keywords="repair questions, repair answers, repair community, repair forum, repair help, technical support, repair advice"
      />
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <MessageCircle className="h-10 w-10 text-primary" />
            Q&A Community
          </h1>
          <p className="text-muted-foreground text-lg mb-6">Participate in discussions, share knowledge, and grow together</p>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Ask a Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ask Question</DialogTitle>
                <DialogDescription>
                  Please describe your question in detail, we will answer as soon as possible
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Question Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Briefly describe your question"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Question Details *</Label>
                  <RichTextEditor
                    value={questionContent}
                    onChange={setQuestionContent}
                    placeholder="Describe your question in detail..."
                    requireMemberForMedia={true}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Question Category</Label>
                  <Select name="category_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!user && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="guest_name">Your Name *</Label>
                      <Input
                        id="guest_name"
                        name="guest_name"
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guest_email">Your Email *</Label>
                      <Input
                        id="guest_email"
                        name="guest_email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        We will notify you via email about the review result
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Question"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Sidebar - Hidden on mobile */}
          <aside className="hidden xl:block xl:w-64 space-y-6 flex-shrink-0">
            {/* Category List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Q&A Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link to="/questions">
                  <Button variant="ghost" className="w-full justify-start">
                    All Q&A
                  </Button>
                </Link>
                {categories.map(category => (
                  <Link key={category.id} to={`/questions/category/${category.id}`}>
                    <Button variant="ghost" className="w-full justify-start">
                      {category.name}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Latest Q&A */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Latest Q&A
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestQuestions.map(question => (
                  <Link 
                    key={question.id} 
                    to={`/questions/${question.id}`}
                    className="block group"
                  >
                    <div>
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {question.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {question.answer_count || 0} answers
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(question.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Latest Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Latest Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestProducts.map(product => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.slug}`}
                    className="block group"
                  >
                    <div className="flex gap-3">
                      {product.images && product.images.length > 0 && (
                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <img 
                            src={product.images[0].image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Right Side - Q&A List */}
          <div className="flex-1">
            <div className="grid grid-cols-1 xl:grid-cols-1 gap-3 xl:gap-6">
              {questions.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">No questions yet. Be the first to ask!</p>
                </div>
              ) : (
                questions.map(question => (
                  <Card key={question.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="p-3 xl:p-6">
                      <div className="flex items-center gap-1 xl:gap-2 mb-1 xl:mb-2 flex-wrap">
                        {question.category && (
                          <Link 
                            to={`/questions/category/${question.category.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-xs xl:text-sm px-1.5 xl:px-2.5 py-0 xl:py-0.5">
                              {question.category.name}
                            </Badge>
                          </Link>
                        )}
                        <Badge variant="outline" className="text-xs xl:text-sm px-1.5 xl:px-2.5 py-0 xl:py-0.5">{question.answer_count || 0} Answers</Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-sm xl:text-lg">{question.title}</CardTitle>
                      <CardDescription className="line-clamp-2 xl:line-clamp-3 text-xs xl:text-sm mt-1 xl:mt-2">
                        {stripHtml(question.content)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 xl:p-6 xl:pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs xl:text-sm text-muted-foreground">
                          {question.author?.username || "Anonymous"}
                        </span>
                        <Button variant="link" className="p-0 h-auto text-xs xl:text-sm" asChild>
                          <Link to={`/questions/${question.id}`}>
                            View Details <ArrowRight className="ml-1 xl:ml-2 h-3 w-3 xl:h-4 xl:w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {/* 页码显示逻辑 */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // 显示第一页、最后一页、当前页及其前后各一页
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
