import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getQuestions, approveQuestion, rejectQuestion, answerQuestion, updateQuestion, updateAnswer, deleteQuestion, deleteAnswer, getCategories, getPendingQuestions } from "@/db/api";
import type { QuestionWithAnswers, Answer, Category } from "@/types";
import { Eye, CheckCircle, XCircle, MessageSquare, User, Edit, Trash2, Clock } from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function QuestionsManage() {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<QuestionWithAnswers[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
  const [editAnswerDialogOpen, setEditAnswerDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithAnswers | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [editQuestionTitle, setEditQuestionTitle] = useState("");
  const [editQuestionContent, setEditQuestionContent] = useState("");
  const [editQuestionCategory, setEditQuestionCategory] = useState<string>("");
  const [editAnswerContent, setEditAnswerContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();
  const { profile } = useAuth();

  const loadData = async () => {
    try {
      const [questionsResult, categoriesData, pendingData] = await Promise.all([
        getQuestions(1, 1000),
        getCategories("question"),
        getPendingQuestions()
      ]);
      setQuestions(questionsResult.questions);
      setCategories(categoriesData);
      setPendingQuestions(pendingData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveQuestion(id);
      toast({ title: "Success", description: "Question approved and published" });
      loadData();
    } catch (error) {
      console.error("Approval failed:", error);
      toast({ title: "Error", description: "Approval failed", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject and delete this question? This action cannot be undone.")) return;
    
    try {
      await rejectQuestion(id);
      toast({ title: "Success", description: "Question rejected and deleted" });
      loadData();
    } catch (error) {
      console.error("Operation failed:", error);
      toast({ title: "Error", description: "Operation failed", variant: "destructive" });
    }
  };

  const openAnswerDialog = (question: QuestionWithAnswers) => {
    setSelectedQuestion(question);
    setAnswerContent("");
    setAnswerDialogOpen(true);
  };

  const handleSubmitAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedQuestion || !profile) return;

    // Validate answer content is not empty
    if (!answerContent.trim()) {
      toast({ title: "Error", description: "Answer content cannot be empty", variant: "destructive" });
      return;
    }

    try {
      await answerQuestion(selectedQuestion.id, answerContent, profile.id);
      toast({ title: "Success", description: "Answer published" });
      setAnswerDialogOpen(false);
      setSelectedQuestion(null);
      setAnswerContent("");
      loadData();
    } catch (error) {
      console.error("Publish failed:", error);
      toast({ title: "Error", description: "Publish failed", variant: "destructive" });
    }
  };

  const openEditQuestionDialog = (question: QuestionWithAnswers) => {
    setSelectedQuestion(question);
    setEditQuestionTitle(question.title);
    setEditQuestionContent(question.content);
    setEditQuestionCategory(question.category_id || "");
    setEditQuestionDialogOpen(true);
  };

  const handleEditQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    if (!editQuestionTitle.trim() || !editQuestionContent.trim()) {
      toast({ title: "Error", description: "Title and content cannot be empty", variant: "destructive" });
      return;
    }

    try {
      await updateQuestion(selectedQuestion.id, {
        title: editQuestionTitle,
        content: editQuestionContent,
        category_id: editQuestionCategory || undefined
      });
      toast({ title: "Success", description: "Question updated" });
      setEditQuestionDialogOpen(false);
      setSelectedQuestion(null);
      loadData();
    } catch (error) {
      console.error("Update failed:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Update failed", 
        variant: "destructive" 
      });
    }
  };

  const openEditAnswerDialog = (answer: Answer) => {
    setSelectedAnswer(answer);
    setEditAnswerContent(answer.content);
    setEditAnswerDialogOpen(true);
  };

  const handleEditAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAnswer) return;

    if (!editAnswerContent.trim()) {
      toast({ title: "Error", description: "Answer content cannot be empty", variant: "destructive" });
      return;
    }

    try {
      await updateAnswer(selectedAnswer.id, editAnswerContent);
      toast({ title: "Success", description: "Answer updated" });
      setEditAnswerDialogOpen(false);
      setSelectedAnswer(null);
      loadData();
    } catch (error) {
      console.error("Update failed:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Update failed", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone, and all related answers will also be deleted.")) return;
    
    try {
      await deleteQuestion(id);
      toast({ title: "Success", description: "Question deleted" });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Delete failed", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm("Are you sure you want to delete this answer? This action cannot be undone.")) return;
    
    try {
      await deleteAnswer(answerId);
      toast({ title: "Success", description: "Answer deleted" });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Delete failed", 
        variant: "destructive" 
      });
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || 
                           (filterCategory === "none" ? !question.category_id : question.category_id === filterCategory);
    return matchesSearch && matchesCategory;
  });

  // Filter approved and rejected questions from filteredQuestions
  const approvedQuestions = filteredQuestions.filter(q => q.status === "approved");
  const rejectedQuestions = filteredQuestions.filter(q => q.status === "rejected");
  
  // Apply search and category filters to pending questions
  const filteredPendingQuestions = pendingQuestions.filter(question => {
    const matchesSearch = !searchTerm || 
                         question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || 
                           (filterCategory === "none" ? !question.category_id : question.category_id === filterCategory);
    return matchesSearch && matchesCategory;
  });

  const renderQuestionCard = (question: QuestionWithAnswers, showActions: boolean = true) => (
    <div key={question.id} className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{question.title}</h3>
            <Badge variant={
              question.status === "approved" ? "default" :
              question.status === "pending" ? "secondary" : "destructive"
            }>
              {question.status === "approved" ? "Approved" :
               question.status === "pending" ? "Pending" : "Rejected"}
            </Badge>
            {question.category && (
              <Badge variant="outline">{question.category.name}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{stripHtml(question.content)}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {question.author?.username || (question.guest_name ? `${question.guest_name} (Guest)` : "Anonymous")}
            </div>
            {question.guest_email && (
              <div className="flex items-center gap-1">
                📧 {question.guest_email}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              0 views
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {question.answers?.length || 0} answers
            </div>
          </div>
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => openEditQuestionDialog(question)}
              title="Edit Question"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {question.status === "pending" && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleApprove(question.id)}
                  title="Approve Question"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleReject(question.id)}
                  title="Reject Question"
                >
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
            {question.status === "approved" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => openAnswerDialog(question)}
                title="Answer Question"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDeleteQuestion(question.id)}
              title="Delete Question"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
      {question.answers && question.answers.length > 0 && (
        <div className="pl-4 border-l-2 space-y-2">
          {question.answers.map(answer => (
            <div key={answer.id} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{answer.author?.username || "Admin"}</span>
                  {answer.is_accepted && (
                    <Badge variant="default" className="text-xs">Accepted</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEditAnswerDialog(answer)}
                    title="Edit Answer"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteAnswer(answer.id)}
                    title="Delete Answer"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground line-clamp-2">{stripHtml(answer.content)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Q&A Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter and Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statistics</Label>
              <div className="text-sm text-muted-foreground pt-2">
                Total {filteredQuestions.length} questions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({filteredPendingQuestions.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedQuestions.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedQuestions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>PendingQuestion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPendingQuestions.map(q => renderQuestionCard(q))}
                {filteredPendingQuestions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchTerm || filterCategory !== "all" 
                      ? "No questions found matching the criteria" 
                      : "No pending questions"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedQuestions.map(q => renderQuestionCard(q))}
                {approvedQuestions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchTerm || filterCategory !== "all" 
                      ? "No questions found matching the criteria" 
                      : "No approved questions"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rejectedQuestions.map(q => renderQuestionCard(q, false))}
                {rejectedQuestions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchTerm || filterCategory !== "all" 
                      ? "No questions found matching the criteria" 
                      : "No rejected questions"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Answer Question</DialogTitle>
            <DialogDescription>
              Provide a professional answer to the user's question
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedQuestion.title}</h3>
                <p className="text-sm text-muted-foreground">{stripHtml(selectedQuestion.content)}</p>
              </div>
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <div className="space-y-2">
                  <Label>Answer Content *</Label>
                  <RichTextEditor
                    value={answerContent}
                    onChange={setAnswerContent}
                    placeholder="Enter your answer..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setAnswerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Publish Answer
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editQuestionDialogOpen} onOpenChange={setEditQuestionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Modify question title, content and category
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <form onSubmit={handleEditQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-question-title">Question Title *</Label>
                <Input
                  id="edit-question-title"
                  value={editQuestionTitle}
                  onChange={(e) => setEditQuestionTitle(e.target.value)}
                  placeholder="Enter question title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-question-content">Question Content *</Label>
                <RichTextEditor
                  value={editQuestionContent}
                  onChange={setEditQuestionContent}
                  placeholder="Describe your question in detail..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-question-category">Category</Label>
                <Select value={editQuestionCategory} onValueChange={setEditQuestionCategory}>
                  <SelectTrigger id="edit-question-category">
                    <SelectValue placeholder="Select category" />
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditQuestionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editAnswerDialogOpen} onOpenChange={setEditAnswerDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Answer</DialogTitle>
            <DialogDescription>
              Modify answer content
            </DialogDescription>
          </DialogHeader>
          {selectedAnswer && (
            <form onSubmit={handleEditAnswer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-answer-content">Answer Content *</Label>
                <RichTextEditor
                  value={editAnswerContent}
                  onChange={setEditAnswerContent}
                  placeholder="Enter answer content..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditAnswerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
