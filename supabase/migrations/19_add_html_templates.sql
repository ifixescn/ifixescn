/*
# 添加HTML格式的动态模版

## 1. 说明
- 添加可在前端动态渲染的HTML模版
- 支持模版变量替换，如 {{title}}, {{description}} 等
- 管理员可以在后台修改这些模版，前端会自动加载最新内容

## 2. 模版类别
- banner: 首页横幅模版
- article-card: 文章卡片模版
- product-card: 产品卡片模版
- custom-section: 自定义区块模版

## 3. 使用方式
- 在前端使用 TemplateRenderer 组件加载模版
- 传入 category 和可选的 name 参数
- 传入 data 对象用于变量替换
*/

-- 插入HTML格式的动态模版
INSERT INTO templates (name, description, file_path, content, file_type, category) VALUES
(
  '首页横幅HTML模版',
  '首页顶部横幅区域，支持变量: {{siteName}}, {{description}}',
  'templates/banner/home-banner.html',
  E'<div class="relative py-20 px-4 overflow-hidden">\n  <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background"></div>\n  <div class="container mx-auto relative z-10">\n    <div class="max-w-4xl mx-auto text-center space-y-6">\n      <h1 class="text-4xl xl:text-6xl font-bold tracking-tight">\n        <span class="gradient-text">{{siteName}}</span>\n      </h1>\n      <p class="text-xl xl:text-2xl text-muted-foreground">\n        {{description}}\n      </p>\n      <div class="flex flex-wrap gap-4 justify-center pt-4">\n        <a href="/articles" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">\n          浏览文章\n        </a>\n        <a href="/products" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8">\n          查看产品\n        </a>\n      </div>\n    </div>\n  </div>\n</div>',
  'html',
  'banner'
),
(
  '通知横幅模版',
  '页面顶部通知横幅，支持变量: {{message}}, {{linkText}}, {{linkUrl}}',
  'templates/banner/notice-banner.html',
  E'<div class="bg-primary text-primary-foreground py-3 px-4">\n  <div class="container mx-auto">\n    <div class="flex items-center justify-center gap-4 text-sm xl:text-base">\n      <span>{{message}}</span>\n      <a href="{{linkUrl}}" class="underline hover:no-underline font-medium">\n        {{linkText}}\n      </a>\n    </div>\n  </div>\n</div>',
  'html',
  'banner'
),
(
  '特色区块模版',
  '展示网站特色功能，支持变量: {{title}}, {{subtitle}}, {{feature1}}, {{feature2}}, {{feature3}}',
  'templates/section/features.html',
  E'<div class="py-16 px-4">\n  <div class="container mx-auto">\n    <div class="text-center mb-12">\n      <h2 class="text-3xl xl:text-4xl font-bold mb-4">{{title}}</h2>\n      <p class="text-xl text-muted-foreground">{{subtitle}}</p>\n    </div>\n    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">\n      <div class="text-center p-6 rounded-lg border bg-card">\n        <div class="text-4xl mb-4">📝</div>\n        <h3 class="text-xl font-semibold mb-2">{{feature1}}</h3>\n        <p class="text-muted-foreground">专业的内容管理和发布系统</p>\n      </div>\n      <div class="text-center p-6 rounded-lg border bg-card">\n        <div class="text-4xl mb-4">📦</div>\n        <h3 class="text-xl font-semibold mb-2">{{feature2}}</h3>\n        <p class="text-muted-foreground">完善的产品展示和管理功能</p>\n      </div>\n      <div class="text-center p-6 rounded-lg border bg-card">\n        <div class="text-4xl mb-4">💬</div>\n        <h3 class="text-xl font-semibold mb-2">{{feature3}}</h3>\n        <p class="text-muted-foreground">互动问答社区系统</p>\n      </div>\n    </div>\n  </div>\n</div>',
  'html',
  'section'
),
(
  '统计数据展示模版',
  '展示网站统计数据，支持变量: {{articles}}, {{products}}, {{questions}}, {{users}}',
  'templates/section/stats.html',
  E'<div class="py-12 px-4 bg-muted/50">\n  <div class="container mx-auto">\n    <div class="grid grid-cols-2 xl:grid-cols-4 gap-8">\n      <div class="text-center">\n        <div class="text-4xl xl:text-5xl font-bold text-primary mb-2">{{articles}}</div>\n        <div class="text-muted-foreground">文章数量</div>\n      </div>\n      <div class="text-center">\n        <div class="text-4xl xl:text-5xl font-bold text-primary mb-2">{{products}}</div>\n        <div class="text-muted-foreground">产品数量</div>\n      </div>\n      <div class="text-center">\n        <div class="text-4xl xl:text-5xl font-bold text-primary mb-2">{{questions}}</div>\n        <div class="text-muted-foreground">问答数量</div>\n      </div>\n      <div class="text-center">\n        <div class="text-4xl xl:text-5xl font-bold text-primary mb-2">{{users}}</div>\n        <div class="text-muted-foreground">用户数量</div>\n      </div>\n    </div>\n  </div>\n</div>',
  'html',
  'section'
),
(
  'CTA行动号召模版',
  '引导用户行动的区块，支持变量: {{title}}, {{description}}, {{buttonText}}, {{buttonUrl}}',
  'templates/section/cta.html',
  E'<div class="py-20 px-4">\n  <div class="container mx-auto">\n    <div class="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12 border border-primary/20">\n      <h2 class="text-3xl xl:text-4xl font-bold mb-4">{{title}}</h2>\n      <p class="text-xl text-muted-foreground mb-8">{{description}}</p>\n      <a href="{{buttonUrl}}" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 text-lg">\n        {{buttonText}}\n      </a>\n    </div>\n  </div>\n</div>',
  'html',
  'section'
);
