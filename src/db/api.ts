import { supabase } from "./supabase";
import type {
  Profile,
  Category,
  Article,
  Product,
  ProductImage,
  Slide,
  SlideWithProduct,
  SlideFormData,
  Question,
  Answer,
  SiteSetting,
  ModuleSetting,
  Banner,
  Download,
  Video,
  Template,
  ArticleWithAuthor,
  ProductWithImages,
  QuestionWithAnswers,
  AnswerWithAuthor,
  ArticleFormData,
  ProductFormData,
  QuestionFormData,
  AnswerFormData,
  CategoryFormData,
  ModuleSettingFormData,
  ModuleType,
  AIArticleGeneration,
  AIArticleGenerationRequest,
  AIArticleGenerationWithCategory,
  AIArticleTemplate,
  AIArticleTemplateRequest,
  AIArticleTemplateWithCategory,
  AIBatchGeneration,
  AIBatchGenerationRequest,
  AIBatchGenerationWithTemplate,
  MemberLevelConfig,
  MemberPointsLog,
  BrowsingHistory,
  MemberSubmission,
  MemberStats,
  MemberLeaderboard,
  ProfileUpdateData,
  PointsRule,
  AdminOperationLog,
  MessageTemplate,
  MessageTemplateFormData,
  Follow,
  FollowWithProfile,
  DirectMessage,
  DirectMessageWithProfiles,
  DirectMessageFormData,
  UserProfileData,
  ProfileSettingsFormData,
  ProfileVisibility,
  SystemSetting,
  WelcomeMessageTemplate,
  MemberPostWithAuthor,
  Album,
  AlbumPhoto,
  AlbumWithPhotos,
  AlbumFormData,
  Blog,
  BlogComment,
  BlogLike,
  BlogWithAuthor,
  BlogCommentWithUser,
  BlogFormData,
  Group,
  GroupMember,
  GroupPost,
  GroupWithDetails,
  GroupMemberWithUser,
  GroupPostWithUser,
  GroupFormData,
  GroupRole,
  PrivacySettings,
  PrivacySettingsFormData,
  SEOSettings,
  SEOSettingsFormData,
  PageSEO,
  PageSEOFormData,
  Redirect,
  RedirectFormData,
  SitemapEntry,
  WeChatConfig,
  WeChatConfigType,
  WeChatConfigFormData,
} from "@/types";

// ==================== User related ====================

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

// Alias function for compatibility
export async function getProfileById(userId: string) {
  return getProfile(userId);
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data as Profile[] : [];
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

// ==================== Category related ====================

export async function getCategories(type?: string) {
  let query = supabase
    .from("categories")
    .select("*")
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data as Category[] : [];
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as Category | null;
}

export async function getCategoryById(id: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("is_enabled", true)
    .maybeSingle();

  if (error) throw error;
  return data as Category | null;
}

export async function createCategory(category: CategoryFormData) {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Category | null;
}

export async function updateCategory(id: string, updates: Partial<CategoryFormData>) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Category | null;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==================== Article related ====================

export async function getArticles(page = 1, limit = 10, status?: string) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("articles")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    articles: Array.isArray(data) ? data as ArticleWithAuthor[] : [],
    total: count || 0
  };
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as ArticleWithAuthor | null;
}

export async function getArticleById(id: string) {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ArticleWithAuthor | null;
}

export async function getArticlesByAuthor(authorId: string) {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data as ArticleWithAuthor[] : [];
}

export async function getArticlesByCategoryId(categoryId: string, page = 1, limit = 12) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles(id, username, nickname, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return Array.isArray(data) ? data as ArticleWithAuthor[] : [];
}

export async function countArticlesByCategory(categoryId: string) {
  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .eq("category_id", categoryId);

  if (error) throw error;
  return count || 0;
}

export async function createArticle(article: ArticleFormData & { author_id: string }) {
  const { data, error } = await supabase
    .from("articles")
    .insert(article)
    .select()
    .maybeSingle();

  if (error) throw error;
  
  // Auto create activity
  if (data && article.status === "published") {
    try {
      await createPost(
        article.author_id,
        `Published new article：${article.title}`,
        undefined,
        "article",
        data.id
      );
    } catch (postError) {
      console.error("Failed to create post for article:", postError);
    }
  }
  
  return data as Article | null;
}

export async function updateArticle(id: string, updates: Partial<ArticleFormData>) {
  const { data, error } = await supabase
    .from("articles")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Article | null;
}

export async function deleteArticle(id: string) {
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function incrementArticleViews(id: string) {
  const { error } = await supabase.rpc("increment_article_views", { article_id: id });
  if (error) console.error("Failed to increase view count:", error);
}

// ==================== Product related ====================

export async function getProducts(page = 1, limit = 10, status?: string) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    products: Array.isArray(data) ? data as ProductWithImages[] : [],
    total: count || 0
  };
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  
  if (data && data.images) {
    data.images = (data.images as ProductImage[]).sort((a, b) => a.sort_order - b.sort_order);
  }
  
  return data as ProductWithImages | null;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  
  if (data && data.images) {
    data.images = (data.images as ProductImage[]).sort((a, b) => a.sort_order - b.sort_order);
  }
  
  return data as ProductWithImages | null;
}

export async function getProductsByCategoryId(categoryId: string, page = 1, limit = 12) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*)
    `)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  const products = Array.isArray(data) ? data : [];
  return products.map(product => {
    if (product.images) {
      product.images = (product.images as ProductImage[]).sort((a, b) => a.sort_order - b.sort_order);
    }
    return product;
  }) as ProductWithImages[];
}

export async function countProductsByCategory(categoryId: string) {
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .eq("category_id", categoryId);

  if (error) throw error;
  return count || 0;
}

export async function createProduct(product: ProductFormData) {
  const { images, ...productData } = product;
  
  console.log("API createProduct received data:", product);
  console.log("Image array:", images);
  console.log("Products data:", productData);
  
  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Create ProductFailed:", error);
    throw error;
  }
  
  console.log("ProductsCreated successfully:", data);
  
  // If has images, add image records
  if (data && images && images.length > 0) {
    console.log("Start inserting images, ProductsID:", data.id);
    const imageRecords = images.map((url, index) => ({
      product_id: data.id,
      image_url: url,
      sort_order: index
    }));
    
    console.log("Image records:", imageRecords);
    
    const { error: imageError } = await supabase
      .from("product_images")
      .insert(imageRecords);
    
    if (imageError) {
      console.error("Failed to insert images:", imageError);
      throw imageError;
    }
    
    console.log("Images inserted successfully");
  } else {
    console.log("No images to insert，data:", data, "images:", images);
  }
  
  return data as Product | null;
}

export async function updateProduct(id: string, updates: ProductFormData) {
  const { images, ...productData } = updates;
  
  const { data, error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  
  // Delete old images
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", id);
  
  if (deleteError) throw deleteError;
  
  // Add new images
  if (images && images.length > 0) {
    const imageRecords = images.map((url, index) => ({
      product_id: id,
      image_url: url,
      sort_order: index
    }));
    
    const { error: imageError } = await supabase
      .from("product_images")
      .insert(imageRecords);
    
    if (imageError) throw imageError;
  }
  
  return data as Product | null;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Product | null;
}

export async function incrementProductViews(id: string) {
  const { error } = await supabase.rpc("increment_product_views", { product_id: id });
  if (error) console.error("Failed to increase view count:", error);
}

// ==================== Slide related ====================

// Get enabled slides list (frontend)
export async function getActiveSlides() {
  const { data, error } = await supabase
    .from("slides")
    .select(`
      *,
      product:products(id, name, slug, description, price)
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || []) as SlideWithProduct[];
}

// Get all slides list (backend)
export async function getAllSlides() {
  const { data, error } = await supabase
    .from("slides")
    .select(`
      *,
      product:products(id, name, slug, description, price)
    `)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || []) as SlideWithProduct[];
}

// Get single slide
export async function getSlideById(id: string) {
  const { data, error } = await supabase
    .from("slides")
    .select(`
      *,
      product:products(id, name, slug, description, price)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as SlideWithProduct | null;
}

// Create slide
export async function createSlide(slideData: SlideFormData) {
  const { data, error } = await supabase
    .from("slides")
    .insert([slideData])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Slide | null;
}

// Update slide
export async function updateSlide(id: string, slideData: Partial<SlideFormData>) {
  const { data, error } = await supabase
    .from("slides")
    .update(slideData)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Slide | null;
}

// Delete slide
export async function deleteSlide(id: string) {
  const { error } = await supabase
    .from("slides")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Toggle slide enabled status
export async function toggleSlideActive(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from("slides")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Slide | null;
}

// Update slidedisplay order
export async function updateSlideOrder(id: string, displayOrder: number) {
  const { data, error } = await supabase
    .from("slides")
    .update({ display_order: displayOrder })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Slide | null;
}

// ==================== QQ&ArelatedA related ====================

export async function getQuestions(page = 1, limit = 10, status?: string) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug),
      answers:answers(count)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  
  const questions = Array.isArray(data) ? data.map(q => ({
    ...q,
    answer_count: Array.isArray(q.answers) ? q.answers.length : 0
  })) as QuestionWithAnswers[] : [];

  return {
    questions,
    total: count || 0
  };
}

export async function getMyQuestions(userId: string) {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug),
      answers:answers(count)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  const questions = Array.isArray(data) ? data.map(q => ({
    ...q,
    answer_count: Array.isArray(q.answers) ? q.answers.length : 0
  })) as QuestionWithAnswers[] : [];

  return questions;
}

export async function getQuestionById(id: string) {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug),
      answers:answers(
        *,
        author:profiles(id, username, email, avatar_url)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  
  if (data) {
    const question = data as QuestionWithAnswers;
    question.answer_count = Array.isArray(question.answers) ? question.answers.length : 0;
    return question;
  }
  
  return null;
}

export async function getQuestionsByCategoryId(categoryId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, nickname, avatar_url),
      category:categories(id, name, slug),
      answers:answers(id)
    `)
    .eq("status", "approved")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  const questions = Array.isArray(data) ? data : [];
  return questions.map(q => ({
    ...q,
    answer_count: Array.isArray(q.answers) ? q.answers.length : 0
  })) as QuestionWithAnswers[];
}

