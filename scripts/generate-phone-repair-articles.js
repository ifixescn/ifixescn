import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 图片资源
const images = {
  repair_technician: "https://miaoda-site-img.cdn.bcebos.com/images/6a085e72-f1db-45f5-93fe-e3be43c4862c.jpg",
  repair_tools: "https://miaoda-site-img.cdn.bcebos.com/images/70f0e381-8722-4ffd-a956-57f4988d9331.jpg",
  iphone_screen: "https://miaoda-site-img.cdn.bcebos.com/images/b426188e-c374-491c-9b42-28181449a33c.jpg",
  battery_replacement: "https://miaoda-site-img.cdn.bcebos.com/images/99ebdc0e-e01a-49bb-8810-a7a8ca61a80d.jpg",
  motherboard: "https://miaoda-site-img.cdn.bcebos.com/images/d31e2fc6-38d9-4496-9999-671b1f34a410.jpg",
  workshop: "https://miaoda-site-img.cdn.bcebos.com/images/f18b8341-4616-4f72-af94-956774ad3321.jpg",
  diagnostic_tools: "https://miaoda-site-img.cdn.bcebos.com/images/63ef6cad-92c0-4e66-bb1a-2fc5340e2f2e.jpg",
  water_damage: "https://miaoda-site-img.cdn.bcebos.com/images/7e412fe2-421b-4f0e-82f5-525175df7f9c.jpg",
  disassembly_tools: "https://miaoda-site-img.cdn.bcebos.com/images/c61dedc7-c308-4a0d-8346-3f1131a752a1.jpg",
  charging_port: "https://miaoda-site-img.cdn.bcebos.com/images/23bc515c-cf89-4382-948a-bfa72ccf488d.jpg",
  speaker_repair: "https://miaoda-site-img.cdn.bcebos.com/images/7858950a-c7c1-4f3c-baee-12970b632a67.jpg",
  back_glass: "https://miaoda-site-img.cdn.bcebos.com/images/abcc6fdc-e2d7-4a27-b444-0d03caf73842.jpg",
  heat_gun: "https://miaoda-site-img.cdn.bcebos.com/images/69261d71-e973-417f-b36d-374fb768e059.jpg",
  soldering: "https://miaoda-site-img.cdn.bcebos.com/images/090a01c1-5040-4191-a2f2-1c5a842069e1.jpg",
  screen_protector: "https://miaoda-site-img.cdn.bcebos.com/images/e8797dfb-1863-44c5-a6b3-90d115bd065d.jpg",
  camera_module: "https://miaoda-site-img.cdn.bcebos.com/images/3cf2d754-3c33-4e29-ac92-f58a0fb89a47.jpg",
  flex_cable: "https://miaoda-site-img.cdn.bcebos.com/images/686bbb21-5f9f-4cd3-9000-1da6d032ccac.jpg",
  microscope: "https://miaoda-site-img.cdn.bcebos.com/images/b3b99131-8a9b-4671-ac19-428a60b38e31.jpg",
  testing_equipment: "https://miaoda-site-img.cdn.bcebos.com/images/1e149b97-68e5-47ad-a22a-039ca340e218.jpg",
  ultrasonic_cleaner: "https://miaoda-site-img.cdn.bcebos.com/images/7a9dcf9a-9eda-42ee-b33b-20cdce7daba5.jpg"
};

