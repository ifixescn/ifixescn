export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// Database type definitions

export type UserRole = 'admin' | 'editor' | 'member' | 'visitor';
export type MemberLevel = 'guest' | 'member' | 'premium' | 'svip' | 'bronze' | 'silver' | 'gold';
export type MemberStatus = 'active' | 'disabled' | 'suspended';
export type ContentStatus = 'draft' | 'published' | 'offline' | 'pending';
export type QuestionStatus = 'pending' | 'approved' | 'rejected';
export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface Profile {
  id: string;
  username: string | null;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  member_level: MemberLevel;
  status: MemberStatus;
  points: number;
  level: number;
  country: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  profile_visibility: ProfileVisibility;
  show_email: boolean;
  show_articles: boolean;
  show_questions: boolean;
  show_sns: boolean;
  total_articles: number;
  total_questions: number;
  total_answers: number;
  following_count: number;
  follower_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'article' | 'product' | 'question' | 'download' | 'video';
  description: string | null;
  seo_title: string | null;
  seo_keywords: string | null;
  seo_description: string | null;
  banner_image: string | null;
  icon: string | null;
  items_per_page: number;
  sort_order: number;
  is_enabled: boolean;
  show_author: boolean;
  show_date: boolean;
  show_category: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  category_id: string | null;
  author_id: string | null;
  status: ContentStatus;
  view_count: number;
  language: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string | null;
  price: number | null;
  category_id: string | null;
  status: ContentStatus;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

// 幻灯片类型
export interface Slide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  product_id: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlideWithProduct extends Slide {
  product?: Product;
}

export interface SlideFormData {
  title: string;
  description?: string;
  image_url: string;
  product_id?: string | null;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  author_id: string | null;
  status: QuestionStatus;
  view_count: number;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  content: string;
  author_id: string | null;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  id: string;
  page_path: string;
  visitor_id: string;
  user_id: string | null;
  created_at: string;
}

// Extended types (with related data)
export interface ArticleWithAuthor extends Article {
  author?: Profile;
  category?: Category;
}

export interface ProductWithImages extends Product {
  images?: ProductImage[];
  category?: Category;
}

export interface QuestionWithAnswers extends Question {
  author?: Profile;
  category?: Category;
  answers?: AnswerWithAuthor[];
  answer_count?: number;
}

export interface AnswerWithAuthor extends Answer {
  author?: Profile;
}

// Form types
export interface ArticleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category_id?: string;
  status: ContentStatus;
  language?: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description?: string;
  content?: string;
  price?: number;
  category_id?: string;
  status: ContentStatus;
  images?: string[];
}

export interface QuestionFormData {
  title: string;
  content: string;
  category_id?: string;
  guest_name?: string;
  guest_email?: string;
}

export interface AnswerFormData {
  content: string;
  question_id: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  type: 'article' | 'product' | 'question' | 'download' | 'video';
  description?: string;
  seo_title?: string;
  seo_keywords?: string;
  seo_description?: string;
  banner_image?: string | null;
  icon?: string | null;
  items_per_page?: number;
  sort_order?: number;
  is_enabled?: boolean;
  show_author?: boolean;
  show_date?: boolean;
  show_category?: boolean;
}

// Statistics data types
export interface DashboardStats {
  total_articles: number;
  total_products: number;
  total_questions: number;
  total_users: number;
  total_views: number;
  recent_articles: ArticleWithAuthor[];
  recent_questions: QuestionWithAnswers[];
  popular_products: ProductWithImages[];
}

// Module SettingsType
export type ModuleType = 'articles' | 'products' | 'questions' | 'download' | 'video';

export interface ModuleSetting {
  id: string;
  module_type: ModuleType;
  display_name: string;
  banner_image: string | null;
  seo_title: string | null;
  seo_keywords: string | null;
  seo_description: string | null;
  is_enabled: boolean;
  sort_order: number;
  items_per_page: number;
  show_author: boolean;
  show_date: boolean;
  show_category: boolean;
  allow_comments: boolean;
  custom_settings: Record<string, unknown>;
  updated_at: string;
  created_at: string;
}

