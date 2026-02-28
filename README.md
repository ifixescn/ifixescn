# 欢迎使用你的秒哒应用代码包
秒哒应用链接
    URL:https://www.miaoda.cn/projects/app-7fshtpomqha9

# CMS Content Management System

A modern content management system built with React, TypeScript, and Supabase. Features article publishing, product showcase, Q&A system, and more.

## Core Features

### User System
- ✅ User registration and login (username/password)
- ✅ Multi-role permission management (Admin, Editor, Member, Guest)
- ✅ First registered user automatically becomes admin

### Content Management
- ✅ Article publishing and display
- ✅ Article category management
- ✅ Article view statistics
- ✅ Rich text content support
- ✅ Article status management (Draft, Published, Offline)

### Product System
- ✅ Product information management
- ✅ Product image display (up to 5 images)
- ✅ Product categories and pricing
- ✅ Product view statistics
- ✅ Product detail pages

### Q&A System
- ✅ Member question submission
- ✅ Question review mechanism
- ✅ Answer and acceptance features
- ✅ Q&A category management
- ✅ Q&A status management

### Admin Panel
- ✅ Data statistics dashboard
- ✅ Article management (publish, edit, delete)
- ✅ Product management (publish, edit, delete, image management)
- ✅ Q&A management (review, answer)
- ✅ User management (role editing)
- ✅ Site settings (name, SEO, contact info)
- ✅ **Font system** (8 premium Google Fonts with live preview)

### Font System
- ✅ 8 carefully selected Google Fonts
- ✅ Visual font switcher in admin panel
- ✅ Real-time preview for all fonts
- ✅ Automatic font loading and application
- ✅ Supports multiple font weights (300-800)
- ✅ Optimized for performance with CDN delivery

**Available Fonts:**
- **Inter** - Modern, clean, professional (Default)
- **Poppins** - Geometric, friendly, modern
- **Roboto** - Classic, professional, highly readable
- **Montserrat** - Urban, stylish, elegant
- **Open Sans** - Humanist, friendly, versatile
- **Lato** - Warm, stable, corporate
- **Raleway** - Elegant, refined, premium
- **Nunito** - Rounded, friendly, modern

📖 See [FONT_GUIDE.md](./FONT_GUIDE.md) for detailed font comparison and usage guide.

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Storage)
- **Routing**: React Router
- **State Management**: React Context + Hooks

## Quick Start

### Requirements

```bash
Node.js >= 20
npm >= 10
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev -- --host 127.0.0.1
```

### Build for Production

```bash
npm run build
```

## User Guide

### First Time Setup

1. Visit the website homepage
2. Click "Login" button in the top right
3. Switch to "Register" tab
4. Enter username and password to complete registration
5. **The first registered user will automatically become admin**

### Admin Features

- Access admin panel (click "Admin Panel" button in top right)
- View data statistics dashboard
- Publish and manage articles
- Publish and manage products (including images)
- Review and manage Q&A
- Manage user permissions
- Configure site settings

### Editor Features

- Publish and manage content
- Review Q&A
- View data statistics

### Content Browsing

- Browse published articles
- View product information
- View approved Q&A

### Member Features

- Ask questions
- Answer questions
- View personal profile

## Admin Panel Features

### Dashboard
- Display total counts for articles, products, questions, and users
- Show total view statistics
- Quick action shortcuts

### Article Management
- Create new articles (HTML content support)
- Edit existing articles
- Delete articles
- Set article categories
- Manage article status (Draft/Published/Offline)
- Add cover images
- View statistics

### Product Management
- Create new products
- Edit product information
- Delete products
- Upload up to 5 product images
- Set product prices
- Manage product categories
- Manage product status

### Q&A Management
- Review pending questions
- Approve or reject questions
- View approved questions
- Manage question status
- View Q&A statistics

### User Management
- View all users
- Modify user roles
- View user registration info
- Role permission descriptions

### Site Settings
- Configure site name
- Set site description (SEO)
- Set site keywords
- Upload logo
- Configure contact information

### Font Settings
- Choose from 8 premium Google Fonts
- Real-time font preview
- Visual comparison of all fonts
- Instant application across the entire site
- Support for multiple font weights
- Optimized loading performance

**How to change fonts:**
1. Go to Admin Panel → Font Settings
2. Browse available fonts with live previews
3. Select your preferred font
4. Click "Save Settings"
5. Refresh the page to see changes

See [FONT_GUIDE.md](./FONT_GUIDE.md) for detailed font recommendations.

## Design Features

- 🎨 Blue and white color scheme, professional and modern
- 📱 Responsive layout, multi-device compatible
- 🎯 Card-based layout, clear hierarchy
- ✨ Rounded corners, soft shadows
- 🚀 Smooth animations, quality experience
- 🔒 Secure permission management
- 📊 Comprehensive data statistics

## Important Notes

1. **First User**: The first registered user automatically becomes admin, please keep the account secure
2. **Data Security**: System configured with RLS (Row Level Security) to ensure data access security
3. **Content Review**: Q&A system requires admin approval before public display
4. **Image Upload**: Product images added via URL, supports up to 5 images
5. **Rich Text Content**: Articles and product details support HTML format content

## Learn More

For more information, visit the [documentation](https://cloud.baidu.com/doc/MIAODA/s/Xmewgmsq7)
