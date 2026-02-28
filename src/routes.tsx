import type { ReactNode } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import MemberCenter from './pages/MemberCenter';
import Search from './pages/Search';
import Sitemap from './pages/Sitemap';
import VerificationFile from './pages/VerificationFile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductsByCategory from './pages/ProductsByCategory';
import Downloads from './pages/Downloads';
import DownloadDetail from './pages/DownloadDetail';
import DownloadsByCategory from './pages/DownloadsByCategory';
import Videos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import VideosByCategory from './pages/VideosByCategory';
import Questions from './pages/Questions';
import QuestionDetail from './pages/QuestionDetail';
import QuestionsByCategory from './pages/QuestionsByCategory';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductsModule from './pages/admin/ProductsModule';
import DownloadsModule from './pages/admin/DownloadsModule';
import VideosModule from './pages/admin/VideosModule';
import QuestionsModule from './pages/admin/QuestionsModule';
import MembersManage from './pages/admin/MembersManage';
import SnsManage from './pages/admin/SnsManage';
import SearchStats from './pages/admin/SearchStats';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import SystemSettings from './pages/admin/SystemSettings';
import FooterSettings from './pages/admin/FooterSettings';
import FontSettings from './pages/admin/FontSettings';
import AITemplatesPage from './pages/admin/ai-templates/AITemplatesPage';
import AIBatchGenerationPage from './pages/admin/ai-batch-generation/AIBatchGenerationPage';
import AIBatchGenerationDetailPage from './pages/admin/ai-batch-generation/AIBatchGenerationDetailPage';
import UserProfilePage from './pages/profile/UserProfilePage';
import MessagesPage from './pages/messages/MessagesPage';
import ProfileSettingsPage from './pages/member-settings/ProfileSettingsPage';
import ProfileManagementPage from './pages/admin/profile-management/ProfileManagementPage';
import WelcomeMessageSettings from './pages/admin/WelcomeMessageSettings';
import GlobalSEOSettings from './pages/admin/seo/GlobalSEOSettings';
import PageSEOManagement from './pages/admin/seo/PageSEOManagement';
import RedirectManagement from './pages/admin/seo/RedirectManagement';
import SitemapManagement from './pages/admin/seo/SitemapManagement';
import VerificationFilesManage from './pages/admin/VerificationFilesManage';
import WeChatConfigManage from './pages/admin/WeChatConfigManage';
import Yiyuan from './pages/Yiyuan';
import YiyuanManage from './pages/admin/YiyuanManage';
import DatabaseExport from './pages/admin/DatabaseExport';