export interface ModuleSettingFormData {
  display_name: string;
  banner_image?: string | null;
  seo_title?: string | null;
  seo_keywords?: string | null;
  seo_description?: string | null;
  is_enabled: boolean;
  sort_order: number;
  items_per_page: number;
  show_author: boolean;
  show_date: boolean;
  show_category: boolean;
  allow_comments: boolean;
  custom_settings?: Record<string, unknown>;
}

export interface Download {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category_id: string | null;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  cover_image: string | null;
  download_count: number;
  require_member: boolean;
  is_published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category_id: string | null;
  video_url: string;
  cover_image: string | null;
  duration: number | null;
  view_count: number;
  is_published: boolean;
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  content: string;
  file_type: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// AI Article Generation types
export type ArticleLength = 'short' | 'medium' | 'long';
export type ArticleStyle = 'formal' | 'casual' | 'professional' | 'creative';
export type AIGenerationStatus = 'generating' | 'completed' | 'failed' | 'published';
export type BatchGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AIArticleGeneration {
  id: string;
  keywords: string;
  category_id: string | null;
  article_length: ArticleLength;
  article_style: ArticleStyle;
  generated_title: string | null;
  generated_content: string | null;
  generated_summary: string | null;
  status: AIGenerationStatus;
  error_message: string | null;
  published_article_id: string | null;
  author_id: string;
  batch_id: string | null;
  template_id: string | null;
  ai_temperature: number;
  ai_top_p: number;
  enable_seo: boolean;
  enable_auto_format: boolean;
  seo_keywords: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIArticleGenerationRequest {
  keywords: string;
  category_id: string | null;
  article_length: ArticleLength;
  article_style: ArticleStyle;
  batch_id?: string | null;
  template_id?: string | null;
  ai_temperature?: number;
  ai_top_p?: number;
  enable_seo?: boolean;
  enable_auto_format?: boolean;
}

export interface AIArticleGenerationWithCategory extends AIArticleGeneration {
  category?: Category;
  author?: Profile;
  published_article?: Article;
}

// AI文章模板
export interface AIArticleTemplate {
  id: string;
  name: string;
  description: string | null;
  keywords_template: string | null;
  category_id: string | null;
  article_length: ArticleLength;
  article_style: ArticleStyle;
  ai_temperature: number;
  ai_top_p: number;
  enable_seo: boolean;
  enable_auto_format: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AIArticleTemplateRequest {
  name: string;
  description?: string;
  keywords_template?: string;
  category_id?: string | null;
  article_length: ArticleLength;
  article_style: ArticleStyle;
  ai_temperature?: number;
  ai_top_p?: number;
  enable_seo?: boolean;
  enable_auto_format?: boolean;
}

export interface AIArticleTemplateWithCategory extends AIArticleTemplate {
  category?: Category;
}

// AI批量生成
export interface AIBatchGeneration {
  id: string;
  batch_name: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  status: BatchGenerationStatus;
  template_id: string | null;
  keywords_list: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface AIBatchGenerationRequest {
  batch_name: string;
  keywords_list: string[];
  template_id?: string | null;
  category_id?: string | null;
  article_length?: ArticleLength;
  article_style?: ArticleStyle;
  ai_temperature?: number;
  ai_top_p?: number;
  enable_seo?: boolean;
  enable_auto_format?: boolean;
}

export interface AIBatchGenerationWithTemplate extends AIBatchGeneration {
  template?: AIArticleTemplate;
}

// AI生成选项
export interface AIGenerationOptions {
  temperature?: number;
  top_p?: number;
  enable_seo?: boolean;
  enable_auto_format?: boolean;
  onProgress?: (content: string) => void;
}

// Member System Types
export interface MemberLevelConfig {
  id: number;
  name: string;
  min_points: number;
  max_points: number | null;
  benefits: {
    description: string;
    features: string[];
  };
  badge_color: string;
  created_at: string;
}

export interface MemberPointsLog {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface BrowsingHistory {
  id: string;
  user_id: string;
  content_type: 'article' | 'product' | 'video' | 'download' | 'question';
  content_id: string;
  content_title: string;
  created_at: string;
}

export interface MemberSubmission {
  id: string;
  user_id: string;
  content_type: 'article' | 'question';
  content_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: string | null;
  review_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface MemberStats {
  id: string;
  username: string;
  nickname: string | null;
  email: string;
  email_verified: boolean;
  email_verified_at: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: MemberStatus;
  points: number;
  level: number;
  level_name: string;
  badge_color: string;
  total_articles: number;
  total_questions: number;
  total_answers: number;
  country: string | null;
  city: string | null;
  created_at: string;
  last_login_at: string | null;
  total_views: number;
  pending_submissions: number;
}

export interface MemberLeaderboard {
  id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  level: number;
  level_name: string;
  badge_color: string;
  total_articles: number;
  total_questions: number;
  total_answers: number;
}

export interface ProfileUpdateData {
  username?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role?: UserRole;
  level?: number;
  status?: MemberStatus;
  country?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  bio?: string;
}

// 积分规则配置
export interface PointsRule {
  id: string;
  action: string;
  points: number;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 管理员操作日志
export interface AdminOperationLog {
  id: string;
  admin_id: string;
  operation_type: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}

// SNS系统类型定义

// 站内信
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// 站内信（带发送者和接收者信息）
export interface MessageWithProfiles extends Message {
  sender?: Profile;
  receiver?: Profile;
}

// 关注关系
export interface MemberFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// 关注关系（带用户信息）
export interface MemberFollowWithProfile extends MemberFollow {
  follower?: Profile;
  following?: Profile;
}

// 会员动态
export interface MemberPost {
  id: string;
  author_id: string;
  content: string;
  images: string[] | null;
  related_type: string | null;
  related_id: string | null;
  like_count: number;
  comment_count: number;
  status: 'published' | 'deleted';
  created_at: string;
  updated_at: string;
}

// 会员动态（带作者信息）
export interface MemberPostWithAuthor extends MemberPost {
  author?: Profile;
  is_liked?: boolean;
}

// 动态点赞
export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// 动态评论
export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

// 动态评论（带作者信息）
export interface PostCommentWithAuthor extends PostComment {
  author?: Profile;
  replies?: PostCommentWithAuthor[];
}

// 通知类型
export type NotificationType = 'message' | 'follow' | 'like' | 'comment' | 'system';

// 通知
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  related_type: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

// 关注统计
export interface FollowStats {
  following_count: number;
  follower_count: number;
}

// 访问流量统计相关类型
export interface PageView {
  id: string;
  visitor_id: string;
  page_url: string;
  page_title: string | null;
  referrer: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  session_id: string;
  duration: number;
  created_at: string;
}

export interface VisitorSession {
  id: string;
  visitor_id: string;
  session_id: string;
  first_visit: string;
  last_visit: string;
  page_views_count: number;
  total_duration: number;
}

export interface AnalyticsSummary {
  id: string;
  date: string;
  total_views: number;
  unique_visitors: number;
  avg_duration: number;
  bounce_rate: number;
  created_at: string;
  updated_at: string;
}

export interface RealtimeAnalytics {
  date: string;
  total_views: number;
  unique_visitors: number;
  avg_duration: number;
}

export interface TopPage {
  page_url: string;
  page_title: string | null;
  view_count: number;
  unique_visitors: number;
  avg_duration: number;
}

export interface LocationStats {
  country: string;
  region: string;
  city: string;
  view_count: number;
  unique_visitors: number;
}

export interface DeviceStats {
  device_type: string;
  browser: string;
  os: string;
  view_count: number;
  unique_visitors: number;
}

export interface AnalyticsOverview {
  today_views: number;
  today_visitors: number;
  total_views: number;
  total_visitors: number;
  avg_duration: number;
  bounce_rate: number;
}

// 消息模板类型
export interface MessageTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplateFormData {
  template_key: string;
  template_name: string;
  subject: string;
  content: string;
}

// 关注关系类型
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowWithProfile extends Follow {
  follower?: Profile;
  following?: Profile;
}

// 站内信类型
export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DirectMessageWithProfiles extends DirectMessage {
  sender?: Profile;
  receiver?: Profile;
}

export interface DirectMessageFormData {
  receiver_id: string;
  content: string;
}

// SNS动态类型
export interface SNSPost {
  id: string;
  user_id: string;
  content: string;
  images?: string[];
  like_count?: number;
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

// 个人主页数据类型
export interface UserProfileData {
  profile: Profile;
  articles: ArticleWithAuthor[];
  questions: QuestionWithAnswers[];
  sns_posts: SNSPost[];
  is_following: boolean;
  is_friend: boolean;
  followers_count: number;
  following_count: number;
}

// 个人主页设置表单数据
export interface ProfileSettingsFormData {
  profile_visibility: ProfileVisibility;
  show_email: boolean;
  show_articles: boolean;
  show_questions: boolean;
  show_sns: boolean;
}

// 个人主页管理日志
export interface ProfileManagementLog {
  id: string;
  profile_id: string;
  admin_id: string | null;
  action: string;
  reason: string | null;
  created_at: string;
  profile?: Profile;
  admin?: Profile;
}

// 系统设置类型
export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// 欢迎消息模板类型
export interface WelcomeMessageTemplate {
  enabled: boolean;
  title: string;
  content: string;
}

// 社交网络类型定义
export type PrivacyLevel = 'public' | 'friends' | 'private';
export type GroupRole = 'admin' | 'member';

// 相册
export interface Album {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  privacy: PrivacyLevel;
  created_at: string;
  updated_at: string;
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  user_id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  created_at: string;
}

export interface AlbumWithPhotos extends Album {
  photos?: AlbumPhoto[];
  photo_count?: number;
  user?: Profile;
}

// 日志/博客
export interface Blog {
  id: string;
  user_id: string;
  title: string;
  content: string;
  cover_image: string | null;
  privacy: PrivacyLevel;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: string;
  blog_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface BlogLike {
  id: string;
  blog_id: string;
  user_id: string;
  created_at: string;
}

export interface BlogWithAuthor extends Blog {
  user?: Profile;
  comments?: BlogCommentWithUser[];
  is_liked?: boolean;
}

export interface BlogCommentWithUser extends BlogComment {
  user?: Profile;
}

// 群组
export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  cover_image: string | null;
  creator_id: string;
  privacy: 'public' | 'private';
  members_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  images: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface GroupWithDetails extends Group {
  creator?: Profile;
  is_member?: boolean;
  member_role?: GroupRole;
  user_role?: GroupRole;
}

export interface GroupMemberWithUser extends GroupMember {
  user?: Profile;
}

export interface GroupPostWithUser extends GroupPost {
  user?: Profile;
  group?: Group;
}

// 隐私设置
export interface PrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: PrivacyLevel;
  posts_visibility: PrivacyLevel;
  albums_visibility: PrivacyLevel;
  blogs_visibility: PrivacyLevel;
  allow_friend_requests: boolean;
  allow_messages: boolean;
  show_online_status: boolean;
  updated_at: string;
}

// 表单数据类型
export interface AlbumFormData {
  title: string;
  description?: string;
  privacy: PrivacyLevel;
}

export interface BlogFormData {
  title: string;
  content: string;
  cover_image?: string;
  privacy: PrivacyLevel;
}

export interface GroupFormData {
  name: string;
  description?: string;
  avatar?: string;
  cover_image?: string;
  privacy: 'public' | 'private';
}

export interface PrivacySettingsFormData {
  profile_visibility: PrivacyLevel;
  posts_visibility: PrivacyLevel;
  albums_visibility: PrivacyLevel;
  blogs_visibility: PrivacyLevel;
  allow_friend_requests: boolean;
  allow_messages: boolean;
  show_online_status: boolean;
}

// 翻译相关类型定义
export interface Translation {
  id: string;
  source_text: string;
  target_text: string;
  source_lang: string;
  target_lang: string;
  translation_key: string;
  context: string | null;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export interface TranslationRequest {
  text: string;
  from?: string;
  to: string;
  context?: string;
}

export interface BatchTranslationRequest {
  texts: string[];
  from?: string;
  to: string;
  context?: string;
}

export interface TranslationResponse {
  source_text: string;
  target_text: string;
  from: string;
  to: string;
  cached: boolean;
}

export interface BatchTranslationResponse {
  translations: TranslationResponse[];
  total: number;
  cached: number;
  translated: number;
}

// 支持的语言
export type SupportedLanguage = 
  | 'en'  // 英语
  | 'zh'  // 中文
  | 'ja'  // 日语
  | 'ko'  // 韩语
  | 'fr'  // 法语
  | 'de'  // 德语
  | 'es'  // 西班牙语
  | 'ru'  // 俄语
  | 'pt'  // 葡萄牙语
  | 'ar'  // 阿拉伯语
  | 'it'  // 意大利语
  | 'th'  // 泰语
  | 'vi'; // 越南语

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// SEO 相关类型定义

// 更新频率类型
export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

// 重定向类型
export type RedirectType = 301 | 302 | 307 | 308;

// 全局 SEO 设置
export interface SEOSettings {
  id: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_author: string;
  og_image: string | null;
  twitter_handle: string | null;
  google_analytics_id: string | null;
  google_search_console_id: string | null;
  bing_webmaster_id: string | null;
  robots_txt: string;
  created_at: string;
  updated_at: string;
}

// 页面 SEO 设置
export interface PageSEO {
  id: string;
  page_path: string;
  page_title: string | null;
  page_description: string | null;
  page_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  canonical_url: string | null;
  noindex: boolean;
  nofollow: boolean;
  priority: number;
  change_frequency: ChangeFrequency;
  created_at: string;
  updated_at: string;
}

// URL 重定向
export interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  redirect_type: RedirectType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// SEO 设置表单数据
export interface SEOSettingsFormData {
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_author: string;
  og_image?: string;
  twitter_handle?: string;
  google_analytics_id?: string;
  google_search_console_id?: string;
  bing_webmaster_id?: string;
  robots_txt?: string;
}

// 页面 SEO 表单数据
export interface PageSEOFormData {
  page_path: string;
  page_title?: string;
  page_description?: string;
  page_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  noindex?: boolean;
  nofollow?: boolean;
  priority?: number;
  change_frequency?: ChangeFrequency;
}

// 重定向表单数据
export interface RedirectFormData {
  from_path: string;
  to_path: string;
  redirect_type: RedirectType;
  is_active: boolean;
}

// 站点地图条目
export interface SitemapEntry {
  page_path: string;
  page_title: string | null;
  priority: number;
  change_frequency: ChangeFrequency;
  updated_at: string;
  noindex: boolean;
}

// 结构化数据类型
export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

// 面包屑项
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// 微信配置类型
export type WeChatConfigType = 'miniprogram' | 'official_account';

// 微信配置
export interface WeChatConfig {
  id: string;
  type: WeChatConfigType;
  name: string;
  app_id: string;
  app_secret: string;
  token: string | null;
  encoding_aes_key: string | null;
  config_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// 微信配置表单数据
export interface WeChatConfigFormData {
  type: WeChatConfigType;
  name: string;
  app_id: string;
  app_secret: string;
  token?: string;
  encoding_aes_key?: string;
  config_data?: Record<string, unknown>;
  is_active?: boolean;
}

// 翊鸢化工相关类型
export interface YiyuanProduct {
  id: string;
  name_zh: string;
  name_en: string;
  description_zh: string | null;
  description_en: string | null;
  image_url: string | null;
  specifications_zh: string | null;
  specifications_en: string | null;
  features_zh: string[] | null;
  features_en: string[] | null;
  applications_zh: string[] | null;
  applications_en: string[] | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface YiyuanContent {
  id: string;
  section_key: string;
  title_zh: string | null;
  title_en: string | null;
  content_zh: string | null;
  content_en: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface YiyuanVerificationGuide {
  id: string;
  step_number: number;
  title_zh: string;
  title_en: string;
  description_zh: string | null;
  description_en: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface YiyuanManufacturer {
  id: string;
  standard_zh: string;
  standard_en: string;
  origin_zh: string;
  origin_en: string;
  company_name_zh: string;
  company_name_en: string;
  address_zh: string;
  address_en: string;
  website: string;
  email: string;
  created_at: string;
  updated_at: string;
}

