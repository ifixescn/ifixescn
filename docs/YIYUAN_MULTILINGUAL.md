# 翊鸢化工页面多语言支持说明

## 概述
翊鸢化工页面现已支持25种国际语言，用户可以通过页面右上角的语言选择器切换不同语言查看产品信息。

## 支持的语言列表

### 亚洲语言 (9种)
1. **中文 (zh)** - 中文
2. **英语 (en)** - English
3. **日语 (ja)** - 日本語
4. **韩语 (ko)** - 한국어
5. **泰语 (th)** - ไทย
6. **越南语 (vi)** - Tiếng Việt
7. **印尼语 (id)** - Bahasa Indonesia
8. **马来语 (ms)** - Bahasa Melayu
9. **印地语 (hi)** - हिन्दी

### 欧洲语言 (13种)
10. **法语 (fr)** - Français
11. **德语 (de)** - Deutsch
12. **西班牙语 (es)** - Español
13. **意大利语 (it)** - Italiano
14. **葡萄牙语 (pt)** - Português
15. **俄语 (ru)** - Русский
16. **土耳其语 (tr)** - Türkçe
17. **波兰语 (pl)** - Polski
18. **荷兰语 (nl)** - Nederlands
19. **瑞典语 (sv)** - Svenska
20. **丹麦语 (da)** - Dansk
21. **挪威语 (no)** - Norsk
22. **芬兰语 (fi)** - Suomi
23. **希腊语 (el)** - Ελληνικά
24. **希伯来语 (he)** - עברית

### 中东语言 (1种)
25. **阿拉伯语 (ar)** - العربية

## 翻译内容范围

### 1. Hero区域
- 页面标题：翊鸢化工
- 页面描述：专业研发用于手机维修领域的化工产品，寻求最佳的解决方案

### 2. 产品信息
- 产品名称：翊鸢牌摄像头免拆洗稀溶剂
- 产品描述：无需拆卸摄像头组件，高效清洗手机摄像头返修 水印、黑斑、灰尘
- 产品规格、特点、应用领域（使用数据库中的中英文数据）

### 3. UI标签
- 产品规格 (Product Specifications)
- 产品特点 (Product Features)
- 应用领域 (Applications)
- 防伪验证指南 (Anti-counterfeiting Verification Guide)
- 产品防伪验证 (Product Anti-counterfeiting Verification)
- 温馨提示 (Important Notice)
- 生产商信息 (Manufacturer Information)
- 执行标准 (Executive Standard)
- 产地 (Origin)
- 公司名称 (Company Name)
- 地址 (Address)
- 网址 (Website)
- 邮箱 (Email)

### 4. 温馨提示内容
完整的防伪验证提示信息，包括验证规则和联系方式说明

## 技术实现

### 文件结构
```
src/
├── i18n/
│   ├── yiyuan-translations.ts      # UI标签翻译和语言配置
│   └── yiyuan-content-translations.ts  # 内容翻译（Hero、产品名称、描述等）
└── pages/
    └── Yiyuan.tsx                  # 翊鸢化工页面主文件
```

### 核心组件

#### 1. 语言选择器
- 位置：页面右上角固定位置
- 类型：下拉菜单 (DropdownMenu)
- 功能：显示当前语言的本地名称，点击展开显示所有25种语言选项
- 特性：
  - 支持滚动查看所有语言
  - 当前选中语言高亮显示
  - 显示语言的本地名称和英文名称

#### 2. 翻译数据结构
```typescript
// 语言代码类型
type LanguageCode = 'zh' | 'en' | 'ja' | 'ko' | ... // 25种语言

// UI翻译对象
const UI_TRANSLATIONS: Record<LanguageCode, {
  productSpecs: string;
  productFeatures: string;
  // ... 其他UI标签
}>

// 内容翻译对象
const HERO_TRANSLATIONS: Record<LanguageCode, {
  title: string;
  content: string;
}>
```

### 使用方法

#### 在组件中使用翻译
```tsx
// 1. 导入翻译数据
import { UI_TRANSLATIONS, LanguageCode } from '@/i18n/yiyuan-translations';
import { HERO_TRANSLATIONS } from '@/i18n/yiyuan-content-translations';

// 2. 使用语言状态
const [language, setLanguage] = useState<LanguageCode>('zh');

// 3. 在JSX中使用翻译
<h1>{HERO_TRANSLATIONS[language].title}</h1>
<p>{UI_TRANSLATIONS[language].productSpecs}</p>
```