// 文章模板数据
const articleTemplates = [
  {
    title: "Complete Guide to iPhone Screen Replacement",
    category: "Guides",
    coverImage: images.iphone_screen,
    images: [images.iphone_screen, images.repair_tools, images.heat_gun],
    content: `
<h2>Introduction to iPhone Screen Replacement</h2>
<p>Replacing an iPhone screen is one of the most common repairs in the mobile phone industry. Whether you're dealing with a cracked display or unresponsive touch functionality, this comprehensive guide will walk you through the entire process.</p>

<img src="${images.iphone_screen}" alt="iPhone screen replacement process" />

<h2>Tools You'll Need</h2>
<p>Before starting the repair, gather these essential tools:</p>
<ul>
<li>Pentalobe screwdriver (P2 or P5 depending on model)</li>
<li>Suction cup</li>
<li>Plastic opening tools</li>
<li>Tweezers</li>
<li>Heat gun or hair dryer</li>
<li>Replacement screen assembly</li>
</ul>

<img src="${images.repair_tools}" alt="Essential iPhone repair tools" />

<h2>Step-by-Step Replacement Process</h2>
<h3>1. Power Down and Prepare</h3>
<p>Always power off your iPhone completely before beginning any repair work. This prevents electrical shorts and protects both you and the device.</p>

<h3>2. Remove the Pentalobe Screws</h3>
<p>Locate the two pentalobe screws at the bottom of the iPhone, next to the Lightning port. Remove these carefully and keep them in a safe place.</p>

<h3>3. Apply Heat to Loosen Adhesive</h3>
<p>Use a heat gun or hair dryer to warm the edges of the screen. This softens the adhesive, making it easier to separate the display from the frame.</p>

<img src="${images.heat_gun}" alt="Applying heat to iPhone screen" />

<h3>4. Create an Opening</h3>
<p>Place the suction cup near the home button and gently pull while using a plastic opening tool to create a gap between the screen and frame.</p>

<h3>5. Disconnect the Battery</h3>
<p>Before removing any cables, disconnect the battery connector to prevent electrical damage.</p>

<h3>6. Remove Display Cables</h3>
<p>Carefully disconnect the display cables, including the digitizer, LCD, and front camera/sensor cables.</p>

<h3>7. Install the New Screen</h3>
<p>Connect the new screen's cables in reverse order, ensuring each connection is secure.</p>

<h3>8. Test Before Sealing</h3>
<p>Power on the device to test the new screen before applying new adhesive and sealing the device.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
<li>Forgetting to disconnect the battery first</li>
<li>Using too much force when prying open the device</li>
<li>Not testing the screen before final assembly</li>
<li>Damaging the delicate flex cables</li>
</ul>

<h2>Conclusion</h2>
<p>With patience and the right tools, iPhone screen replacement can be accomplished successfully. Always work in a clean, well-lit environment and take your time with each step.</p>
`
  },
  {
    title: "Essential Tools Every Phone Repair Technician Needs",
    category: "Guides",
    coverImage: images.repair_tools,
    images: [images.repair_tools, images.soldering, images.microscope],
    content: `
<h2>Building Your Phone Repair Toolkit</h2>
<p>Professional phone repair requires specialized tools. This guide covers the essential equipment every technician should have in their workshop.</p>

<img src="${images.repair_tools}" alt="Professional phone repair tools" />

<h2>Basic Hand Tools</h2>
<h3>Screwdriver Sets</h3>
<p>Invest in a comprehensive precision screwdriver set including:</p>
<ul>
<li>Phillips head (PH000, PH00, PH0)</li>
<li>Pentalobe (P2, P5, P6)</li>
<li>Torx (T2, T3, T4, T5)</li>
<li>Tri-point (Y000)</li>
</ul>

<h3>Opening Tools</h3>
<p>Quality plastic and metal prying tools are essential for safely opening devices without causing damage.</p>

<h2>Advanced Equipment</h2>
<img src="${images.soldering}" alt="Soldering station for phone repair" />

<h3>Soldering Station</h3>
<p>A temperature-controlled soldering station is crucial for component-level repairs. Look for features like:</p>
<ul>
<li>Adjustable temperature (200-450°C)</li>
<li>Quick heating time</li>
<li>ESD-safe design</li>
<li>Multiple tip options</li>
</ul>

<h3>Microscope</h3>
<img src="${images.microscope}" alt="Repair microscope" />
<p>A stereo microscope with 7x-45x magnification enables precise work on tiny components like charging ports and microchips.</p>

<h2>Diagnostic Tools</h2>
<ul>
<li>Multimeter for testing circuits</li>
<li>Power supply with current monitoring</li>
<li>USB ammeter</li>
<li>Battery tester</li>
</ul>

<h2>Safety Equipment</h2>
<p>Don't overlook safety:</p>
<ul>
<li>ESD wrist strap</li>
<li>Safety glasses</li>
<li>Heat-resistant mat</li>
<li>Fume extractor</li>
</ul>

<h2>Conclusion</h2>
<p>Quality tools are an investment in your repair business. Start with the basics and gradually expand your toolkit as you take on more complex repairs.</p>
`
  },
  {
    title: "How to Fix Water Damaged Smartphones",
    category: "Guides",
    coverImage: images.water_damage,
    images: [images.water_damage, images.ultrasonic_cleaner, images.diagnostic_tools],
    content: `
<h2>Understanding Water Damage</h2>
<p>Water damage is one of the most common and challenging issues in smartphone repair. Quick action and proper techniques can often save a water-damaged device.</p>

<img src="${images.water_damage}" alt="Water damaged smartphone repair" />

<h2>Immediate Steps</h2>
<h3>1. Power Off Immediately</h3>
<p>If the phone is still on, turn it off immediately. Do not attempt to charge it or press buttons repeatedly.</p>

<h3>2. Remove External Components</h3>
<p>Take out the SIM card, memory card, and if possible, the battery. Remove any case or accessories.</p>

<h3>3. Dry the Exterior</h3>
<p>Gently pat the phone dry with a lint-free cloth. Do not use heat sources like hair dryers, as this can push water deeper into the device.</p>

<h2>Professional Repair Process</h2>
<h3>Disassembly</h3>
<p>Carefully disassemble the phone to access internal components. Document the process with photos for reassembly.</p>

<h3>Ultrasonic Cleaning</h3>
<img src="${images.ultrasonic_cleaner}" alt="Ultrasonic cleaner for phone repair" />
<p>Use an ultrasonic cleaner with isopropyl alcohol (90%+ concentration) to remove water and corrosion from the motherboard and components.</p>

<h3>Inspection and Testing</h3>
<img src="${images.diagnostic_tools}" alt="Diagnostic tools for water damage" />
<p>Examine the board under a microscope for:</p>
<ul>
<li>Corrosion on connectors</li>
<li>Damaged components</li>
<li>Short circuits</li>
<li>Oxidation on chips</li>
</ul>

<h2>Component Replacement</h2>
<p>Common components that may need replacement:</p>
<ul>
<li>Battery (almost always)</li>
<li>Charging port</li>
<li>Display connectors</li>
<li>Audio components</li>
</ul>

<h2>Prevention Tips</h2>
<p>Advise customers on prevention:</p>
<ul>
<li>Use waterproof cases</li>
<li>Avoid using phones in humid environments</li>
<li>Check water resistance ratings</li>
<li>Regular maintenance of seals and gaskets</li>
</ul>

<h2>Conclusion</h2>
<p>Water damage repair requires patience and proper equipment. Not all devices can be saved, but following these procedures maximizes the chances of successful recovery.</p>
`
  }
];

