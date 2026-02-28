import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getQuestionById, incrementQuestionViews, answerQuestion, getCurrentUser, getCategories, getQuestions, getPopularProducts } from "@/db/api";
import type { QuestionWithAnswers, Category, ProductWithImages } from "@/types";
import { ArrowLeft, MessageCircle, CheckCircle, Send, FolderOpen, Clock, TrendingUp } from "lucide-react";
import { useRecordBrowsing } from "@/hooks/useRecordBrowsing";
import RichTextEditor from "@/components/common/RichTextEditor";
import PageMeta from "@/components/common/PageMeta";

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [question, setQuestion] = useState<QuestionWithAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestAnsweredQuestions, setLatestAnsweredQuestions] = useState<QuestionWithAnswers[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductWithImages[]>([]);

  // Record browsing history
  useRecordBrowsing("question", question?.id, question?.title);

  useEffect(() => {
    getCurrentUser().then(user => {
      setCurrentUser(user);
    });
  }, []);

  // Load categories and latest answered questions
  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        // Load Q&A categories (only get question module categories)
        const categoriesData = await getCategories('question');
        setCategories(categoriesData);

        // Load latest answered questions (questions with answer count > 0, sorted by latest answer time)
        const questionsResult = await getQuestions(1, 10);
        const questionsData = Array.isArray(questionsResult) ? questionsResult : questionsResult.questions;
        const answeredQuestions = questionsData.filter(q => (q.answer_count || 0) > 0);
        setLatestAnsweredQuestions(answeredQuestions.slice(0, 10));

        // Load latest products
        const productsData = await getPopularProducts(5);
        setLatestProducts(productsData);
      } catch (error) {
        console.error("Failed to load sidebar data:", error);
      }
    };

    loadSidebarData();
  }, []);

  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id]);

  const loadQuestion = async () => {
    try {
      const data = await getQuestionById(id!);
      setQuestion(data);
      if (data) incrementQuestionViews(data.id);
    } catch (error) {
      console.error("Failed to load question:", error);
      toast({
        title: "Load failed",
        description: "Unable to load question details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "Please login before answering questions",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!answerContent.trim()) {
      toast({
        title: "Content cannot be empty",
        description: "Please enter answer content",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await answerQuestion(id!, answerContent, currentUser.id);
      toast({
        title: "Answer submitted",
        description: "Your submission has been received and is pending administrator approval. Thank you for your support!",
      });
      setAnswerContent("");
      // Reload question to display new answer
      await loadQuestion();
    } catch (error: any) {
      console.error("Failed to submit answer:", error);
      toast({
        title: "Submit failed",
        description: error.message || "Unable to submit answer",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Question not found</h1>
        <Button asChild>
          <Link to="/questions">Back to Q&A List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <PageMeta 
        title={question.title}
        type="article"
        autoGenerateDescription={true}
        contentForDescription={question.content || question.title}
        author={question.author?.username || undefined}
        publishedTime={question.created_at}
      />
      <div className="container mx-auto max-w-7xl">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/questions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden xl:block xl:w-64 space-y-6 flex-shrink-0">
            {/* Category List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderOpen className="h-5 w-5" />
                  Q&A Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link to="/questions">
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    All Q&A
                  </Button>
                </Link>
                {categories.map(category => (
                  <Link key={category.id} to={`/questions/category/${category.id}`}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start text-sm ${question.category?.id === category.id ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      {category.name}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Latest Answered Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Latest Answered
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestAnsweredQuestions.map(q => (
                  <Link 
                    key={q.id} 
                    to={`/questions/${q.id}`}
                    className="block group"
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {q.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {q.category && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {q.category.name}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {q.answer_count || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {latestAnsweredQuestions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No answered questions yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Latest Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
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
                {latestProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No products yet
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Question Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {question.category && (
                    <Link to={`/questions/category/${question.category.id}`}>
                      <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                        {question.category.name}
                      </Badge>
                    </Link>
                  )}
                  <Badge variant="outline">{question.answer_count || 0} Answers</Badge>
                </div>
                <CardTitle className="text-3xl">{question.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="rich-content mb-4" 
                  dangerouslySetInnerHTML={{ __html: question.content }} 
                />
                <div className="text-sm text-muted-foreground">
                  Asked by: {question.author?.username || question.guest_name || "Anonymous"}
                </div>
              </CardContent>
            </Card>

            {/* Answers List */}
            <div className="space-y-4 mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                Answers ({question.answer_count || 0})
              </h2>
              {question.answers && question.answers.length > 0 ? (
                question.answers.map(answer => (
                  <Card key={answer.id}>
                    <CardContent className="pt-6">
                      {answer.is_accepted && (
                        <Badge className="mb-2" variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Accepted
                        </Badge>
                      )}
                      <div 
                        className="rich-content mb-4" 
                        dangerouslySetInnerHTML={{ __html: answer.content }} 
                      />
                      <div className="text-sm text-muted-foreground">
                        Answered by: {answer.author?.username || "Anonymous"}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No answers yet. Be the first to answer!
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Answer Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RichTextEditor
                  value={answerContent}
                  onChange={setAnswerContent}
                  placeholder={currentUser ? "Enter your answer..." : "Please login to answer this question"}
                  requireMemberForMedia={true}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!currentUser || submitting || !answerContent.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit Answer"}
                  </Button>
                </div>
                {!currentUser && (
                  <p className="text-sm text-muted-foreground text-center">
                    You need to login to answer questions.
                    <Button variant="link" className="px-1" asChild>
                      <Link to="/login">Login Now</Link>
                    </Button>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
