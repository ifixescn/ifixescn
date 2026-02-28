# 欢迎使用你的秒哒应用代码包
秒哒应用链接
    URL:https://www.miaoda.cn/projects/app-7fshtpomqha9

# 翊鸢化工静态网页 - HTML5版本

## 📦 包含文件

- `yiyuan-static.html` - 翊鸢化工产品展示页面（HTML5静态版本）
- `README.md` - 使用说明文档
- `使用说明.txt` - 简要使用说明

## 🌍 支持的语言（25种）

本页面支持以下25种国际语言的实时切换：

1. 🇨🇳 中文 (Chinese)
2. 🇬🇧 English (英语)
3. 🇯🇵 日本語 (日语)
4. 🇰🇷 한국어 (韩语)
5. 🇫🇷 Français (法语)
6. 🇩🇪 Deutsch (德语)
7. 🇪🇸 Español (西班牙语)
8. 🇮🇹 Italiano (意大利语)
9. 🇵🇹 Português (葡萄牙语)
10. 🇷🇺 Русский (俄语)
11. 🇸🇦 العربية (阿拉伯语)
12. 🇮🇳 हिन्दी (印地语)
13. 🇹🇭 ไทย (泰语)
14. 🇻🇳 Tiếng Việt (越南语)
15. 🇮🇩 Bahasa Indonesia (印尼语)
16. 🇲🇾 Bahasa Melayu (马来语)
17. 🇹🇷 Türkçe (土耳其语)
18. 🇵🇱 Polski (波兰语)
19. 🇳🇱 Nederlands (荷兰语)
20. 🇸🇪 Svenska (瑞典语)
21. 🇩🇰 Dansk (丹麦语)
22. 🇳🇴 Norsk (挪威语)
23. 🇫🇮 Suomi (芬兰语)
24. 🇬🇷 Ελληνικά (希腊语)
25. 🇮🇱 עברית (希伯来语)

## ✨ 功能特点

### 1. 多语言支持
- ✅ 25种国际语言实时切换
- ✅ 自动保存用户语言偏好（localStorage）
- ✅ 优雅的语言选择器界面
- ✅ 所有内容完整翻译（包括产品信息、规格、特点、应用领域等）

### 2. 响应式设计
- ✅ 完美适配桌面端、平板、手机
- ✅ 移动端优化的触摸交互
- ✅ 自适应布局和字体大小

### 3. 产品展示
- ✅ 高清产品图片展示
- ✅ 详细的产品规格说明
- ✅ 产品特点列表
- ✅ 应用领域标签

### 4. 防伪验证
- ✅ 完整的防伪验证流程说明
- ✅ 图文并茂的操作指南
- ✅ 多语言防伪说明

### 5. 生产商信息
- ✅ 公司简介
- ✅ 联系方式
- ✅ 地址信息

### 6. 技术特性
- ✅ 纯HTML5 + CSS3 + JavaScript
- ✅ 使用Tailwind CSS CDN（无需本地安装）
- ✅ 无需服务器，可直接打开使用
- ✅ 无外部依赖，完全独立运行
- ✅ 快速加载，性能优异

## 🚀 使用方法

### 方法一：直接打开（推荐）
1. 解压下载的压缩包
2. 双击 `yiyuan-static.html` 文件
3. 文件将在默认浏览器中打开
4. 点击右上角的语言选择器切换语言

### 方法二：部署到Web服务器
1. 将 `yiyuan-static.html` 上传到您的Web服务器
2. 通过URL访问该文件
3. 例如：`https://yourdomain.com/yiyuan-static.html`

### 方法三：部署到静态网站托管
支持部署到以下平台：
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- 阿里云OSS
- 腾讯云COS
- 百度云BOS

## 📱 浏览器兼容性

支持所有现代浏览器：
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+
- ✅ 移动端浏览器（iOS Safari, Chrome Mobile, Samsung Internet等）

## 🎨 自定义修改

### 修改产品图片
找到HTML文件中的图片URL：
```html
<img src="https://miaoda-site-img.cdn.bcebos.com/images/..." alt="翊鸢化工产品" />
```
替换为您自己的图片URL或本地图片路径。

### 修改颜色主题
在HTML文件的 `<script>` 标签中找到 `tailwind.config`，修改颜色配置：
```javascript
colors: {
    primary: {
        DEFAULT: "hsl(222.2 47.4% 11.2%)", // 主色调
        foreground: "hsl(210 40% 98%)",
    },
    // ... 其他颜色
}
```

### 修改翻译内容
在HTML文件的 `translations` 对象中找到对应的语言代码，修改翻译文本：
```javascript
const translations = {
    productName: {
        zh: '翊鸢牌摄像头免拆洗稀溶剂',
        en: 'Yiyuan Camera Lens Cleaning Solvent',
        // ... 其他语言
    }
}
```

### 添加新语言
1. 在 `translations.languages` 数组中添加新语言：
```javascript
{ code: 'xx', name: 'Language Name', nativeName: 'Native Name' }
```

2. 在所有翻译对象中添加该语言的翻译：
```javascript
productName: {
    // ... 现有语言
    xx: 'Your Translation'
}
```

## 📊 文件信息

- **文件大小**: 约 67KB
- **加载时间**: < 1秒（取决于网络速度）
- **依赖**: Tailwind CSS CDN（自动加载）
- **兼容性**: HTML5标准

## 🔧 技术栈

- **HTML5**: 语义化标签，结构清晰
- **CSS3**: 现代样式，动画效果
- **JavaScript ES6+**: 模块化代码，易于维护
- **Tailwind CSS**: 实用优先的CSS框架
- **响应式设计**: 移动端优先

## 📝 更新日志

### v1.0.0 (2026-01-17)
- ✅ 初始版本发布
- ✅ 支持25种国际语言
- ✅ 完整的产品展示功能
- ✅ 防伪验证指南
- ✅ 响应式设计
- ✅ 语言偏好保存

## 💡 常见问题

### Q: 为什么语言切换后刷新页面还是之前的语言？
A: 页面会自动保存您的语言偏好到浏览器的localStorage中，刷新后会自动加载上次选择的语言。

### Q: 可以离线使用吗？
A: 可以！但首次打开需要联网加载Tailwind CSS。加载后可以离线使用。如需完全离线，可以下载Tailwind CSS到本地。

### Q: 如何修改产品信息？
A: 直接编辑HTML文件中的 `translations` 对象，找到对应的字段进行修改。

### Q: 支持添加更多语言吗？
A: 支持！按照"添加新语言"部分的说明操作即可。

### Q: 图片加载很慢怎么办？
A: 可以将图片下载到本地，然后修改HTML中的图片路径为本地路径。

### Q: 可以修改页面样式吗？
A: 可以！页面使用Tailwind CSS，您可以直接修改HTML中的class类名来调整样式。

## 📞 技术支持

如有任何问题或建议，请联系：
- 📧 邮箱: support@yiyuan-chemical.com
- 🌐 网站: www.yiyuan-chemical.com
- 📱 电话: +86 XXX-XXXX-XXXX

## 📄 许可证

本静态页面仅供翊鸢化工产品展示使用。
未经授权，请勿用于其他商业用途。

---

**翊鸢化工** - 专业研发用于手机维修领域的化工产品

© 2026 Yiyuan Chemical. All rights reserved.