// 生成更多文章标题和内容
const generateArticleContent = (index, template) => {
  const variations = {
    titles: [
      "Mastering Smartphone Battery Replacement Techniques",
      "Professional Guide to Charging Port Repair",
      "Understanding Smartphone Motherboard Components",
      "Complete Tutorial: Back Glass Replacement",
      "Advanced Soldering Techniques for Phone Repair",
      "Diagnosing Common Smartphone Issues",
      "Camera Module Replacement Step-by-Step",
      "Speaker and Microphone Repair Guide",
      "Flex Cable Replacement Best Practices",
      "Setting Up Your Phone Repair Workshop",
      "Quality Control in Phone Repair Services",
      "Latest Trends in Mobile Device Repair",
      "Troubleshooting No Power Issues",
      "Screen Protector Installation Like a Pro",
      "Understanding Phone Repair Economics",
      "Building a Successful Repair Business",
      "Customer Service in Phone Repair",
      "Warranty Management for Repairs",
      "Sourcing Quality Replacement Parts",
      "Environmental Impact of Phone Repairs"
    ],
    intros: [
      "In the rapidly evolving world of mobile technology, understanding repair techniques is essential for both professionals and enthusiasts.",
      "This comprehensive guide explores the intricacies of smartphone repair, providing detailed insights and practical advice.",
      "As mobile devices become increasingly complex, mastering repair skills has never been more important.",
      "Professional phone repair requires a combination of technical knowledge, proper tools, and hands-on experience.",
      "The mobile repair industry continues to grow, creating opportunities for skilled technicians worldwide."
    ],
    conclusions: [
      "With practice and dedication, these techniques will help you become a more proficient repair technician.",
      "Remember that quality repairs require patience, proper tools, and continuous learning.",
      "Stay updated with the latest repair techniques and industry standards to provide the best service.",
      "Success in phone repair comes from attention to detail and commitment to quality workmanship.",
      "By following these guidelines, you'll be well-equipped to handle a wide range of repair challenges."
    ]
  };

  // 随机选择变化
  const titleIndex = index % variations.titles.length;
  const introIndex = Math.floor(Math.random() * variations.intros.length);
  const conclusionIndex = Math.floor(Math.random() * variations.conclusions.length);

  return {
    title: variations.titles[titleIndex],
    intro: variations.intros[introIndex],
    conclusion: variations.conclusions[conclusionIndex]
  };
};