export async function getQuestionsByAuthor(authorId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, nickname, avatar_url),
      category:categories(id, name, slug),
      answers:answers(id)
    `)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  const questions = Array.isArray(data) ? data : [];
  return questions.map(q => ({
    ...q,
    answer_count: Array.isArray(q.answers) ? q.answers.length : 0
  })) as QuestionWithAnswers[];
}

export async function countQuestionsByCategory(categoryId: string) {
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("category_id", categoryId);

  if (error) throw error;
  return count || 0;
}

export async function createQuestion(question: QuestionFormData & { author_id?: string | null }) {
  const questionData = {
    ...question,
    status: 'pending', // All questions need approval
    author_id: question.author_id || null,
  };
  
  const { data, error } = await supabase
    .from("questions")
    .insert(questionData)
    .select()
    .maybeSingle();

  if (error) throw error;
  
  // Auto create activity（After question published）
  if (data && question.author_id) {
    try {
      await createPost(
        question.author_id,
        `Asked new question：${question.title}`,
        undefined,
        "question",
        data.id
      );
    } catch (postError) {
      console.error("Failed to create post for question:", postError);
    }
  }
  
  return data as Question | null;
}

export async function updateQuestion(id: string, updates: Partial<QuestionFormData>) {
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Question | null;
}

export async function updateQuestionStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("questions")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Question | null;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function incrementQuestionViews(id: string) {
  const { error } = await supabase.rpc("increment_question_views", { question_id: id });
  if (error) console.error("Failed to increase view count:", error);
}

export async function answerQuestion(questionId: string, content: string, authorId: string) {
  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      content,
      author_id: authorId
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ==================== Answer related ====================

export async function createAnswer(answer: AnswerFormData & { author_id: string }) {
  const { data, error } = await supabase
    .from("answers")
    .insert(answer)
    .select()
    .maybeSingle();

  if (error) throw error;
  
  // Auto create activity
  if (data) {
    try {
      // Get question title
      const { data: question } = await supabase
        .from("questions")
        .select("title")
        .eq("id", answer.question_id)
        .maybeSingle();
      
      if (question) {
        await createPost(
          answer.author_id,
          `Answered question：${question.title}`,
          undefined,
          "answer",
          data.id
        );
      }
    } catch (postError) {
      console.error("Failed to create post for answer:", postError);
    }
  }
  
  return data as Answer | null;
}

export async function updateAnswer(id: string, content: string) {
  const { data, error } = await supabase
    .from("answers")
    .update({ content })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Answer | null;
}

export async function acceptAnswer(id: string) {
  const { data, error } = await supabase
    .from("answers")
    .update({ is_accepted: true })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Answer | null;
}

export async function deleteAnswer(id: string) {
  const { error } = await supabase
    .from("answers")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==================== Site Settingsrelated ====================

export async function getSiteSettings() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data as SiteSetting[] : [];
}

export async function getSiteSetting(key: string) {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  return data as SiteSetting | null;
}

export async function updateSiteSetting(key: string, value: string) {
  // 使用 upsert 操作：如果记录存在则更新，不存在则插入
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as SiteSetting | null;
}

export async function createSiteSetting(setting: { key: string; value: string; description?: string }) {
  const { data, error } = await supabase
    .from("site_settings")
    .insert(setting)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as SiteSetting | null;
}

// ==================== Statisticsrelated ====================

export async function trackPageView(pagePath: string, visitorId: string, userId?: string) {
  const { error } = await supabase
    .from("analytics")
    .insert({
      page_path: pagePath,
      visitor_id: visitorId,
      user_id: userId || null
    });

  if (error) console.error("record访问Failed:", error);
}

export async function getDashboardStats() {
  const [articlesRes, productsRes, questionsRes, usersRes] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true })
  ]);

  const totalViews = await supabase
    .from("analytics")
    .select("*", { count: "exact", head: true });

  return {
    total_articles: articlesRes.count || 0,
    total_products: productsRes.count || 0,
    total_questions: questionsRes.count || 0,
    total_users: usersRes.count || 0,
    total_views: totalViews.count || 0
  };
}

export async function getRecentArticles(limit = 5) {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data as ArticleWithAuthor[] : [];
}

export async function getPopularProducts(limit = 5) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*)
    `)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data as ProductWithImages[] : [];
}

export async function getFeaturedProducts(limit = 4) {
  // 首先获取所有标记为推荐的产品
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(*)
    `)
    .eq("status", "published")
    .eq("is_featured", true);

  if (error) throw error;
  
  // 如果没有数据，返回空数组
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // 随机打乱数组顺序
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  
  // 返回指定数量的随机产品
  return shuffled.slice(0, limit) as ProductWithImages[];
}

export async function getRecentQuestions(limit = 5) {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug),
      answers:answers(count)
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  const questions = Array.isArray(data) ? data.map(q => ({
    ...q,
    answer_count: Array.isArray(q.answers) ? q.answers.length : 0
  })) as QuestionWithAnswers[] : [];

  return questions;
}

// ==================== Searchrelated ====================

// Search content across articles, products, and questions
// 智能搜索：预处理搜索关键词
function preprocessSearchKeyword(keyword: string): string[] {
  // 去除特殊字符，保留字母、数字、空格和中文
  const cleaned = keyword.replace(/[^\w\s\u4e00-\u9fa5]/g, ' ').trim();
  
  // 分词：按空格分割，过滤空字符串
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  
  return words;
}

// 构建智能搜索条件
function buildSmartSearchCondition(keywords: string[], fields: string[]): string {
  const conditions: string[] = [];
  
  // 为每个关键词构建搜索条件
  keywords.forEach(keyword => {
    const searchTerm = `%${keyword}%`;
    fields.forEach(field => {
      conditions.push(`${field}.ilike.${searchTerm}`);
    });
  });
  
  // 使用OR连接所有条件
  return conditions.join(',');
}

export async function searchContent(keyword: string) {
  // 智能分词处理
  const keywords = preprocessSearchKeyword(keyword);
  
  // 如果没有有效关键词，返回空结果
  if (keywords.length === 0) {
    return {
      articles: [],
      products: [],
      questions: []
    };
  }
  
  // 构建搜索条件
  const articleSearchCondition = buildSmartSearchCondition(keywords, ['title', 'content', 'excerpt']);
  const productSearchCondition = buildSmartSearchCondition(keywords, ['name', 'description', 'content']);
  const questionSearchCondition = buildSmartSearchCondition(keywords, ['title', 'content']);

  // Search articles with smart fuzzy matching
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("status", "published")
    .or(articleSearchCondition)
    .order("created_at", { ascending: false })
    .limit(20);

  // Search products with smart fuzzy matching
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(id, image_url, sort_order)
    `)
    .eq("status", "published")
    .or(productSearchCondition)
    .order("created_at", { ascending: false })
    .limit(20);

  // Search questions with smart fuzzy matching
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, email, avatar_url),
      category:categories(id, name, slug),
      answers:answers(
        id,
        content,
        created_at,
        author:profiles(id, username, email, avatar_url)
      )
    `)
    .eq("status", "approved")
    .or(questionSearchCondition)
    .order("created_at", { ascending: false })
    .limit(20);

  if (articlesError) console.error("Search articles failed:", articlesError);
  if (productsError) console.error("Search products failed:", productsError);
  if (questionsError) console.error("Search questions failed:", questionsError);

  return {
    articles: Array.isArray(articles) ? articles as ArticleWithAuthor[] : [],
    products: Array.isArray(products) ? products.map(p => ({
      ...p,
      images: Array.isArray(p.images) ? p.images.sort((a, b) => a.sort_order - b.sort_order) : []
    })) as ProductWithImages[] : [],
    questions: Array.isArray(questions) ? questions.map(q => ({
      ...q,
      answer_count: Array.isArray(q.answers) ? q.answers.length : 0
    })) as QuestionWithAnswers[] : []
  };
}

// Record search keyword for analytics
export async function recordSearchKeyword(keyword: string) {
  const { error } = await supabase.rpc("record_search_keyword", {
    p_keyword: keyword
  });

  if (error) {
    console.error("Record search keyword failed:", error);
    throw error;
  }
}

export async function getSearchKeywords() {
  const { data, error } = await supabase
    .from("search_keywords")
    .select("*")
    .order("last_searched_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getHotSearchKeywords(limit = 10) {
  const { data, error } = await supabase
    .from("search_keywords")
    .select("*")
    .gte("search_count", 2)
    .order("search_count", { ascending: false })
    .order("last_searched_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}


// ==================== Module Settingsrelated ====================

export async function getModuleSetting(moduleType: ModuleType) {
  const { data, error } = await supabase
    .from("module_settings")
    .select("*")
    .eq("module_type", moduleType)
    .maybeSingle();

  if (error) throw error;
  return data as ModuleSetting | null;
}

export async function getAllModuleSettings() {
  const { data, error } = await supabase
    .from("module_settings")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data as ModuleSetting[] : [];
}

export async function updateModuleSetting(
  moduleType: ModuleType,
  formData: ModuleSettingFormData
) {
  const { data, error } = await supabase
    .from("module_settings")
    .update(formData)
    .eq("module_type", moduleType)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as ModuleSetting;
}

// ==================== QuestionApproval related ====================

export async function approveQuestion(questionId: string) {
  const { error } = await supabase.rpc("approve_question", { question_id: questionId });
  if (error) throw error;
}

export async function rejectQuestion(questionId: string) {
  const { error } = await supabase.rpc("reject_question", { question_id: questionId });
  if (error) throw error;
}

export async function getPendingQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles(id, username, nickname, avatar_url),
      category:categories(id, name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data as QuestionWithAnswers[] : [];
}

// ==================== LOGOUploadrelated ====================

export async function uploadLogo(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;
  const bucketName = 'app-7fshtpomqha9_logos';

  // Upload FilestoSupabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get公开URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteLogo(url: string) {
  const bucketName = 'app-7fshtpomqha9_logos';
  
  // fromURLextract fromFile Name
  const fileName = url.split('/').pop();
  if (!fileName) throw new Error('invalidFileURL');

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([fileName]);

  if (error) throw error;
}

// ==================== Slideshow related ====================

export async function getActiveBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getBannerById(id: string): Promise<Banner | null> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createBanner(banner: Omit<Banner, "id" | "created_at" | "updated_at">): Promise<Banner> {
  const { data, error } = await supabase
    .from("banners")
    .insert([banner])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBanner(id: string, updates: Partial<Banner>): Promise<Banner> {
  const { data, error } = await supabase
    .from("banners")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from("banners")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadBannerImage(file: File): Promise<string> {
  const bucketName = "app-7fshtpomqha9_banners";
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteBannerImage(imageUrl: string): Promise<void> {
  const bucketName = "app-7fshtpomqha9_banners";
  const fileName = imageUrl.split("/").pop();
  if (!fileName) return;

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([fileName]);

  if (error) throw error;
}

// ==================== Downloadmodule API ====================

export async function getDownloads(options?: {
  categoryId?: string;
  limit?: number;
  offset?: number;
}): Promise<Download[]> {
  let query = supabase
    .from("downloads")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getDownloadById(id: string): Promise<Download | null> {
  const { data, error } = await supabase
    .from("downloads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllDownloadsForAdmin(): Promise<Download[]> {
  const { data, error } = await supabase
    .from("downloads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createDownload(download: Partial<Download>): Promise<Download> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("downloads")
    .insert({
      ...download,
      author_id: user?.id,
      download_count: 0,
      is_published: download.is_published ?? false,
      require_member: download.require_member ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Auto-create post for published download
  if (data && data.is_published && user?.id) {
    try {
      await createPost(
        user.id,
        `Published a new download: ${data.title}`,
        undefined,
        'download',
        data.id
      );
    } catch (postError) {
      console.error('Failed to create post for download:', postError);
    }
  }
  
  return data;
}

export async function updateDownload(id: string, updates: Partial<Download>): Promise<Download> {
  const { data, error } = await supabase
    .from("downloads")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDownload(id: string): Promise<void> {
  const { error } = await supabase
    .from("downloads")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function incrementDownloadCount(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_download_count", {
    download_id: id,
  });

  if (error) throw error;
}

export async function uploadDownloadFile(file: File): Promise<string> {
  const bucketName = "app-7fshtpomqha9_downloads";
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteDownloadFile(fileUrl: string): Promise<void> {
  const bucketName = "app-7fshtpomqha9_downloads";
  const fileName = fileUrl.split("/").pop();
  if (!fileName) return;

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([fileName]);

  if (error) throw error;
}

// ==================== Videosmodule API ====================

export async function getVideos(options?: {
  categoryId?: string;
  limit?: number;
  offset?: number;
}): Promise<Video[]> {
  let query = supabase
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getVideoById(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllVideosForAdmin(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false});

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createVideo(video: Partial<Video>): Promise<Video> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("videos")
    .insert({
      ...video,
      author_id: user?.id,
      view_count: 0,
      is_published: video.is_published ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Auto-create post for published video
  if (data && data.is_published && user?.id) {
    try {
      await createPost(
        user.id,
        `Published a new video: ${data.title}`,
        undefined,
        'video',
        data.id
      );
    } catch (postError) {
      console.error('Failed to create post for video:', postError);
    }
  }
  
  return data;
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
  const { data, error } = await supabase
    .from("videos")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function incrementVideoViewCount(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_video_view_count", {
    video_id: id,
  });

  if (error) throw error;
}

export async function uploadVideoFile(file: File): Promise<string> {
  const bucketName = "app-7fshtpomqha9_videos";
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  console.log('开始上传视频:', { fileName, fileSize: file.size, fileType: file.type });

  const { data, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file);

  if (uploadError) {
    console.error('视频上传失败:', uploadError);
    throw new Error(`视频上传失败: ${uploadError.message}`);
  }

  console.log('视频上传成功:', data);

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function deleteVideoFile(fileUrl: string): Promise<void> {
  const bucketName = "app-7fshtpomqha9_videos";
  const fileName = fileUrl.split("/").pop();
  if (!fileName) return;

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([fileName]);

  if (error) throw error;
}

export async function uploadVideoCover(file: File): Promise<string> {
  const bucketName = "app-7fshtpomqha9_video_covers";
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  console.log('开始上传封面:', { fileName, fileSize: file.size, fileType: file.type });

  const { data, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file);

  if (uploadError) {
    console.error('封面上传失败:', uploadError);
    throw new Error(`封面上传失败: ${uploadError.message}`);
  }

  console.log('封面上传成功:', data);

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function deleteVideoCover(imageUrl: string): Promise<void> {
  const bucketName = "app-7fshtpomqha9_video_covers";
  const fileName = imageUrl.split("/").pop();
  if (!fileName) return;

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([fileName]);

  if (error) throw error;
}

// ==================== Template related ====================

export async function getAllTemplates() {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getTemplateById(id: string) {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Template | null;
}

export async function getTemplatesByCategory(category: string) {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("category", category)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createTemplate(template: Omit<Template, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("templates")
    .insert([template])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Template;
}

export async function updateTemplate(id: string, updates: Partial<Template>) {
  const { data, error } = await supabase
    .from("templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Template;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function toggleTemplateStatus(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from("templates")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as Template;
}

// byCategoryQueryDownloadresource
export async function getDownloadsByCategory(categoryId: string): Promise<Download[]> {
  const { data, error } = await supabase
    .from("downloads")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// byCategoryQueryVideos
export async function getVideosByCategory(categoryId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ==================== AI Article Generation ====================

/**
 * CreateAIArticle generation record
 */
export async function createAIArticleGeneration(
  request: AIArticleGenerationRequest
): Promise<AIArticleGeneration> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("ai_article_generations")
    .insert({
      keywords: request.keywords,
      category_id: request.category_id,
      article_length: request.article_length,
      article_style: request.article_style,
      batch_id: request.batch_id || null,
      template_id: request.template_id || null,
      ai_temperature: request.ai_temperature ?? 0.7,
      ai_top_p: request.ai_top_p ?? 0.9,
      enable_seo: request.enable_seo ?? false,
      enable_auto_format: request.enable_auto_format ?? true,
      author_id: user.id,
      status: "generating"
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to create AI generation record");
  return data as AIArticleGeneration;
}

/**
 * UpdateAIArticle generation record
 */
export async function updateAIArticleGeneration(
  id: string,
  updates: Partial<AIArticleGeneration>
): Promise<AIArticleGeneration> {
  const { data, error } = await supabase
    .from("ai_article_generations")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to update AI generation record");
  return data as AIArticleGeneration;
}

/**
 * GetAIArticle generation record
 */
export async function getAIArticleGeneration(
  id: string
): Promise<AIArticleGenerationWithCategory | null> {
  const { data, error } = await supabase
    .from("ai_article_generations")
    .select(`
      *,
      category:categories(*),
      author:profiles(*),
      published_article:articles(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as AIArticleGenerationWithCategory | null;
}