## 扩展指南

### 添加新的翻译内容

1. **添加UI标签翻译**
   - 编辑 `src/i18n/yiyuan-translations.ts`
   - 在 `UI_TRANSLATIONS` 对象中为每种语言添加新的键值对

2. **添加内容翻译**
   - 编辑 `src/i18n/yiyuan-content-translations.ts`
   - 创建新的翻译对象，为每种语言提供翻译

3. **在页面中使用**
   - 导入新的翻译对象
   - 使用 `TRANSLATION_OBJECT[language].key` 访问翻译

### 添加新语言

1. 在 `SUPPORTED_LANGUAGES` 数组中添加新语言：
```typescript
{ code: 'xx', name: 'Language Name', nativeName: 'Native Name' }
```

2. 在所有翻译对象中添加该语言的翻译：
```typescript
xx: {
  productSpecs: 'Translation',
  // ... 其他翻译
}
```

## 注意事项

1. **数据库内容**：产品规格、特点、应用领域等详细信息仍然使用数据库中的中英文字段，未来可以扩展数据库支持更多语言

2. **SEO优化**：页面元数据（title、description、keywords）目前仅支持中英文，可以根据需要扩展

3. **RTL语言支持**：阿拉伯语和希伯来语是从右到左书写的语言，如需完整支持，需要添加RTL布局样式

4. **字体支持**：确保网站字体支持所有语言的字符显示，特别是亚洲语言和特殊字符

5. **翻译质量**：当前翻译基于机器翻译，建议由专业翻译人员审核和优化

## 用户体验

### 视觉优化
- **醒目的按钮设计**：使用蓝色到靛蓝色的渐变背景，白色文字，大尺寸按钮（lg size）
- **脉冲动画**：按钮带有脉冲动画效果（animate-pulse），吸引用户注意，鼠标悬停时停止动画
- **旋转地球图标**：Globe图标带有缓慢旋转动画（animate-spin-slow），增强视觉吸引力
- **阴影效果**：超大阴影（shadow-2xl）和悬停时的3D阴影效果（hover:shadow-3xl）
- **语言提示横幅**：在Hero区域顶部显示"支持25种语言"的横幅，带有弹跳动画（animate-bounce）

### 下拉菜单优化
- **宽度优化**：下拉菜单宽度设置为320px（w-80），提供更好的阅读体验
- **高度限制**：最大高度500px，超出部分可滚动查看
- **毛玻璃效果**：背景使用半透明白色加毛玻璃效果（backdrop-blur-xl）
- **顶部固定标题**：下拉菜单顶部显示"选择语言 / Select Language"和"支持25种国际语言"的提示
- **选中状态高亮**：当前选中的语言使用蓝色到靛蓝色渐变背景，白色文字，加粗显示，并带有对勾图标
- **悬停效果**：未选中的语言项悬停时显示浅蓝色背景和阴影效果
- **双语显示**：每个语言选项同时显示本地名称和英文名称

### 交互优化
- **高z-index**：语言选择器z-index设置为100，确保始终在最上层
- **位置优化**：固定在页面右上角（top-6 right-6），不会被其他元素遮挡
- **点击响应**：点击语言选项立即切换语言，无需刷新页面
- **视觉反馈**：选中的语言项有明显的视觉反馈（渐变背景、对勾图标）

### 持久化和自动检测
- **语言持久化**：用户选择的语言会保存在组件状态中，刷新页面后会重置为默认语言（中文）
- **响应式设计**：语言选择器在移动端和桌面端都能正常使用
- **无缝切换**：切换语言时页面内容即时更新，无需刷新页面

## 未来改进方向

1. **语言持久化**：使用 localStorage 或 cookies 保存用户的语言偏好
2. **自动检测**：根据浏览器语言自动选择合适的显示语言
3. **数据库扩展**：扩展数据库表结构，支持产品详细信息的多语言存储
4. **翻译管理**：开发后台翻译管理界面，方便管理员更新翻译内容
5. **专业翻译**：聘请专业翻译人员优化各语言的翻译质量
6. **RTL布局**：为阿拉伯语和希伯来语添加完整的RTL布局支持