// 生成文章内容
const generateFullArticle = (index) => {
  const imageKeys = Object.keys(images);
  const coverImageKey = imageKeys[index % imageKeys.length];
  const coverImage = images[coverImageKey];
  
  // 随机选择2-4张图片
  const numImages = 2 + Math.floor(Math.random() * 3);
  const selectedImages = [];
  for (let i = 0; i < numImages; i++) {
    const imgKey = imageKeys[(index + i) % imageKeys.length];
    selectedImages.push(images[imgKey]);
  }

  const variation = generateArticleContent(index);
  
  const categories = ['Guides', 'Blog', 'News'];
  const category = categories[index % categories.length];

  // 生成文章内容
  const content = `
<h2>Introduction</h2>
<p>${variation.intro}</p>

<img src="${coverImage}" alt="${variation.title}" />

<h2>Understanding the Basics</h2>
<p>Before diving into the technical aspects, it's important to understand the fundamental principles that govern this area of mobile device repair. Modern smartphones are complex devices with intricate components that require careful handling and specialized knowledge.</p>

<p>The repair process involves several key stages, each requiring specific tools and techniques. Professional technicians must be familiar with various device models, their unique characteristics, and common failure points.</p>

<h2>Essential Tools and Equipment</h2>
<p>Having the right tools is crucial for successful repairs. Here are the essential items you'll need:</p>

<ul>
<li>Precision screwdriver set with multiple bits</li>
<li>Anti-static mat and wrist strap</li>
<li>Plastic opening tools and spudgers</li>
<li>Tweezers and magnifying glass</li>
<li>Heat gun or hot air station</li>
<li>Multimeter for electrical testing</li>
</ul>

<img src="${selectedImages[0]}" alt="Professional repair tools" />

<h2>Step-by-Step Process</h2>
<h3>Preparation Phase</h3>
<p>Proper preparation is essential for any repair job. Start by creating a clean, organized workspace with adequate lighting. Gather all necessary tools and replacement parts before beginning the repair.</p>

<p>Document the device's condition with photos, noting any existing damage or issues. This protects both you and the customer and provides a reference during reassembly.</p>

<h3>Disassembly</h3>
<p>Carefully disassemble the device following manufacturer guidelines or repair manuals. Keep track of all screws and small components using a magnetic mat or organizer tray.</p>

<p>Take your time during this phase - rushing can lead to broken clips, stripped screws, or damaged cables. Each device has its own quirks and challenges that you'll learn through experience.</p>

<img src="${selectedImages[1]}" alt="Device disassembly process" />

<h3>Diagnosis and Repair</h3>
<p>Once the device is open, carefully inspect all components for signs of damage, wear, or malfunction. Use diagnostic tools to test electrical connections and identify faulty parts.</p>

<p>Replace damaged components with high-quality parts from reputable suppliers. Avoid cheap alternatives that may fail prematurely or cause additional problems.</p>

${selectedImages.length > 2 ? `<img src="${selectedImages[2]}" alt="Component inspection" />` : ''}

<h3>Testing and Quality Control</h3>
<p>Before final assembly, test all functions thoroughly:</p>
<ul>
<li>Display and touch responsiveness</li>
<li>Camera functionality</li>
<li>Audio input and output</li>
<li>Charging and battery performance</li>
<li>Wireless connectivity (WiFi, Bluetooth, cellular)</li>
<li>Sensors and buttons</li>
</ul>

<h2>Common Challenges and Solutions</h2>
<p>Even experienced technicians encounter challenges. Here are some common issues and how to address them:</p>

<h3>Stubborn Adhesive</h3>
<p>Modern devices use strong adhesive to secure components. Apply gentle heat and use proper prying techniques to avoid damage. Patience is key - never force components apart.</p>

<h3>Delicate Flex Cables</h3>
<p>Flex cables are extremely fragile and can tear easily. Always disconnect them carefully by lifting the connector straight up, never at an angle.</p>

<h3>Stripped Screws</h3>
<p>If you encounter a stripped screw, try using a rubber band between the screwdriver and screw head for extra grip. As a last resort, carefully drill out the screw.</p>

<h2>Best Practices for Professional Results</h2>
<p>To consistently deliver high-quality repairs:</p>

<ul>
<li>Maintain a clean, organized workspace</li>
<li>Use proper ESD protection</li>
<li>Follow manufacturer repair procedures</li>
<li>Keep detailed repair logs</li>
<li>Stay updated on new techniques and tools</li>
<li>Invest in quality replacement parts</li>
<li>Provide clear communication with customers</li>
</ul>

<h2>Safety Considerations</h2>
<p>Safety should always be your top priority:</p>
<ul>
<li>Wear safety glasses when working with glass or using power tools</li>
<li>Handle batteries carefully - never puncture or short circuit them</li>
<li>Work in a well-ventilated area when soldering</li>
<li>Use proper lifting techniques for heavy equipment</li>
<li>Keep a fire extinguisher nearby</li>
</ul>

<h2>Continuing Education</h2>
<p>The mobile repair industry evolves rapidly. Stay current by:</p>
<ul>
<li>Attending industry conferences and workshops</li>
<li>Joining professional repair associations</li>
<li>Following repair forums and communities</li>
<li>Watching tutorial videos from experienced technicians</li>
<li>Practicing on older devices to build skills</li>
</ul>

<h2>Conclusion</h2>
<p>${variation.conclusion}</p>

<p>Whether you're just starting out or looking to refine your skills, continuous practice and learning are essential. The satisfaction of successfully repairing a device and helping a customer is one of the most rewarding aspects of this profession.</p>
`;

  return {
    title: variation.title,
    category: category,
    coverImage: coverImage,
    content: content,
    excerpt: variation.intro.substring(0, 150) + '...'
  };
};