/**
 * GetAIArticle generation record列table
 */
export async function getAIArticleGenerations(
  page = 1,
  pageSize = 20
): Promise<AIArticleGenerationWithCategory[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("ai_article_generations")
    .select(`
      *,
      category:categories(*),
      author:profiles(*),
      published_article:articles(*)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get用户的AIArticle generation record
 */
export async function getUserAIArticleGenerations(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<AIArticleGenerationWithCategory[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("ai_article_generations")
    .select(`
      *,
      category:categories(*),
      author:profiles(*),
      published_article:articles(*)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * DeleteAIArticle generation record
 */
export async function deleteAIArticleGeneration(id: string): Promise<void> {
  const { error } = await supabase
    .from("ai_article_generations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Publish article from AI generation record
 */
export async function publishArticleFromAIGeneration(
  generationId: string
): Promise<Article> {
  const generation = await getAIArticleGeneration(generationId);
  if (!generation) throw new Error("AI generation record not found");

  if (!generation.generated_title || !generation.generated_content) {
    throw new Error("Article content generation not completed");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("User not logged in");

  // Create article
  const articleData = {
    title: generation.generated_title,
    slug: `ai-${Date.now()}`,
    content: generation.generated_content,
    excerpt: generation.generated_summary || undefined,
    category_id: generation.category_id || undefined,
    status: "published" as const,
    language: "en",
    author_id: user.id
  };

  const article = await createArticle(articleData);
  if (!article) throw new Error("Failed to create article");

  // Update AI generation record
  await updateAIArticleGeneration(generationId, {
    status: "published",
    published_article_id: article.id
  });

  return article;
}

/**
 * Count AI article generations
 */
export async function countAIArticleGenerations(): Promise<number> {
  const { count, error } = await supabase
    .from("ai_article_generations")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

/**
 * Count user's AI article generations
 */
export async function countUserAIArticleGenerations(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("ai_article_generations")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);

  if (error) throw error;
  return count || 0;
}

// ==================== Member System API ====================

/**
 * Get all member level configurations
 */
export async function getMemberLevels(): Promise<MemberLevelConfig[]> {
  const { data, error } = await supabase
    .from("member_levels")
    .select("*")
    .order("min_points", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get member points log for a user
 */
export async function getMemberPointsLog(
  userId: string,
  limit: number = 50
): Promise<MemberPointsLog[]> {
  const { data, error } = await supabase
    .from("member_points_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get browsing history for a user
 */
export async function getBrowsingHistory(
  userId: string,
  limit: number = 50
): Promise<BrowsingHistory[]> {
  const { data, error } = await supabase
    .from("browsing_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Add browsing history record
 */
export async function addBrowsingHistory(
  userId: string,
  contentType: string,
  contentId: string,
  contentTitle: string
): Promise<void> {
  const { error } = await supabase.rpc("add_browsing_history", {
    p_user_id: userId,
    p_content_type: contentType,
    p_content_id: contentId,
    p_content_title: contentTitle,
  });

  if (error) throw error;
}

/**
 * Delete browsing history record
 */
export async function deleteBrowsingHistory(historyId: string): Promise<void> {
  const { error } = await supabase
    .from("browsing_history")
    .delete()
    .eq("id", historyId);

  if (error) throw error;
}

/**
 * Clear all browsing history for a user
 */
export async function clearBrowsingHistory(userId: string): Promise<void> {
  const { error } = await supabase
    .from("browsing_history")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Get member submissions for a user
 */
export async function getMemberSubmissions(
  userId: string,
  limit: number = 50
): Promise<MemberSubmission[]> {
  const { data, error } = await supabase
    .from("member_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get all member submissions (admin)
 */
export async function getAllMemberSubmissions(
  status?: string,
  limit: number = 100
): Promise<MemberSubmission[]> {
  let query = supabase
    .from("member_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Update member submission status (review)
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: "approved" | "rejected",
  reviewerId: string,
  reviewNote?: string
): Promise<void> {
  const { error } = await supabase
    .from("member_submissions")
    .update({
      status,
      reviewer_id: reviewerId,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw error;
}

/**
 * Get member statistics
 */
export async function getMemberStats(userId: string): Promise<MemberStats | null> {
  const { data, error } = await supabase
    .from("member_stats")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get member leaderboard
 */
export async function getMemberLeaderboard(
  limit: number = 10,
  orderBy: "points" | "articles" | "questions" | "answers" = "points"
): Promise<MemberLeaderboard[]> {
  const { data, error } = await supabase.rpc("get_member_leaderboard", {
    p_limit: limit,
    p_order_by: orderBy,
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Add member points manually (admin only)
 */
export async function addMemberPoints(
  userId: string,
  points: number,
  reason: string,
  referenceType?: string,
  referenceId?: string
): Promise<void> {
  const { error } = await supabase.rpc("add_member_points", {
    p_user_id: userId,
    p_points: points,
    p_reason: reason,
    p_reference_type: referenceType,
    p_reference_id: referenceId,
  });

  if (error) throw error;
}

/**
 * Update member profile
 */
export async function updateMemberProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get all members with stats (admin)
 */
export async function getAllMembersWithStats(): Promise<MemberStats[]> {
  const { data, error } = await supabase
    .from("member_stats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Search members by username or email
 */
export async function searchMembers(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get member articles with status
 */
export async function getMemberArticles(
  userId: string,
  limit: number = 50
): Promise<ArticleWithAuthor[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      author:profiles!articles_author_id_fkey(*),
      category:categories(*)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get member questions
 */
export async function getMemberQuestions(
  userId: string,
  limit: number = 50
): Promise<QuestionWithAnswers[]> {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      author:profiles!questions_author_id_fkey(*),
      category:categories(*),
      answers:answers(
        *,
        author:profiles!answers_author_id_fkey(*)
      )
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get member answers
 */
export async function getMemberAnswers(
  userId: string,
  limit: number = 50
): Promise<AnswerWithAuthor[]> {
  const { data, error } = await supabase
    .from("answers")
    .select(`
      *,
      author:profiles!answers_author_id_fkey(*)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ==================== Admin Member Management API ====================

/**
 * Toggle member status (enable/disable account)
 */
export async function toggleMemberStatus(
  userId: string,
  status: "active" | "disabled" | "suspended",
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc("toggle_member_status", {
    p_user_id: userId,
    p_status: status,
    p_reason: reason,
  });

  if (error) throw error;
}

/**
 * Batch update member level
 */
export async function batchUpdateMemberLevel(
  userIds: string[],
  level: number
): Promise<void> {
  const { error } = await supabase.rpc("batch_update_member_level", {
    p_user_ids: userIds,
    p_level: level,
  });

  if (error) throw error;
}

/**
 * Batch add points to members
 */
export async function batchAddPoints(
  userIds: string[],
  points: number,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc("batch_add_points", {
    p_user_ids: userIds,
    p_points: points,
    p_reason: reason,
  });

  if (error) throw error;
}

/**
 * Get all points rules
 */
export async function getPointsRules(): Promise<PointsRule[]> {
  const { data, error } = await supabase
    .from("points_rules")
    .select("*")
    .order("action", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Update points rule
 */
export async function updatePointsRule(
  action: string,
  points: number,
  description: string,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase.rpc("update_points_rule", {
    p_action: action,
    p_points: points,
    p_description: description,
    p_enabled: enabled,
  });

  if (error) throw error;
}

/**
 * Update member level config
 */
export async function updateMemberLevelConfig(
  levelId: number,
  name: string,
  minPoints: number,
  maxPoints: number | null,
  benefits: Record<string, any>,
  badgeColor: string
): Promise<void> {
  const { error } = await supabase.rpc("update_member_level_config", {
    p_level_id: levelId,
    p_name: name,
    p_min_points: minPoints,
    p_max_points: maxPoints,
    p_benefits: benefits,
    p_badge_color: badgeColor,
  });

  if (error) throw error;
}

/**
 * Get admin operation logs
 */
export async function getAdminOperationLogs(
  limit: number = 100
): Promise<AdminOperationLog[]> {
  const { data, error } = await supabase
    .from("admin_operation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Log admin operation
 */
export async function logAdminOperation(
  adminId: string,
  operationType: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {}
): Promise<void> {
  const { error } = await supabase.rpc("log_admin_operation", {
    p_admin_id: adminId,
    p_operation_type: operationType,
    p_target_type: targetType,
    p_target_id: targetId,
    p_details: details,
  });

  if (error) throw error;
}

/**
 * Get member by ID with full details
 */
export async function getMemberById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Delete member (admin only)
 */
export async function deleteMember(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Get members by status
 */
export async function getMembersByStatus(
  status: "active" | "disabled" | "suspended"
): Promise<MemberStats[]> {
  const { data, error } = await supabase
    .from("member_stats")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get members statistics summary
 */
export async function getMembersStatsSummary(): Promise<{
  total: number;
  active: number;
  disabled: number;
  suspended: number;
  totalPoints: number;
  totalArticles: number;
  totalQuestions: number;
  totalAnswers: number;
}> {
  const { data: members, error } = await supabase
    .from("member_stats")
    .select("*");

  if (error) throw error;

  const stats = {
    total: members?.length || 0,
    active: members?.filter(m => m.status === "active").length || 0,
    disabled: members?.filter(m => m.status === "disabled").length || 0,
    suspended: members?.filter(m => m.status === "suspended").length || 0,
    totalPoints: members?.reduce((sum, m) => sum + m.points, 0) || 0,
    totalArticles: members?.reduce((sum, m) => sum + m.total_articles, 0) || 0,
    totalQuestions: members?.reduce((sum, m) => sum + m.total_questions, 0) || 0,
    totalAnswers: members?.reduce((sum, m) => sum + m.total_answers, 0) || 0,
  };

  return stats;
}

/**
 * Update member level configuration
 */
export async function updateMemberLevel(
  levelId: string,
  updates: Partial<MemberLevelConfig>
): Promise<void> {
  const { error } = await supabase
    .from("member_levels")
    .update(updates)
    .eq("id", levelId);

  if (error) throw error;
}

/**
 * Create new member level
 */
export async function createMemberLevel(
  level: Omit<MemberLevelConfig, "id" | "created_at" | "updated_at">
): Promise<void> {
  const { error } = await supabase
    .from("member_levels")
    .insert([level]);

  if (error) throw error;
}

/**
 * Delete member level
 */
export async function deleteMemberLevel(levelId: string): Promise<void> {
  const { error } = await supabase
    .from("member_levels")
    .delete()
    .eq("id", levelId);

  if (error) throw error;
}

// ==================== SNSSystemAPI ====================

/**
 * 站内信relatedAPI
 */

// Get收件箱消息列table
export async function getInboxMessages(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, nickname, avatar_url)
    `, { count: 'exact' })
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Get发件箱消息列table
export async function getSentMessages(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("messages")
    .select(`
      *,
      receiver:profiles!messages_receiver_id_fkey(id, username, nickname, avatar_url)
    `, { count: 'exact' })
    .eq("sender_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Send message
export async function sendMessage(senderId: string, receiverId: string, subject: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      subject,
      content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete消息
export async function deleteMessage(messageId: string) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
}

// Get未读消息数
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc("get_unread_message_count", { p_user_id: userId });

  if (error) throw error;
  return data || 0;
}

/**
 * Follow systemrelatedAPI
 */

// Check if already following
export async function checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc("is_following", {
      p_follower_id: followerId,
      p_following_id: followingId
    });

  if (error) throw error;
  return data || false;
}

// Get关注列table
export async function getFollowingList(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("member_follows")
    .select(`
      *,
      following:profiles!member_follows_following_id_fkey(
        id, username, nickname, avatar_url, bio, 
        follower_count, following_count, post_count
      )
    `, { count: 'exact' })
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Get粉丝列table
export async function getFollowerList(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("member_follows")
    .select(`
      *,
      follower:profiles!member_follows_follower_id_fkey(
        id, username, nickname, avatar_url, bio,
        follower_count, following_count, post_count
      )
    `, { count: 'exact' })
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Get关注统计
export async function getFollowStats(userId: string) {
  const { data, error } = await supabase
    .rpc("get_follow_stats", { p_user_id: userId })
    .single();

  if (error) throw error;
  return data || { following_count: 0, follower_count: 0 };
}

/**
 * Member activity relatedAPI
 */

// 发布activity
export async function createPost(
  authorId: string,
  content: string,
  images?: string[],
  relatedType?: string,
  relatedId?: string
) {
  const { data, error } = await supabase
    .from("member_posts")
    .insert({
      author_id: authorId,
      content,
      images: images || null,
      related_type: relatedType || null,
      related_id: relatedId || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Getactivity列table（timeline）
export async function getPostTimeline(userId: string | null, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("member_posts")
    .select(`
      *,
      author:profiles!member_posts_author_id_fkey(
        id, username, nickname, avatar_url, member_level
      )
    `, { count: 'exact' })
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  // If user is logged in，检查每itemsactivity是否已点赞
  if (userId && data) {
    const postIds = data.map(post => post.id);
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);

    const likedPostIds = new Set(likes?.map(like => like.post_id) || []);
    
    const postsWithLikeStatus = data.map(post => ({
      ...post,
      is_liked: likedPostIds.has(post.id)
    }));

    return { data: postsWithLikeStatus, count: count || 0 };
  }

  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Get用户的activity列table
export async function getUserPosts(authorId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("member_posts")
    .select(`
      *,
      author:profiles!member_posts_author_id_fkey(
        id, username, nickname, avatar_url, member_level
      )
    `, { count: 'exact' })
    .eq("author_id", authorId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Deleteactivity
export async function deletePost(postId: string) {
  const { error } = await supabase
    .from("member_posts")
    .update({ status: "deleted" })
    .eq("id", postId);

  if (error) throw error;
}

// 点赞activity
export async function likePost(postId: string, userId: string) {
  const { data, error } = await supabase
    .from("post_likes")
    .insert({
      post_id: postId,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Unlike
export async function unlikePost(postId: string, userId: string) {
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) throw error;
}

// Check if already liked
export async function checkIsPostLiked(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc("is_post_liked", {
      p_post_id: postId,
      p_user_id: userId
    });

  if (error) throw error;
  return data || false;
}

// Getactivity评论列table
export async function getPostComments(postId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("post_comments")
    .select(`
      *,
      author:profiles!post_comments_author_id_fkey(
        id, username, nickname, avatar_url
      )
    `, { count: 'exact' })
    .eq("post_id", postId)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw error;

  // Get每items评论的回复
  if (data && data.length > 0) {
    const commentIds = data.map(comment => comment.id);
    const { data: replies } = await supabase
      .from("post_comments")
      .select(`
        *,
        author:profiles!post_comments_author_id_fkey(
          id, username, nickname, avatar_url
        )
      `)
      .in("parent_id", commentIds)
      .order("created_at", { ascending: true });

    const repliesMap = new Map();
    replies?.forEach(reply => {
      if (!repliesMap.has(reply.parent_id)) {
        repliesMap.set(reply.parent_id, []);
      }
      repliesMap.get(reply.parent_id).push(reply);
    });

    const commentsWithReplies = data.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment.id) || []
    }));

    return { data: commentsWithReplies, count: count || 0 };
  }

  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Add comment
export async function addPostComment(
  postId: string,
  authorId: string,
  content: string,
  parentId?: string
) {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: authorId,
      content,
      parent_id: parentId || null
    })
    .select(`
      *,
      author:profiles!post_comments_author_id_fkey(
        id, username, nickname, avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

// Delete评论
export async function deletePostComment(commentId: string) {
  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}

/**
 * 通知relatedAPI
 */

// Get通知列table
export async function getNotifications(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("notifications")
    .select("*", { count: 'exact' })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Get未读通知数
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc("get_unread_notification_count", { p_user_id: userId });

  if (error) throw error;
  return data || 0;
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

// Delete通知
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw error;
}

// Clear all notifications
export async function clearAllNotifications(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Management员SNSManagementAPI
 */

// Get所有activity（Management员）
export async function getAllPostsForAdmin(page = 1, limit = 20, status?: string) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("member_posts")
    .select(`
      *,
      author:profiles!member_posts_author_id_fkey(
        id, username, nickname, avatar_url, email
      )
    `, { count: 'exact' })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Get所有消息（Management员）
export async function getAllMessagesForAdmin(page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, nickname, email),
      receiver:profiles!messages_receiver_id_fkey(id, username, nickname, email)
    `, { count: 'exact' })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: Array.isArray(data) ? data : [], count: count || 0 };
}

// Deleteactivity（Management员）
export async function deletePostByAdmin(postId: string) {
  const { error } = await supabase
    .from("member_posts")
    .delete()
    .eq("id", postId);

  if (error) throw error;
}

// Delete消息（Management员）
export async function deleteMessageByAdmin(messageId: string) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
}

// ==================== 访问流量统计related ====================

// record页面访问
export async function recordPageView(data: {
  visitor_id: string;
  session_id: string;
  page_url: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;
}) {
  const { data: result, error } = await supabase.rpc("record_page_view", {
    p_visitor_id: data.visitor_id,
    p_session_id: data.session_id,
    p_page_url: data.page_url,
    p_page_title: data.page_title || null,
    p_referrer: data.referrer || null,
    p_user_agent: data.user_agent || null,
    p_device_type: data.device_type || null,
    p_browser: data.browser || null,
    p_os: data.os || null,
    p_ip_address: data.ip_address || null,
    p_country: data.country || null,
    p_region: data.region || null,
    p_city: data.city || null,
  });

  if (error) throw error;
  return result;
}

// Update页面停留时长
export async function updatePageDuration(viewId: string, duration: number) {
  const { error } = await supabase.rpc("update_page_duration", {
    p_view_id: viewId,
    p_duration: duration,
  });

  if (error) throw error;
}

// Get实时统计data
export async function getRealtimeAnalytics(days: number = 7) {
  const { data, error } = await supabase.rpc("get_realtime_analytics", {
    p_days: days,
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get页面访问排行
export async function getTopPages(limit: number = 10, days: number = 7) {
  const { data, error } = await supabase.rpc("get_top_pages", {
    p_limit: limit,
    p_days: days,
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get地区分布统计
export async function getLocationStats(days: number = 7) {
  const { data, error } = await supabase.rpc("get_location_stats", {
    p_days: days,
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get设备统计
export async function getDeviceStats(days: number = 7) {
  const { data, error } = await supabase.rpc("get_device_stats", {
    p_days: days,
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get统计概览
export async function getAnalyticsOverview() {
  // Get今日统计
  const { data: todayData, error: todayError } = await supabase
    .from("page_views")
    .select("visitor_id, duration")
    .gte("created_at", new Date().toISOString().split("T")[0]);

  if (todayError) throw todayError;

  // Get总统计
  const { count: totalViews, error: totalError } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true });

  if (totalError) throw totalError;

  // Get独立访客数
  const { data: visitorsData, error: visitorsError } = await supabase
    .from("visitor_sessions")
    .select("visitor_id");

  if (visitorsError) throw visitorsError;

  const todayViews = todayData?.length || 0;
  const todayVisitors = new Set(todayData?.map((v) => v.visitor_id)).size;
  const totalVisitors = new Set(visitorsData?.map((v) => v.visitor_id)).size;
  const avgDuration = todayData?.length
    ? Math.round(
        todayData.reduce((sum, v) => sum + (v.duration || 0), 0) /
          todayData.length
      )
    : 0;

  return {
    today_views: todayViews,
    today_visitors: todayVisitors,
    total_views: totalViews || 0,
    total_visitors: totalVisitors,
    avg_duration: avgDuration,
    bounce_rate: 0, // Can be calculated later
  };
}

// Get最近访问record
export async function getRecentPageViews(limit: number = 50) {
  const { data, error } = await supabase
    .from("page_views")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Get访客会话列table
export async function getVisitorSessions(limit: number = 50) {
  const { data, error } = await supabase
    .from("visitor_sessions")
    .select("*")
    .order("last_visit", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}


// ==================== AIArticle templateManagement ====================

/**
 * CreateAIArticle template
 */
export async function createAIArticleTemplate(
  request: AIArticleTemplateRequest
): Promise<AIArticleTemplate> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("ai_article_templates")
    .insert({
      name: request.name,
      description: request.description || null,
      keywords_template: request.keywords_template || null,
      category_id: request.category_id || null,
      article_length: request.article_length,
      article_style: request.article_style,
      ai_temperature: request.ai_temperature ?? 0.7,
      ai_top_p: request.ai_top_p ?? 0.9,
      enable_seo: request.enable_seo ?? true,
      enable_auto_format: request.enable_auto_format ?? true,
      created_by: user.id
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Create模板failed");
  return data as AIArticleTemplate;
}

/**
 * GetAIArticle template列table
 */
export async function getAIArticleTemplates(): Promise<AIArticleTemplateWithCategory[]> {
  const { data, error } = await supabase
    .from("ai_article_templates")
    .select(`
      *,
      category:categories(*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data as AIArticleTemplateWithCategory[] : [];
}

/**
 * Get单个AIArticle template
 */
export async function getAIArticleTemplate(
  id: string
): Promise<AIArticleTemplateWithCategory | null> {
  const { data, error } = await supabase
    .from("ai_article_templates")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as AIArticleTemplateWithCategory | null;
}

/**
 * UpdateAIArticle template
 */
export async function updateAIArticleTemplate(
  id: string,
  updates: Partial<AIArticleTemplateRequest>
): Promise<AIArticleTemplate> {
  const { data, error } = await supabase
    .from("ai_article_templates")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Update模板failed");
  return data as AIArticleTemplate;
}

/**
 * DeleteAIArticle template
 */
export async function deleteAIArticleTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("ai_article_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==================== AIBatch generation management ====================

/**
 * CreateAIBatch generation task
 */
export async function createAIBatchGeneration(
  request: AIBatchGenerationRequest
): Promise<AIBatchGeneration> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("ai_batch_generations")
    .insert({
      batch_name: request.batch_name,
      total_count: request.keywords_list.length,
      completed_count: 0,
      failed_count: 0,
      status: "pending",
      template_id: request.template_id || null,
      keywords_list: request.keywords_list,
      created_by: user.id
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("CreateBatch generation taskfailed");
  return data as AIBatchGeneration;
}

/**
 * GetAIBatch generation task列table
 */
export async function getAIBatchGenerations(): Promise<AIBatchGenerationWithTemplate[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("ai_batch_generations")
    .select(`
      *,
      template:ai_article_templates(*)
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data as AIBatchGenerationWithTemplate[] : [];
}

/**
 * Get单个AIBatch generation task
 */
export async function getAIBatchGeneration(
  id: string
): Promise<AIBatchGenerationWithTemplate | null> {
  const { data, error } = await supabase
    .from("ai_batch_generations")
    .select(`
      *,
      template:ai_article_templates(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as AIBatchGenerationWithTemplate | null;
}

/**
 * UpdateAIBatch generation task
 */
export async function updateAIBatchGeneration(
  id: string,
  updates: Partial<AIBatchGeneration>
): Promise<AIBatchGeneration> {
  const { data, error } = await supabase
    .from("ai_batch_generations")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("UpdateBatch generation taskfailed");
  return data as AIBatchGeneration;
}

/**
 * GetBatch generation task的文章列table
 */
export async function getAIBatchGenerationArticles(
  batchId: string
): Promise<AIArticleGenerationWithCategory[]> {
  const { data, error } = await supabase
    .from("ai_article_generations")
    .select(`
      *,
      category:categories(*),
      author:profiles(*),
      published_article:articles(*)
    `)
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data as AIArticleGenerationWithCategory[] : [];
}

// ==================== Message template management ====================

/**
 * Get所有消息模板
 */
export async function getMessageTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * according tokeyGet消息模板
 */
export async function getMessageTemplateByKey(key: string): Promise<MessageTemplate | null> {
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("template_key", key)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create消息模板
 */
export async function createMessageTemplate(
  template: MessageTemplateFormData
): Promise<MessageTemplate> {
  const { data, error } = await supabase
    .from("message_templates")
    .insert(template)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Create消息模板failed");
  return data;
}

/**
 * Update消息模板
 */
export async function updateMessageTemplate(
  id: string,
  template: Partial<MessageTemplateFormData>
): Promise<MessageTemplate> {
  const { data, error } = await supabase
    .from("message_templates")
    .update({ ...template, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Update消息模板failed");
  return data;
}

/**
 * Delete消息模板
 */
export async function deleteMessageTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("message_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ==================== Follow system ====================

/**
 * Follow user
 */
export async function followUser(followingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first");

  const { error } = await supabase
    .from("follows")
    .insert({
      follower_id: user.id,
      following_id: followingId
    });

  if (error) throw error;
}

/**
 * 取消Follow user
 */
export async function unfollowUser(followingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first");

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) throw error;
}

/**
 * Check if following user
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Check if is friend（mutual follow）
 */
export async function areFriends(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("are_friends", {
    user1_id: user.id,
    user2_id: userId
  });

  if (error) throw error;
  return data || false;
}

/**
 * Get用户的关注列table
 */
export async function getFollowing(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<FollowWithProfile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select(`
      *,
      following:profiles!follows_following_id_fkey(*)
    `)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get用户的粉丝列table
 */
export async function getFollowers(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<FollowWithProfile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select(`
      *,
      follower:profiles!follows_follower_id_fkey(*)
    `)
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get关注数
 */
export async function getFollowingCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_following_count", {
    user_id: userId
  });

  if (error) throw error;
  return data || 0;
}

/**
 * Get粉丝数
 */
export async function getFollowersCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_followers_count", {
    user_id: userId
  });

  if (error) throw error;
  return data || 0;
}

// ==================== Internal message system ====================

/**
 * Send internal message
 */
export async function sendDirectMessage(
  messageData: DirectMessageFormData
): Promise<DirectMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first");

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      sender_id: user.id,
      receiver_id: messageData.receiver_id,
      content: messageData.content
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Send messagefailed");
  return data;
}

/**
 * Get与某用户的聊天record
 */
export async function getConversation(
  otherUserId: string,
  page: number = 1,
  limit: number = 50
): Promise<DirectMessageWithProfiles[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first");

  const { data, error } = await supabase
    .from("direct_messages")
    .select(`
      *,
      sender:profiles!direct_messages_sender_id_fkey(*),
      receiver:profiles!direct_messages_receiver_id_fkey(*)
    `)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Get消息列table（by对话分组）
 */
export async function getMessagesList(): Promise<DirectMessageWithProfiles[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first");

  // Get最近的消息
  const { data, error } = await supabase
    .from("direct_messages")
    .select(`
      *,
      sender:profiles!direct_messages_sender_id_fkey(*),
      receiver:profiles!direct_messages_receiver_id_fkey(*)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from("direct_messages")
    .update({ is_read: true })
    .eq("id", messageId);

  if (error) throw error;
}

/**
 * Mark all messages with user as read
 */
export async function markConversationAsRead(otherUserId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first");

  const { error } = await supabase
    .from("direct_messages")
    .update({ is_read: true })
    .eq("sender_id", otherUserId)
    .eq("receiver_id", user.id);

  if (error) throw error;
}

/**
 * Get未读消息数
 */
export async function getUnreadMessagesCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc("get_unread_messages_count", {
    user_id: user.id
  });

  if (error) throw error;
  return data || 0;
}

// ==================== Email verification ====================

/**
 * Verify email and upgrade member level
 */
export async function verifyEmailAndUpgrade(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please login first");

  const { error } = await supabase.rpc("verify_email_and_upgrade", {
    user_id: user.id
  });

  if (error) throw error;
}

// ==================== profile page ====================

/**
 * Get用户SNSactivity
 */
export async function getSNSPostsByUser(userId: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 由于当前data库中没有sns_poststable，返回空array
  // If added in the futuresns_poststable，Can use the following code：
  // const { data, error } = await supabase
  //   .from("sns_posts")
  //   .select("*")
  //   .eq("user_id", userId)
  //   .order("created_at", { ascending: false })
  //   .range(from, to);
  // 
  // if (error) throw error;
  // return Array.isArray(data) ? data : [];
  
  return [];
}

/**
 * Get用户profile pagedata
 */
export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  // Get用户资料
  const profile = await getProfileById(userId);
  if (!profile) return null;

  // Get user articles（Only take first10items）
  const allArticles = await getArticlesByAuthor(userId);
  const articles = allArticles.slice(0, 10);

  // Get用户问答
  const questions = await getQuestionsByAuthor(userId, 1, 10);

  // GetSNSactivity
  const sns_posts = await getSNSPostsByUser(userId, 1, 10);

  // Check follow status
  const is_following = await isFollowing(userId);

  // Check friend status
  const is_friend = await areFriends(userId);

  // Get关注数和粉丝数
  const followers_count = await getFollowersCount(userId);
  const following_count = await getFollowingCount(userId);

  return {
    profile,
    articles,
    questions,
    sns_posts,
    is_following,
    is_friend,
    followers_count,
    following_count
  };
}

/**
 * Updateprofile page设置
 */
export async function updateProfileSettings(userId: string, settings: ProfileSettingsFormData): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      profile_visibility: settings.profile_visibility,
      show_email: settings.show_email,
      show_articles: settings.show_articles,
      show_questions: settings.show_questions,
      show_sns: settings.show_sns,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * 检查是否可以查看profile page
 */
export async function canViewProfile(viewerId: string | null, profileOwnerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc("can_view_profile", {
      viewer_id: viewerId,
      profile_owner_id: profileOwnerId
    });

  if (error) throw error;
  return data || false;
}

// ==================== profile pageManagement（Management后台） ====================

/**
 * Get所有profile page列table（Management后台）
 */
export async function getAllProfilesForAdmin(page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    profiles: Array.isArray(data) ? data : [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * Createprofile pageManagementlog
 */
export async function createProfileManagementLog(
  profileId: string,
  action: string,
  reason?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("profile_management_logs")
    .insert({
      profile_id: profileId,
      admin_id: user.id,
      action,
      reason: reason || null
    });

  if (error) throw error;
}

/**
 * Getprofile pageManagementlog
 */
export async function getProfileManagementLogs(profileId?: string, page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("profile_management_logs")
    .select(`
      *,
      profile:profiles!profile_management_logs_profile_id_fkey(id, username, nickname, email),
      admin:profiles!profile_management_logs_admin_id_fkey(id, username, nickname)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (profileId) {
    query = query.eq("profile_id", profileId);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    logs: Array.isArray(data) ? data : [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * Management员强制Updateprofile page设置
 */
export async function adminUpdateProfileSettings(
  profileId: string,
  settings: Partial<ProfileSettingsFormData>,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .eq("id", profileId);

  if (error) throw error;

  // recordManagementlog
  await createProfileManagementLog(profileId, "Updateprofile page设置", reason);
}

/**
 * Management员禁用/启用profile page
 */
export async function adminToggleProfileVisibility(
  profileId: string,
  visibility: ProfileVisibility,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      profile_visibility: visibility,
      updated_at: new Date().toISOString()
    })
    .eq("id", profileId);

  if (error) throw error;

  // recordManagementlog
  await createProfileManagementLog(
    profileId,
    `设置profile page可见性为: ${visibility}`,
    reason
  );
}

// ==================== Email verification和欢迎消息related ====================

/**
 * Get欢迎消息模板
 */
export async function getWelcomeMessageTemplate(): Promise<WelcomeMessageTemplate | null> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "welcome_message_template")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data.setting_value as WelcomeMessageTemplate;
}

/**
 * Update欢迎消息模板（Management员）
 */
export async function updateWelcomeMessageTemplate(
  template: WelcomeMessageTemplate
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_welcome_message", {
    enabled: template.enabled,
    title: template.title,
    content: template.content,
  });

  if (error) throw error;
}

/**
 * Management员设置用户Email verification状态
 */
export async function adminSetEmailVerified(
  userId: string,
  verified: boolean,
  reason?: string
): Promise<void> {
  const { data, error } = await supabase.rpc("admin_set_email_verified", {
    user_id: userId,
    verified: verified,
    admin_note: reason || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Management员Update用户邮箱
 */
export async function adminUpdateUserEmail(
  userId: string,
  newEmail: string,
  reason?: string
): Promise<void> {
  const { data, error } = await supabase.rpc("admin_update_user_email", {
    user_id: userId,
    new_email: newEmail,
    admin_note: reason || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Management员修改用户密码
 * Note：This function requires admin permission，Actual password update viaSupabase Admin APIcompleted
 */
export async function adminUpdateUserPassword(
  userId: string,
  newPassword: string,
  reason?: string
): Promise<void> {
  // Validate password length
  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // callRPCrecord操作log
  const { error } = await supabase.rpc("admin_update_user_password", {
    user_id: userId,
    new_password: newPassword,
    admin_note: reason || null,
  });

  if (error) throw error;

  // Note：Actual password update needs to be viaSupabase Admin APIcompleted
  // 这里只是record操作log，Actual password update should be in backendEdge Functioncompleted
  console.warn("Password update logged. Actual password change requires Supabase Admin API.");
}

/**
 * Send email verification
 */
export async function sendEmailVerification(email: string): Promise<void> {
  const { error } = await supabase.rpc("send_email_verification_code", {
    user_email: email,
  });

  if (error) throw error;
}

/**
 * 验证Email verification码
 */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_email_code", {
    user_email: email,
    verification_code: code,
  });

  if (error) throw error;
  return data as boolean;
}

/**
 * GetSystem设置
 */
export async function getSystemSettings(settingKey: string): Promise<any> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", settingKey)
    .maybeSingle();

  if (error) throw error;
  return data?.setting_value || null;
}

/**
 * UpdateSystem设置
 */
export async function updateSystemSettings(
  settingKey: string,
  settingValue: any
): Promise<void> {
  const { error } = await supabase
    .from("system_settings")
    .upsert({
      setting_key: settingKey,
      setting_value: settingValue,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "setting_key"
    });

  if (error) throw error;
}

// ==================== Social network features ====================

// Album management
export async function getAlbums(
  userId?: string,
  page: number = 1,
  pageSize: number = 12
): Promise<Album[]> {
  let query = supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAlbumById(id: string): Promise<AlbumWithPhotos | null> {
  const { data: album, error: albumError } = await supabase
    .from("albums")
    .select("*, profiles(*)")
    .eq("id", id)
    .maybeSingle();

  if (albumError) throw albumError;
  if (!album) return null;

  const { data: photos, error: photosError } = await supabase
    .from("album_photos")
    .select("*")
    .eq("album_id", id)
    .order("created_at", { ascending: false });

  if (photosError) throw photosError;

  return {
    ...album,
    photos: Array.isArray(photos) ? photos : [],
    photo_count: photos?.length || 0,
    user: album.profiles,
  };
}

export async function createAlbum(data: AlbumFormData): Promise<Album> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: album, error } = await supabase
    .from("albums")
    .insert({
      user_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return album;
}

export async function updateAlbum(
  id: string,
  data: Partial<AlbumFormData>
): Promise<Album> {
  const { data: album, error } = await supabase
    .from("albums")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return album;
}

export async function deleteAlbum(id: string): Promise<void> {
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPhotoToAlbum(
  albumId: string,
  file: File,
  title?: string,
  description?: string
): Promise<AlbumPhoto> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  // Compress image
  const compressedFile = await compressImage(file);

  // upload toSupabase Storage
  const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("app-7fshtpomqha9_social_images")
    .upload(fileName, compressedFile);

  if (uploadError) throw uploadError;

  // Get公开URL
  const {
    data: { publicUrl },
  } = supabase.storage
    .from("app-7fshtpomqha9_social_images")
    .getPublicUrl(fileName);

  // Create照片record
  const { data: photo, error: photoError } = await supabase
    .from("album_photos")
    .insert({
      album_id: albumId,
      user_id: user.id,
      image_url: publicUrl,
      title,
      description,
    })
    .select()
    .single();

  if (photoError) throw photoError;
  return photo;
}

export async function deletePhoto(id: string): Promise<void> {
  const { error } = await supabase.from("album_photos").delete().eq("id", id);
  if (error) throw error;
}

// log/Blog management
export async function getBlogs(
  userId?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<BlogWithAuthor[]> {
  let query = supabase
    .from("blogs")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data)
    ? data.map((blog) => ({
        ...blog,
        user: blog.profiles,
      }))
    : [];
}

export async function getBlogById(id: string): Promise<BlogWithAuthor | null> {
  const { data: blog, error: blogError } = await supabase
    .from("blogs")
    .select("*, profiles(*)")
    .eq("id", id)
    .maybeSingle();

  if (blogError) throw blogError;
  if (!blog) return null;

  // Increment view count
  await supabase.rpc("increment_blog_views", { blog_id: id });

  // Get评论
  const { data: comments, error: commentsError } = await supabase
    .from("blog_comments")
    .select("*, profiles(*)")
    .eq("blog_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) throw commentsError;

  // Check if current user liked
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from("blog_likes")
      .select("id")
      .eq("blog_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    isLiked = !!like;
  }

  return {
    ...blog,
    user: blog.profiles,
    comments: Array.isArray(comments)
      ? comments.map((c) => ({ ...c, user: c.profiles }))
      : [],
    is_liked: isLiked,
  };
}

export async function createBlog(data: BlogFormData): Promise<Blog> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: blog, error } = await supabase
    .from("blogs")
    .insert({
      user_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return blog;
}

export async function updateBlog(
  id: string,
  data: Partial<BlogFormData>
): Promise<Blog> {
  const { data: blog, error } = await supabase
    .from("blogs")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return blog;
}

export async function deleteBlog(id: string): Promise<void> {
  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) throw error;
}

export async function addBlogComment(
  blogId: string,
  content: string
): Promise<BlogComment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: comment, error } = await supabase
    .from("blog_comments")
    .insert({
      blog_id: blogId,
      user_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return comment;
}

export async function deleteBlogComment(id: string): Promise<void> {
  const { error } = await supabase.from("blog_comments").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleBlogLike(blogId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("blog_likes")
    .select("id")
    .eq("blog_id", blogId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from("blog_likes")
      .delete()
      .eq("id", existingLike.id);
    if (error) throw error;
    return false;
  } else {
    // Add like
    const { error } = await supabase.from("blog_likes").insert({
      blog_id: blogId,
      user_id: user.id,
    });
    if (error) throw error;
    return true;
  }
}

// 群组Management
export async function getGroups(
  page: number = 1,
  pageSize: number = 12
): Promise<GroupWithDetails[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Array.isArray(data)
    ? await Promise.all(
        data.map(async (group) => {
          let isMember = false;
          let memberRole: GroupRole | undefined;

          if (user) {
            const { data: membership } = await supabase
              .from("group_members")
              .select("role")
              .eq("group_id", group.id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (membership) {
              isMember = true;
              memberRole = membership.role;
            }
          }

          return {
            ...group,
            creator: group.profiles,
            is_member: isMember,
            member_role: memberRole,
          };
        })
      )
    : [];
}

export async function getGroupById(id: string): Promise<GroupWithDetails | null> {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*, profiles(*)")
    .eq("id", id)
    .maybeSingle();

  if (groupError) throw groupError;
  if (!group) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isMember = false;
  let memberRole: GroupRole | undefined;

  if (user) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      isMember = true;
      memberRole = membership.role;
    }
  }

  return {
    ...group,
    creator: group.profiles,
    is_member: isMember,
    member_role: memberRole,
  };
}

export async function createGroup(data: GroupFormData): Promise<Group> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      creator_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return group;
}

export async function updateGroup(
  id: string,
  data: Partial<GroupFormData>
): Promise<Group> {
  const { data: group, error } = await supabase
    .from("groups")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return group;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw error;
}

export async function joinGroup(groupId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
  });

  if (error) throw error;
}

export async function leaveGroup(groupId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getGroupMembers(
  groupId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<GroupMemberWithUser[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("*, profiles(*)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;

  return Array.isArray(data)
    ? data.map((member) => ({
        ...member,
        user: member.profiles,
      }))
    : [];
}

export async function getGroupPosts(
  groupId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<GroupPostWithUser[]> {
  const { data, error } = await supabase
    .from("group_posts")
    .select("*, profiles(*)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;

  return Array.isArray(data)
    ? data.map((post) => ({
        ...post,
        user: post.profiles,
      }))
    : [];
}

export async function createGroupPost(
  groupId: string,
  content: string,
  images?: string[]
): Promise<GroupPost> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: post, error } = await supabase
    .from("group_posts")
    .insert({
      group_id: groupId,
      user_id: user.id,
      content,
      images: images || null,
    })
    .select()
    .single();

  if (error) throw error;
  return post;
}

export async function deleteGroupPost(id: string): Promise<void> {
  const { error } = await supabase.from("group_posts").delete().eq("id", id);
  if (error) throw error;
}

// Privacy settings
export async function getPrivacySettings(): Promise<PrivacySettings | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("privacy_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updatePrivacySettings(
  data: PrivacySettingsFormData
): Promise<PrivacySettings> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: settings, error } = await supabase
    .from("privacy_settings")
    .upsert({
      user_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return settings;
}

// Image compression helper function
async function compressImage(file: File): Promise<File> {
  // If file is smaller than1MB，return directly
  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // limit max resolution to1080p
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法Createcanvascontext"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // convert toWEBPformat，quality0.8
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // If still larger than after compression1MB，降低quality
            if (blob.size > 1024 * 1024) {
              canvas.toBlob(
                (blob2) => {
                  if (!blob2) {
                    reject(new Error("Failed to compress image"));
                    return;
                  }
                  const compressedFile = new File(
                    [blob2],
                    file.name.replace(/\.[^.]+$/, ".webp"),
                    {
                      type: "image/webp",
                    }
                  );
                  resolve(compressedFile);
                },
                "image/webp",
                0.6
              );
            } else {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".webp"),
                {
                  type: "image/webp",
                }
              );
              resolve(compressedFile);
            }
          },
          "image/webp",
          0.8
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("文件读取failed"));
  });
}

// Upload image to storage bucket
export async function uploadImage(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  // Validate filename contains only English and numbers
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");

  // Compress image
  const compressedFile = await compressImage(file);

  // upload toSupabase Storage
  const fileName = `${user.id}/${Date.now()}_${cleanFileName}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("app-7fshtpomqha9_social_images")
    .upload(fileName, compressedFile);

  if (uploadError) throw uploadError;

  // Get公开URL
  const {
    data: { publicUrl },
  } = supabase.storage
    .from("app-7fshtpomqha9_social_images")
    .getPublicUrl(fileName);

  return publicUrl;
}

// ==================== Translation API ====================

/**
 * Translation单个文本
 * @param text 要Translation的文本
 * @param to target language
 * @param from source language（default to 'en'）
 * @param context context信息（optional）
 * @returns Translation结果
 */
export async function translateText(
  text: string,
  to: string,
  from: string = "en",
  context?: string
): Promise<{
  source_text: string;
  target_text: string;
  from: string;
  to: string;
  cached: boolean;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("translate", {
      body: {
        text,
        from,
        to,
        context,
      },
    });

    if (error) {
      console.error("Translationerror:", error);
      // Translationfailed时返回原文
      return {
        source_text: text,
        target_text: text,
        from,
        to,
        cached: false,
      };
    }

    if (!data.success) {
      console.error("Translationfailed:", data.error);
      return {
        source_text: text,
        target_text: text,
        from,
        to,
        cached: false,
      };
    }

    return data.data;
  } catch (error) {
    console.error("Translationexception:", error);
    return {
      source_text: text,
      target_text: text,
      from,
      to,
      cached: false,
    };
  }
}

/**
 * Batch translate text
 * @param texts 要Translation的文本array
 * @param to target language
 * @param from source language（default to 'en'）
 * @param context context信息（optional）
 * @returns Batch translation result
 */
export async function batchTranslateTexts(
  texts: string[],
  to: string,
  from: string = "en",
  context?: string
): Promise<{
  translations: Array<{
    source_text: string;
    target_text: string;
    from: string;
    to: string;
    cached: boolean;
  }>;
  total: number;
  cached: number;
  translated: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("translate", {
      body: {
        texts,
        from,
        to,
        context,
      },
    });

    if (error) {
      console.error("Batch translation error:", error);
      // Translationfailed时返回原文
      return {
        translations: texts.map(text => ({
          source_text: text,
          target_text: text,
          from,
          to,
          cached: false,
        })),
        total: texts.length,
        cached: 0,
        translated: 0,
      };
    }

    if (!data.success) {
      console.error("批量Translationfailed:", data.error);
      return {
        translations: texts.map(text => ({
          source_text: text,
          target_text: text,
          from,
          to,
          cached: false,
        })),
        total: texts.length,
        cached: 0,
        translated: 0,
      };
    }

    return data.data;
  } catch (error) {
    console.error("批量Translationexception:", error);
    return {
      translations: texts.map(text => ({
        source_text: text,
        target_text: text,
        from,
        to,
        cached: false,
      })),
      total: texts.length,
      cached: 0,
      translated: 0,
    };
  }
}

/**
 * from缓存GetTranslation
 * @param sourceText source text
 * @param sourceLang source language
 * @param targetLang target language
 * @returns Translation结果（If exists）
 */
export async function getTranslationFromCache(
  sourceText: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("get_translation", {
      p_source_text: sourceText,
      p_source_lang: sourceLang,
      p_target_lang: targetLang,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0].target_text;
  } catch (error) {
    console.error("GetTranslation缓存failed:", error);
    return null;
  }
}

/**
 * 批量from缓存GetTranslation
 * @param texts source textarray
 * @param sourceLang source language
 * @param targetLang target language
 * @returns Translation结果 Map
 */
export async function batchGetTranslationsFromCache(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<Map<string, string>> {
  try {
    const { data, error } = await supabase.rpc("batch_get_translations", {
      p_texts: texts,
      p_source_lang: sourceLang,
      p_target_lang: targetLang,
    });

    const result = new Map<string, string>();

    if (error || !data) {
      return result;
    }

    for (const item of data) {
      if (item.found) {
        result.set(item.source_text, item.target_text);
      }
    }

    return result;
  } catch (error) {
    console.error("批量GetTranslation缓存failed:", error);
    return new Map();
  }
}

// ==================== System配置related API ====================

/**
 * Get单个System配置
 */
export async function getSystemSetting(key: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("get_system_setting", {
      p_setting_key: key,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("GetSystem配置failed:", error);
    return null;
  }
}

/**
 * 设置System配置
 */
export async function setSystemSetting(
  key: string,
  value: any,
  category: string = "general",
  description?: string
): Promise<boolean> {
  try {
    // Convert value to JSONB format
    let jsonbValue = value;
    if (typeof value === "string") {
      // Strings need to be wrapped in quotes
      jsonbValue = JSON.stringify(value);
    } else if (typeof value === "number" || typeof value === "boolean") {
      // Convert numbers and booleans directly
      jsonbValue = value;
    } else if (Array.isArray(value) || typeof value === "object") {
      // Convert arrays and objects to JSON string
      jsonbValue = value;
    }

    const { error } = await supabase.rpc("set_system_setting", {
      p_setting_key: key,
      p_setting_value: jsonbValue,
      p_category: category,
      p_description: description,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to set system config:", error);
    return false;
  }
}

/**
 * Delete system config
 */
export async function deleteSystemSetting(key: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("delete_system_setting", {
      p_setting_key: key,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Delete system configfailed:", error);
    return false;
  }
}

/**
 * Get all configs under category
 */
export async function getSettingsByCategory(category: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("get_settings_by_category", {
      p_category: category,
    });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to get category configs:", error);
    return [];
  }
}

/**
 * Get all translation configs
 */
export async function getTranslationSettings(): Promise<Record<string, any>> {
  try {
    const settings = await getSettingsByCategory("translation");
    const result: Record<string, any> = {};
    
    settings.forEach((setting: any) => {
      const key = setting.setting_key.replace("translation.", "");
      let value = setting.setting_value;
      
      // If value is JSON string, try to parse
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {
          // If parse fails, keep original value
        }
      }
      
      result[key] = value;
    });
    
    return result;
  } catch (error) {
    console.error("Failed to get translation configs:", error);
    return {};
  }
}

/**
 * Save translation config
 */
export async function saveTranslationSettings(settings: Record<string, any>): Promise<boolean> {
  try {
    const promises = Object.entries(settings).map(([key, value]) =>
      setSystemSetting(`translation.${key}`, value, "translation")
    );
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error("Save translation configfailed:", error);
    return false;
  }
}

// ==================== SEO Management API ====================

/**
 * Get global SEO settings
 */
export async function getSEOSettings(): Promise<SEOSettings | null> {
  try {
    const { data, error } = await supabase.rpc("get_seo_settings");

    if (error) {
      console.error("Error getting SEO settings:", error);
      return null;
    }

    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Exception getting SEO settings:", error);
    return null;
  }
}

/**
 * Update global SEO settings
 */
export async function updateSEOSettings(settings: SEOSettingsFormData): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("update_seo_settings", {
      p_site_title: settings.site_title,
      p_site_description: settings.site_description,
      p_site_keywords: settings.site_keywords,
      p_site_author: settings.site_author,
      p_og_image: settings.og_image || null,
      p_twitter_handle: settings.twitter_handle || null,
      p_google_analytics_id: settings.google_analytics_id || null,
      p_google_search_console_id: settings.google_search_console_id || null,
      p_bing_webmaster_id: settings.bing_webmaster_id || null,
      p_robots_txt: settings.robots_txt || null,
    });

    if (error) {
      console.error("Error updating SEO settings:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception updating SEO settings:", error);
    return false;
  }
}

/**
 * Get page SEO settings
 */
export async function getPageSEO(pagePath: string): Promise<PageSEO | null> {
  try {
    const { data, error } = await supabase.rpc("get_page_seo", {
      p_page_path: pagePath,
    });

    if (error) {
      console.error("Get page SEO settingserror:", error);
      return null;
    }

    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Get page SEO settingsexception:", error);
    return null;
  }
}

/**
 * Create or update page SEO settings
 */
export async function upsertPageSEO(seo: PageSEOFormData): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("upsert_page_seo", {
      p_page_path: seo.page_path,
      p_page_title: seo.page_title || null,
      p_page_description: seo.page_description || null,
      p_page_keywords: seo.page_keywords || null,
      p_og_title: seo.og_title || null,
      p_og_description: seo.og_description || null,
      p_og_image: seo.og_image || null,
      p_twitter_title: seo.twitter_title || null,
      p_twitter_description: seo.twitter_description || null,
      p_twitter_image: seo.twitter_image || null,
      p_canonical_url: seo.canonical_url || null,
      p_noindex: seo.noindex || false,
      p_nofollow: seo.nofollow || false,
      p_priority: seo.priority || 0.5,
      p_change_frequency: seo.change_frequency || 'weekly',
    });

    if (error) {
      console.error("Create or update page SEO settingserror:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Create or update page SEO settingsexception:", error);
    return false;
  }
}

/**
 * Get all page SEO settings
 */
export async function getAllPageSEO(): Promise<PageSEO[]> {
  try {
    const { data, error } = await supabase
      .from("page_seo")
      .select("*")
      .order("priority", { ascending: false })
      .order("page_path", { ascending: true });

    if (error) {
      console.error("Get all page SEO settingserror:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Get all page SEO settingsexception:", error);
    return [];
  }
}

/**
 * Delete page SEO settings
 */
export async function deletePageSEO(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("page_seo")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete page SEO settingserror:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete page SEO settingsexception:", error);
    return false;
  }
}

/**
 * Get all page SEO settings（for sitemap generation）
 */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const { data, error } = await supabase.rpc("get_all_page_seo");

    if (error) {
      console.error("Error getting sitemap entries:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Exception getting sitemap entries:", error);
    return [];
  }
}

/**
 * Get all redirect rules
 */
export async function getAllRedirects(): Promise<Redirect[]> {
  try {
    const { data, error } = await supabase
      .from("redirects")
      .select("*")
      .order("from_path", { ascending: true });

    if (error) {
      console.error("Error getting redirect rules:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Exception getting redirect rules:", error);
    return [];
  }
}

/**
 * Get enabled redirect rules
 */
export async function getActiveRedirects(): Promise<Redirect[]> {
  try {
    const { data, error } = await supabase.rpc("get_active_redirects");

    if (error) {
      console.error("Get enabled redirect ruleserror:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Get enabled redirect rulesexception:", error);
    return [];
  }
}

/**
 * Create redirect rule
 */
export async function createRedirect(redirect: RedirectFormData): Promise<Redirect | null> {
  try {
    const { data, error } = await supabase
      .from("redirects")
      .insert({
        from_path: redirect.from_path,
        to_path: redirect.to_path,
        redirect_type: redirect.redirect_type,
        is_active: redirect.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("Create redirect ruleerror:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Create redirect ruleexception:", error);
    return null;
  }
}

/**
 * Update redirect rule
 */
export async function updateRedirect(id: string, redirect: Partial<RedirectFormData>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("redirects")
      .update(redirect)
      .eq("id", id);

    if (error) {
      console.error("Update redirect ruleerror:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Update redirect ruleexception:", error);
    return false;
  }
}

/**
 * Delete redirect rule
 */
export async function deleteRedirect(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("redirects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete redirect ruleerror:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete redirect ruleexception:", error);
    return false;
  }
}

/**
 * 获取所有文章（用于sitemap）
 */
export async function getAllArticles(): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all articles error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get all articles exception:", error);
    return [];
  }
}

/**
 * 获取所有产品（用于sitemap）
 */
export async function getAllProducts(): Promise<ProductWithImages[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(*)
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all products error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get all products exception:", error);
    return [];
  }
}

/**
 * 获取所有问答（用于sitemap）
 */
export async function getAllQuestions(): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all questions error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get all questions exception:", error);
    return [];
  }
}

/**
 * 获取所有下载（用于sitemap）
 */
export async function getAllDownloads(): Promise<Download[]> {
  try {
    const { data, error } = await supabase
      .from("downloads")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all downloads error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get all downloads exception:", error);
    return [];
  }
}

/**
 * 获取所有视频（用于sitemap）
 */
export async function getAllVideos(): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get all videos error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get all videos exception:", error);
    return [];
  }
}

/**
 * 获取所有分类（用于sitemap）
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Get all categories error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get all categories exception:", error);
    return [];
  }
}

// ==================== 微信配置管理 ====================

/**
 * 获取所有微信配置
 */
export async function getWeChatConfigs(): Promise<WeChatConfig[]> {
  try {
    const { data, error } = await supabase
      .from('wechat_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取微信配置失败:', error);
      throw new Error(`获取微信配置失败: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('获取微信配置异常:', error);
    throw error;
  }
}

/**
 * 根据类型获取微信配置
 */
export async function getWeChatConfigsByType(type: WeChatConfigType): Promise<WeChatConfig[]> {
  try {
    const { data, error } = await supabase
      .from('wechat_configs')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取微信配置失败:', error);
      throw new Error(`获取微信配置失败: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('获取微信配置异常:', error);
    throw error;
  }
}

/**
 * 获取单个微信配置
 */
export async function getWeChatConfig(id: string): Promise<WeChatConfig | null> {
  try {
    const { data, error } = await supabase
      .from('wechat_configs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('获取微信配置失败:', error);
      throw new Error(`获取微信配置失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('获取微信配置异常:', error);
    throw error;
  }
}

/**
 * 获取激活的微信配置
 */
export async function getActiveWeChatConfig(type: WeChatConfigType): Promise<WeChatConfig | null> {
  try {
    const { data, error } = await supabase
      .from('wechat_configs')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('获取激活的微信配置失败:', error);
      throw new Error(`获取激活的微信配置失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('获取激活的微信配置异常:', error);
    throw error;
  }
}

/**
 * 创建微信配置
 */
export async function createWeChatConfig(configData: WeChatConfigFormData): Promise<WeChatConfig> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('wechat_configs')
      .insert({
        ...configData,
        created_by: userData.user?.id,
        config_data: configData.config_data || {},
        is_active: configData.is_active ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('创建微信配置失败:', error);
      throw new Error(`创建微信配置失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('创建微信配置异常:', error);
    throw error;
  }
}

/**
 * 更新微信配置
 */
export async function updateWeChatConfig(
  id: string,
  configData: Partial<WeChatConfigFormData>
): Promise<WeChatConfig> {
  try {
    const { data, error } = await supabase
      .from('wechat_configs')
      .update(configData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新微信配置失败:', error);
      throw new Error(`更新微信配置失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('更新微信配置异常:', error);
    throw error;
  }
}

/**
 * 删除微信配置
 */
export async function deleteWeChatConfig(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('wechat_configs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除微信配置失败:', error);
      throw new Error(`删除微信配置失败: ${error.message}`);
    }
  } catch (error) {
    console.error('删除微信配置异常:', error);
    throw error;
  }
}

/**
 * 切换微信配置激活状态
 */
export async function toggleWeChatConfigStatus(id: string, isActive: boolean): Promise<WeChatConfig> {
  try {
    const { data, error } = await supabase
      .from('wechat_configs')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('切换微信配置状态失败:', error);
      throw new Error(`切换微信配置状态失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('切换微信配置状态异常:', error);
    throw error;
  }
}

