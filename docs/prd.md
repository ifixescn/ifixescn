# CMS Content Management System Requirements Document (Baidu Yun Ma Migration Version with Article Scraping Plugin)\n
## 1. System Overview
### 1.1 System Name
CMS Content Management System with Modern Enterprise Homepage Slider, Product Recommendations, Advanced Social Network Platform, AI Member Generation, AI Content Generation, Global Multi-Language Translation Plugin, Q&A Module with Member-Restricted Media Upload, Enhanced Category List Page Sidebar, Development Activity Logging, SEO Optimization, Baidu Yun Ma Cloud Migration, and Article Scraping Plugin

### 1.2 System Description
A comprehensive CMS content management system developed based on PHP+MySQL, featuring enhanced homepage with modern enterprise slider system, independent editable backend interface, optimized English layout as default frontend language, advanced social network platform capabilities with robust database architecture, advanced member center, comprehensive management backend, AI-powered member generation system, AI content generation engine, integrated global multi-language translation plugin, Q&A module with rich media upload capabilities restricted to members and above, enhanced Q&A category list page with dual-panel sidebar featuring category navigation and latest product showcase, an integrated development activity logging system, full support for migration and deployment on Baidu Yun Ma cloud platform, comprehensive SEO optimization features for improved search engine visibility, and an article scraping plugin for automated content acquisition.\n
## 2. Article Scraping Plugin Features
### 2.1 Scraping Capabilities
- **URL Input**: Enter the URL of the target article page for scraping (e.g., https://www.ifixit.com/Guide/iPhone+11+Battery+Replacement/127450)\n- **Content Extraction**: Automatically extracts article title, body text, and images from the source website
- **Source Attribution**: Automatically generates and displays the source website information and link
- **Image Localization**: Downloads and stores external images locally within the system

### 2.2 Scraping Methods
- **Visual Scraping**: User-friendly interface for selecting and configuring the elements to scrape through visual selection
- **Code-Based Scraping**: Advanced option for defining scraping rules using code structures
- **Regular Updates**: Scheduled automatic scraping for regularly updated content sources

### 2.3 Integration with Article Module
- **Automatic Publication**: Scraped articles can be automatically published to the CMS article module under the guides category
- **Tag and Category Assignment**: Supports automatic tagging and categorization based on predefined rules, with articles from ifixit.com automatically assigned to the guides category
- **Author Attribution**: Assigns scraped articles to designated authors within the system
- **SEO Optimization**: Automatically applies SEO settings consistent with other articles

### 2.4 Management Features
- **Scraping Task Management**: View, edit, and delete scraping tasks
- **History Records**: Keeps records of all scraped articles with timestamps
- **Error Logging**: Tracks and displays scraping errors for troubleshooting
- **Batch Operations**: Supports batch deletion and re-scraping of multiple tasks

### 2.5 Advanced Anti-Detection Features
- **Visual Scraping Component**: Integrated visual scraping tool for intuitive element selection
- **Simulated Human Copying**: Mimics human browsing behavior to evade website anti-scraping mechanisms
- **Anti-Detection Optimization**: Based on historical experience, enhances the plugin's ability to bypass target site anti-scraping measures
- **Behavior Simulation**: Includes random pauses, variable request intervals, and user-agent rotation to appear more human-like

### 2.6 Local HTML Editor Feature
- **HTML Editor Integration**: In the backend, provide an HTML editor for copying target content locally
- **Publishing Options**: Allow simultaneous selection to publish to the article module
- **AI Smart Formatting**: Automatically format the copied content using AI
- **File Localization**: Automatically localize the copied files

### 2.7 TXT File Creation Feature
- **File Location**: Create a TXT file in the website root directory
- **File Naming**: Name the file using the following information: 5ad6780caefa67ded91cac16c02894ff.txt
- **File Content**: The TXT file should contain the following content: 21334f9819348e96c52bb6a58f9342b6fa5bf606

## 3. Updated Backend Management Features
### 3.1 Scraping Plugin Backend
- **Dashboard Overview**: Displays statistics on total scraped articles, successful rate, and recent activity
- **Task List**: Centralized management of all scraping tasks with status indicators
- **Template Management**: Creates and saves scraping templates for recurring use
- **Log Viewer**: Detailed logs for each scraping task including success/failure status and error messages
- **Visual Scraping Interface**: Integrated visual component for selecting and configuring scrape elements

### 3.2 HTML Editor Backend
- **Integrated Editor**: Provides a rich text HTML editor within the backend interface
- **Content Paste Function**: Supports pasting content from external sources
- **AI Formatting Tool**: Built-in AI functionality to automatically format pasted content
- **Localization Feature**: Automatically localizes external resources (images, links) to the system
- **Publishing Integration**: Direct publishing option to the article module from the editor
- **Preview Mode**: Real-time preview of formatted content
- **History Tracking**: Keeps track of editing history and changes

### 3.3 Integration with Existing Modules
- **Seamless Transition**: Smooth integration between scraping plugin and article module
- **Unified Interface**: Consistent design language with existing backend interfaces
- **Role-Based Access**: Controls who can access and manage scraping functions
- **Permission Settings**: Granular permissions for creating, editing, and deleting scraping tasks

## 4. Enhanced SEO Features for Product Module
### 4.1 Product Module Classification Optimization
- **Hierarchical Category Structure**: Implement a clear, nested category system with parent-child relationships to improve site navigation and SEO hierarchy
- **Category Meta Information**: Allow administrators to set SEO titles, descriptions, and keywords for each product category
- **Breadcrumb Navigation**: Display breadcrumb trails on product category pages to enhance user experience and provide search engines with contextual information
- **Category Page Content**: Encourage adding descriptive text to category pages to provide relevant content for search engines

### 4.2 Product Content Page SEO Enhancements
- **Product Page Meta Tags**: Enable customization of SEO titles, descriptions, and keywords for individual product pages
- **Structured Data Markup**: Automatically generate schema.org product structured data to improve search result rich snippets
- **Product Image Alt Text**: Require and populate alt text for product images to improve image search visibility and provide context to search engines
- **Canonical URLs**: Automatically generate and implement canonical tags to prevent duplicate content issues
- **Internal Linking**: Suggest and facilitate linking between related products and categories to strengthen site internal linking structure

### 4.3 URL Structure Optimization
- **Clean URLs**: Use descriptive, keyword-relevant, and human-readable URLs for both categories and product pages
- **URL Slugs**: Allow custom URL slugs based on product titles and category names
- **Permalinks**: Ensure stable URLs that do not change after product creation or updates

### 4.4 Mobile-Friendly and Responsive Design
- **Mobile Optimization**: Ensure product pages and categories are fully responsive and mobile-friendly, as mobile-friendliness is a key SEO ranking factor
- **Fast Page Speed**: Optimize image sizes, enable browser caching, and minimize code to improve page load times

### 4.5 Product Search and Filter Functionality
- **Robust Search**: Implement a powerful site search feature that allows users to find products easily, with search results pages properly indexed by search engines
- **Filter Options**: Provide filtering options by category, price, attributes, and other criteria to improve user navigation and create filter-based category pages that can be indexed

### 4.6 Product Module Integration with Global SEO System
- **Consistent SEO Settings**: Ensure product module SEO features are consistent with the global SEO management system, allowing for unified control over title templates, meta description formats, and keyword strategies
- **Automated SEO Generation**: For newly added products, automatically generate default SEO titles and descriptions based on product names, categories, and other available data
- **Bulk SEO Editing**: Provide tools for batch editing SEO information across multiple products or categories to streamline SEO maintenance

## 5. Search Engine Submission Features
### 5.1 Global Search Engine Submission
- **Google Search Console**: Automatically submit the domain www.ifixescn.com to Google Search Console for global search engine indexing
- **Bing Webmaster Tools**: Submit the domain to Bing Webmaster Tools for global search engine coverage
- **Yandex Webmaster Tools**: Ensure inclusion in Yandex search results through automatic submission

### 5.2 Domestic Search Engine Submission
- **Baidu Webmaster Platform**: Submit the domain www.ifixescn.com to Baidu Webmaster Platform for domestic Chinese search engine indexing
- **360 Search**: Ensure inclusion in 360 search results
- **Sogou Search**: Submit the domain to Sogou Webmaster Services
- **Qihoo 360 Search**: Ensure comprehensive coverage in Qihoo 360 search results

### 5.3 Automated Sitemap Submission
- **Sitemap Generation**: Automatically generate XML sitemaps for the entire website, including article pages, product pages, category pages, and other key content
- **Search Engine Notification**: Automatically notify major search engines (Google, Baidu, Bing, etc.) about the updated sitemap locations to facilitate regular crawling and indexing

### 5.4 SEO Status Monitoring
- **Submission Status Tracking**: Display the submission status for each search engine (submitted, pending, completed)\n- **Indexing Progress**: Monitor and display the number of indexed pages for each search engine
- **Crawl Errors**: Track and display any crawl errors reported by search engines

## 6. Privacy Policy and Terms of Service
### 6.1 International English Pages
- **Privacy Policy Page**: Create an international通用的英文页面 for Privacy Policy with comprehensive information about data collection, usage, sharing, security, cookies, and user rights
- **Terms of Service Page**: Create an international通用的英文页面 for Terms of Service outlining the rules, responsibilities, and obligations for users accessing and using the platform

### 6.2 Page Integration
- **Login Page Link**: Add links to Privacy Policy and Terms of Service pages in the login page footer or header
- **Footer Links**: Add links to Privacy Policy and Terms of Service pages in the website footer, ensuring easy accessibility for users

### 6.3 Language Consistency
- **Whole Site English Extension**: Extend the entire website to use English as the default language, ensuring consistency across all pages and modules
- **Translated Content**: Provide translated content for Privacy Policy and Terms of Service in English, maintaining legal accuracy and clarity

## 7. Homepage Banner Slider System
### 7.1 Banner Slider Features
- **International Brand Style**: Adopt a high-end, atmospheric banner slider with an international brand image, featuring rolling slide show functionality
- **English Display**: All content on the banner slider is presented in English
- **Backend Editing**: Provide comprehensive backend management and editing functions for banner content
- **Consistent Design Language**: Ensure the banner slider design seamlessly integrates with the overall station English style

### 7.2 Slider Content Management
- **Slide Creation**: Administrators can create new slides with title, subtitle, description, and call-to-action buttons
- **Image Upload**: Support uploading high-quality images for each slide
- **Content Editing**: Easily edit slide text, images, and links directly in the backend
- **Slide Ordering**: Rearrange the display order of slides as needed
- **Slide Status**: Control slide visibility (active/inactive)\n
### 7.3 Slide Display Settings
- **Automatic Rotation**: Set rotation interval and transition effects
- **Slide Indicators**: Display pagination dots or thumbnails
- **Control Buttons**: Provide previous/next navigation buttons
- **Responsive Design**: Ensure smooth display across desktop, tablet, and mobile devices

### 7.4 Integration with Website
- **Homepage Hero Section**: Replace the existing homepage framework with the new banner slider as the primary visual element
- **Seamless Transition**: Ensure smooth integration with surrounding content and overall website design
- **Accessibility**: Ensure compliance with accessibility standards for screen readers and keyboard navigation

## 8. Yiyuan Chemical Product Page
### 8.1 Page Overview
- **Page URL**: /yiyuan
- **Page Name**: 翊鸢化工产品页面 (Yiyuan Chemical Product Page)\n- **Page Type**: 产品详情页
- **Template**: 商务科技大气模板
- **Language Support**: 支持中文、英文等二十多种国际语言可供选择和编辑

### 8.2 Page Content
- **公司名称**: 翊鸢化工 (Yiyuan Chemical)\n- **产品展示**: 展示翊鸢化工的主要产品信息,包括产品图片、产品名称、产品规格、产品参数等
- **防伪验证说明功能**: 提供产品防伪验证入口,用户可通过输入防伪码、扫描二维码等方式验证产品真伪
- **产品详情**: 包含产品介绍、使用说明、包装规格、储存运输等信息
- **联系方式**: 展示翊鸢化工的联系信息,包括电话、邮箱、地址等

### 8.3 后台管理功能
- **产品管理**: 管理员可在后台添加、编辑、删除产品信息,包括产品图片、名称、规格、参数等
- **防伪码管理**: 生成和管理产品防伪码,支持批量生成和单个添加
- **验证记录**: 查看产品的防伪验证记录,包括验证时间、验证方式、验证结果等
- **多语言编辑**: 支持二十多种国际语言内容的编辑和管理,包括中文、英文、法语、西班牙语、葡萄牙语、俄语、阿拉伯语、日语、韩语、德语、意大利语、荷兰语、瑞典语、挪威语、芬兰语、丹麦语、波兰语、捷克语、匈牙利语、土耳其语、希腊语、泰语、越南语、印尼语、马来语、希伯来语、波斯语、乌克兰语、罗马尼亚语、保加利亚语、斯洛伐克语、斯洛文尼亚语、克罗地亚语、塞尔维亚语、阿尔巴尼亚语、爱沙尼亚语、拉脱维亚语、立陶宛语、冰岛语、爱尔兰语、威尔士语、加泰罗尼亚语、加利西亚语、巴斯克语、科西嘉语、法罗语、马耳他语、卢森堡语、巴斯克语、加泰罗尼亚语、加利西亚语、巴斯克语、科西嘉语、法罗语、马耳他语、卢森堡语、巴斯克语、加泰罗尼亚语、加利西亚语、巴斯克语、科西嘉语、法罗语、马耳他语、卢森堡语等

## 9. Remaining Chapters
### 9.1 Advanced Site Search System
### 9.2 Baidu Yun Ma Cloud Migration Features
### 9.3 Updated Backend Management Features
### 9.4 Design Style Adjustments for Cloud Management
### 9.5 Multi-Language Translation Plugin Features
### 9.6 Translation Plugin Administrator Management
### 9.7 Integration and Compatibility
### 9.8 SEO Optimization Features
### 9.9 Enhanced Backend SEO Management
### 9.10 Download Module Features
### 9.11 Video Module Features