// 主函数
async function generateArticles() {
  console.log('开始生成100篇手机维修文章...\n');

  // 获取管理员用户ID
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (!adminUser) {
    console.error('未找到管理员用户');
    return;
  }

  const authorId = adminUser.id;

  // 获取分类ID
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'article');

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  let successCount = 0;
  let failCount = 0;

  // 生成100篇文章
  for (let i = 0; i < 100; i++) {
    try {
      const article = generateFullArticle(i);
      const categoryId = categoryMap[article.category];

      if (!categoryId) {
        console.log(`跳过文章 ${i + 1}: 分类 ${article.category} 不存在`);
        failCount++;
        continue;
      }

      // 插入文章
      const { data, error } = await supabase
        .from('articles')
        .insert({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          cover_image: article.coverImage,
          author_id: authorId,
          category_id: categoryId,
          status: 'published',
          view_count: Math.floor(Math.random() * 500) + 50, // 随机浏览量
          language: 'en' // 英文文章
        })
        .select()
        .single();

      if (error) {
        console.error(`生成文章 ${i + 1} 失败:`, error.message);
        failCount++;
      } else {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`已成功生成 ${successCount} 篇文章...`);
        }
      }

      // 添加随机延迟，模拟人工发布
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    } catch (error) {
      console.error(`生成文章 ${i + 1} 时出错:`, error);
      failCount++;
    }
  }

  console.log('\n生成完成！');
  console.log(`成功: ${successCount} 篇`);
  console.log(`失败: ${failCount} 篇`);
}

// 运行脚本
generateArticles().catch(console.error);
