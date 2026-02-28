# 翊鸢化工静态页面使用说明

## 📋 文件说明

本目录包含翊鸢化工页面的HTML静态版本，可以直接在浏览器中打开使用，无需任何服务器或构建工具。

### 文件列表
- `yiyuan-static.html` - 翊鸢化工静态页面（单文件版本）
- `README_YIYUAN_STATIC.md` - 本说明文档

## ✨ 功能特性

### 1. 完整的多语言支持
- ✅ 支持25种国际语言
- ✅ 实时语言切换，无需刷新页面
- ✅ 美观的语言选择器界面
- ✅ 所有内容都有完整翻译

### 2. 响应式设计
- ✅ 完美适配桌面端（1920px、1440px、1366px等）
- ✅ 完美适配移动端（iPhone、Android等）
- ✅ 平板设备友好
- ✅ 流畅的动画效果

### 3. 完整的页面内容
- ✅ Hero区域展示
- ✅ 产品信息展示（名称、描述、规格、特点、应用领域）
- ✅ 防伪验证指南（4个步骤）
- ✅ 生产商信息展示
- ✅ 温馨提示

### 4. 现代化UI设计
- ✅ 使用Tailwind CSS框架
- ✅ 渐变色按钮和卡片
- ✅ 流畅的过渡动画
- ✅ 美观的图标和徽章

## 🚀 使用方法

### 方法1：直接打开
1. 找到 `yiyuan-static.html` 文件
2. 双击文件，使用默认浏览器打开
3. 开始使用！

### 方法2：通过Web服务器
```bash
# 使用Python启动简单的HTTP服务器
cd /path/to/directory
python3 -m http.server 8000

# 然后在浏览器中访问
# http://localhost:8000/yiyuan-static.html
```

### 方法3：部署到服务器
1. 将 `yiyuan-static.html` 上传到您的Web服务器
2. 通过URL访问该文件
3. 例如：`https://yourdomain.com/yiyuan-static.html`

## 🌍 支持的25种语言

| 序号 | 语言代码 | 语言名称 | 本地名称 |
|------|---------|---------|---------|
| 1 | zh | Chinese | 中文 |
| 2 | en | English | English |
| 3 | ja | Japanese | 日本語 |
| 4 | ko | Korean | 한국어 |
| 5 | fr | French | Français |
| 6 | de | German | Deutsch |
| 7 | es | Spanish | Español |
| 8 | it | Italian | Italiano |
| 9 | pt | Portuguese | Português |
| 10 | ru | Russian | Русский |
| 11 | ar | Arabic | العربية |
| 12 | hi | Hindi | हिन्दी |
| 13 | th | Thai | ไทย |
| 14 | vi | Vietnamese | Tiếng Việt |
| 15 | id | Indonesian | Bahasa Indonesia |
| 16 | ms | Malay | Bahasa Melayu |
| 17 | tr | Turkish | Türkçe |
| 18 | pl | Polish | Polski |
| 19 | nl | Dutch | Nederlands |
| 20 | sv | Swedish | Svenska |
| 21 | da | Danish | Dansk |
| 22 | no | Norwegian | Norsk |
| 23 | fi | Finnish | Suomi |
| 24 | el | Greek | Ελληνικά |
| 25 | he | Hebrew | עברית |

## 📱 浏览器兼容性

### 支持的浏览器
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+
- ✅ 移动端浏览器（iOS Safari, Chrome Mobile, Samsung Internet）

### 最佳体验
- 推荐使用最新版本的Chrome或Firefox浏览器
- 确保JavaScript已启用
- 建议屏幕分辨率至少为1280x720

## 🎨 自定义修改

### 修改产品图片
在HTML文件中找到以下代码：
```html
<img src="https://miaoda-site-img.cdn.bcebos.com/images/..." alt="翊鸢化工产品">
```
将 `src` 属性替换为您自己的图片URL。

### 修改公司信息
在HTML文件中找到生产商信息部分，修改相应的文本内容。

### 修改颜色主题
在HTML文件的 `<style>` 标签中，修改CSS变量或Tailwind配置。

### 添加更多语言
在JavaScript的 `translations` 对象中添加新的语言数据。

## 📊 文件大小

- HTML文件大小：约150KB（未压缩）
- Gzip压缩后：约30KB
- 加载速度：< 1秒（在良好的网络条件下）

## 🔧 技术栈

- **HTML5** - 页面结构
- **Tailwind CSS** - 样式框架（通过CDN加载）
- **JavaScript (ES6+)** - 交互逻辑和语言切换
- **无依赖** - 不需要任何外部库或框架

## 📝 注意事项

1. **网络连接**：首次加载需要网络连接以加载Tailwind CSS CDN和产品图片
2. **JavaScript**：必须启用JavaScript才能使用语言切换功能
3. **图片加载**：产品图片从CDN加载，确保网络畅通
4. **浏览器缓存**：浏览器会缓存CSS和图片，后续访问会更快

## 🐛 常见问题

### Q: 页面显示不正常？
A: 请确保：
- 浏览器支持现代CSS特性
- JavaScript已启用
- 网络连接正常（用于加载CDN资源）

### Q: 语言切换不工作？
A: 请检查：
- JavaScript是否已启用
- 浏览器控制台是否有错误信息
- 尝试刷新页面

### Q: 图片无法显示？
A: 可能原因：
- 网络连接问题
- CDN服务暂时不可用
- 图片URL已失效

### Q: 如何修改翻译内容？
A: 在HTML文件中找到 `translations` 对象，修改对应语言的翻译文本。

## 📞 技术支持

如有任何问题或建议，请联系：
- 邮箱：dps@ifixes.com.cn
- 网站：www.ifixes.com.cn

## 📄 许可证

© 2026 翊鸢化工 | Yiyuan Chemical | All Rights Reserved

---

**更新日期**：2025-11-09  
**版本**：v1.0.0  
**状态**：✅ 生产就绪