export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <Home />
  },
  {
    name: 'Products',
    path: '/products',
    element: <Products />
  },
  {
    name: 'Product Category',
    path: '/products/category/:categoryId',
    element: <ProductsByCategory />,
    visible: false
  },
  {
    name: 'Product Detail',
    path: '/products/:slug',
    element: <ProductDetail />,
    visible: false
  },
  {
    name: 'Download',
    path: '/downloads',
    element: <Downloads />
  },
  {
    name: 'DownloadDetail',
    path: '/downloads/:id',
    element: <DownloadDetail />,
    visible: false
  },
  {
    name: 'DownloadCategory',
    path: '/downloads/category/:categoryId',
    element: <DownloadsByCategory />,
    visible: false
  },
  {
    name: 'Videos',
    path: '/videos',
    element: <Videos />
  },
  {
    name: 'Video Detail',
    path: '/videos/:id',
    element: <VideoDetail />,
    visible: false
  },
  {
    name: 'Video Category',
    path: '/videos/category/:categoryId',
    element: <VideosByCategory />,
    visible: false
  },
  {
    name: 'Q&A',
    path: '/questions',
    element: <Questions />
  },
  {
    name: 'Q&ADetail',
    path: '/questions/:id',
    element: <QuestionDetail />,
    visible: false
  },
  {
    name: 'Q&ACategory',
    path: '/questions/category/:categoryId',
    element: <QuestionsByCategory />,
    visible: false
  },
  {
    name: 'Yiyuan Chemical',
    path: '/yiyuan',
    element: <Yiyuan />,
    visible: false
  },
  {
    name: 'Search',
    path: '/search',
    element: <Search />,
    visible: false
  },
  {
    name: 'Sitemap',
    path: '/sitemap.xml',
    element: <Sitemap />,
    visible: false
  },
  {
    name: 'Privacy Policy',
    path: '/privacy',
    element: <PrivacyPolicy />,
    visible: false
  },
  {
    name: 'Terms of Service',
    path: '/terms',
    element: <TermsOfService />,
    visible: false
  },
  {
    name: 'Verification File (Legacy)',
    path: '/5ad6780caefa67ded91cac16c02894ff.txt',
    element: <VerificationFile />,
    visible: false
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
    visible: false
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: <ForgotPassword />,
    visible: false
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPassword />,
    visible: false
  },
  {
    name: 'Verify Email',
    path: '/verify-email',
    element: <VerifyEmail />,
    visible: false
  },
  {
    name: 'Member Center',
    path: '/profile',
    element: <MemberCenter />,
    visible: false
  },
  {
    name: 'User Profile',
    path: '/profile/:userId',
    element: <UserProfilePage />,
    visible: false
  },
  {
    name: 'Profile Settings',
    path: '/member/profile-settings',
    element: <ProfileSettingsPage />,
    visible: false
  },
  {
    name: 'Messages',
    path: '/messages',
    element: <MessagesPage />,
    visible: false
  },
  {
    name: 'Conversation',
    path: '/messages/:userId',
    element: <MessagesPage />,
    visible: false
  },
  {
    name: 'Member Dashboard',
    path: '/member-center',
    element: <MemberCenter />,
    visible: false
  },
  {
    name: 'Admin Panel',
    path: '/admin',
    element: <AdminLayout />,
    visible: false,
    children: [
      {
        name: 'Dashboard',
        path: '',
        element: <Dashboard />
      },
      {
        name: 'Welcome Message Settings',
        path: 'welcome-message',
        element: <WelcomeMessageSettings />
      },
      {
        name: 'Profile Management',
        path: 'profile-management',
        element: <ProfileManagementPage />
      },
      {
        name: 'Product Management',
        path: 'products',
        element: <ProductsModule />
      },
      {
        name: 'Download Management',
        path: 'downloads',
        element: <DownloadsModule />
      },
      {
        name: 'Video Management',
        path: 'videos',
        element: <VideosModule />
      },
      {
        name: 'Q&A Management',
        path: 'questions',
        element: <QuestionsModule />
      },
      {
        name: 'Member Management',
        path: 'members',
        element: <MembersManage />
      },
      {
        name: 'SNS Management',
        path: 'sns-manage',
        element: <SnsManage />
      },
      {
        name: 'SearchStatistics',
        path: 'search-stats',
        element: <SearchStats />
      },
      {
        name: 'Analytics',
        path: 'analytics',
        element: <Analytics />
      },
      {
        name: '字体Settings',
        path: 'font-settings',
        element: <FontSettings />
      },
      {
        name: 'Page脚Settings',
        path: 'footer-settings',
        element: <FooterSettings />
      },
      {
        name: 'System Settings',
        path: 'system-settings',
        element: <SystemSettings />
      },
      {
        name: 'Global SEO Settings',
        path: 'seo/settings',
        element: <GlobalSEOSettings />
      },
      {
        name: 'Page SEO Management',
        path: 'seo/pages',
        element: <PageSEOManagement />
      },
      {
        name: 'Redirect Management',
        path: 'seo/redirects',
        element: <RedirectManagement />
      },
      {
        name: 'Sitemap Management',
        path: 'seo/sitemap',
        element: <SitemapManagement />
      },
      {
        name: 'Verification Files',
        path: 'verification-files',
        element: <VerificationFilesManage />
      },
      {
        name: 'WeChat Config',
        path: 'wechat-config',
        element: <WeChatConfigManage />
      },
      {
        name: 'Yiyuan Management',
        path: 'yiyuan-manage',
        element: <YiyuanManage />
      },
      {
        name: 'Database Export',
        path: 'database-export',
        element: <DatabaseExport />
      },
      {
        name: 'Site Settings',
        path: 'settings',
        element: <Settings />
      }
    ]
  }
];

export default routes;