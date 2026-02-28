import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

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

// 文章标题库
const titles = [
  "Complete Guide to iPhone Screen Replacement",
  "Essential Tools Every Phone Repair Technician Needs",
  "How to Fix Water Damaged Smartphones",
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
  "Troubleshooting No Power Issues in Smartphones",
  "Screen Protector Installation Like a Pro",
  "Understanding Phone Repair Economics",
  "Building a Successful Repair Business",
  "Customer Service Excellence in Phone Repair",
  "Warranty Management for Repair Services",
  "Sourcing Quality Replacement Parts",
  "Environmental Impact of Phone Repairs",
  "Data Recovery from Damaged Phones",
  "Preventing Common Repair Mistakes",
  "Advanced Diagnostic Techniques",
  "Micro-Soldering for Beginners",
  "iPhone vs Android Repair Differences",
  "Dealing with Liquid Damage Effectively",
  "Screen Calibration After Replacement",
  "Battery Health and Longevity Tips",
  "Repairing Broken Home Buttons",
  "Face ID and Touch ID Repair Challenges",
  "Wireless Charging Coil Replacement",
  "Antenna and Signal Issues Solutions",
  "Proximity Sensor Troubleshooting",
  "Earpiece Speaker Repair Methods",
  "Vibration Motor Replacement Guide",
  "SIM Card Tray Repair and Replacement",
  "Volume Button Repair Techniques",
  "Power Button Replacement Tutorial",
  "Headphone Jack Repair Guide",
  "Front Camera Repair Procedures",
  "Rear Camera Lens Replacement",
  "Flash LED Repair Methods",
  "Ambient Light Sensor Issues",
  "Gyroscope and Accelerometer Repair",
  "Compass Calibration Problems",
  "Barometer Sensor Troubleshooting",
  "NFC Antenna Repair Guide",
  "Bluetooth Connectivity Issues",
  "WiFi Antenna Replacement",
  "GPS Signal Problems Solutions",
  "Cellular Network Issues Diagnosis",
  "IMEI Repair and Restoration",
  "Baseband IC Repair Techniques",
  "Power Management IC Replacement",
  "Audio IC Repair Methods",
  "Touch IC Repair for iPhone",
  "Backlight Issues and Solutions",
  "LCD vs OLED Screen Differences",
  "Digitizer Replacement Guide",
  "Gorilla Glass Repair Techniques",
  "Ceramic Back Panel Replacement",
  "Metal Frame Repair Methods",
  "Waterproofing Seal Replacement",
  "Adhesive Application Best Practices",
  "Heat Management in Repairs",
  "ESD Protection in Phone Repair",
  "Microscope Usage for Repairs",
  "Ultrasonic Cleaning Techniques",
  "Isopropyl Alcohol in Repairs",
  "Flux Application Methods",
  "Solder Wire Selection Guide",
  "Hot Air Station Usage Tips",
  "Tweezers and Tools Selection",
  "Magnification Equipment Guide",
  "Lighting Setup for Repairs",
  "Workbench Organization Tips",
  "Parts Inventory Management",
  "Repair Documentation Methods",
  "Customer Communication Skills",
  "Pricing Strategy for Repairs",
  "Marketing Your Repair Business",
  "Online Presence for Repair Shops",
  "Social Media for Repair Business",
  "Customer Reviews Management",
  "Warranty Policy Development",
  "Insurance for Repair Business",
  "Legal Considerations in Repairs",
  "Safety Regulations Compliance",
  "Environmental Disposal Methods",
  "Recycling Old Phone Parts",
  "Refurbishment vs Repair",
  "Wholesale Parts Sourcing",
  "OEM vs Aftermarket Parts",
  "Quality Testing Procedures",
  "Repair Time Optimization",
  "Multi-Device Repair Workflow",
  "Training New Technicians",
  "Certification Programs Overview"
];

// 生成文章内容
function generateArticleContent(title, coverImage, additionalImages) {
  const intros = [
    "In the rapidly evolving world of mobile technology, understanding repair techniques is essential for both professionals and enthusiasts.",
    "This comprehensive guide explores the intricacies of smartphone repair, providing detailed insights and practical advice.",
    "As mobile devices become increasingly complex, mastering repair skills has never been more important.",
    "Professional phone repair requires a combination of technical knowledge, proper tools, and hands-on experience.",
    "The mobile repair industry continues to grow, creating opportunities for skilled technicians worldwide.",
    "Modern smartphones are sophisticated devices that demand careful handling and specialized expertise.",
    "Success in phone repair comes from understanding both the technical and business aspects of the industry.",
    "This detailed tutorial will help you develop the skills needed for professional-quality repairs.",
    "Whether you're starting out or refining your techniques, this guide provides valuable insights.",
    "Learn the professional methods that experienced technicians use every day in their repair work."
  ];

  const conclusions = [
    "With practice and dedication, these techniques will help you become a more proficient repair technician.",
    "Remember that quality repairs require patience, proper tools, and continuous learning.",
    "Stay updated with the latest repair techniques and industry standards to provide the best service.",
    "Success in phone repair comes from attention to detail and commitment to quality workmanship.",
    "By following these guidelines, you'll be well-equipped to handle a wide range of repair challenges.",
    "Continuous improvement and staying current with technology are keys to long-term success.",
    "Apply these principles consistently to build a reputation for excellent repair work.",
    "The knowledge you've gained here forms a solid foundation for your repair career.",
    "Practice these techniques regularly to maintain and improve your skills.",
    "Professional excellence in repair work comes from combining knowledge with practical experience."
  ];

  const intro = intros[Math.floor(Math.random() * intros.length)];
  const conclusion = conclusions[Math.floor(Math.random() * conclusions.length)];

  let content = `
<h2>Introduction</h2>
<p>${intro}</p>

<img src="${coverImage}" alt="${title}" />

<h2>Understanding the Fundamentals</h2>
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
<li>Soldering iron with temperature control</li>
<li>Isopropyl alcohol for cleaning</li>
</ul>

${additionalImages[0] ? `<img src="${additionalImages[0]}" alt="Professional repair tools" />` : ''}

<h2>Step-by-Step Process</h2>
<h3>Preparation Phase</h3>
<p>Proper preparation is essential for any repair job. Start by creating a clean, organized workspace with adequate lighting. Gather all necessary tools and replacement parts before beginning the repair.</p>

<p>Document the device's condition with photos, noting any existing damage or issues. This protects both you and the customer and provides a reference during reassembly.</p>

<h3>Disassembly</h3>
<p>Carefully disassemble the device following manufacturer guidelines or repair manuals. Keep track of all screws and small components using a magnetic mat or organizer tray.</p>

<p>Take your time during this phase - rushing can lead to broken clips, stripped screws, or damaged cables. Each device has its own quirks and challenges that you'll learn through experience.</p>

<h3>Diagnosis and Repair</h3>
<p>Once the device is open, carefully inspect all components for signs of damage, wear, or malfunction. Use diagnostic tools to test electrical connections and identify faulty parts.</p>

<p>Replace damaged components with high-quality parts from reputable suppliers. Avoid cheap alternatives that may fail prematurely or cause additional problems.</p>

${additionalImages[1] ? `<img src="${additionalImages[1]}" alt="Repair process" />` : ''}

<h3>Testing and Quality Control</h3>
<p>Before final assembly, test all functions thoroughly:</p>
<ul>
<li>Display and touch responsiveness</li>
<li>Camera functionality (front and rear)</li>
<li>Audio input and output</li>
<li>Charging and battery performance</li>
<li>Wireless connectivity (WiFi, Bluetooth, cellular)</li>
<li>Sensors and buttons</li>
<li>Biometric features (Face ID, Touch ID)</li>
</ul>

<h2>Common Challenges and Solutions</h2>
<p>Even experienced technicians encounter challenges. Here are some common issues and how to address them:</p>

<h3>Stubborn Adhesive</h3>
<p>Modern devices use strong adhesive to secure components. Apply gentle heat and use proper prying techniques to avoid damage. Patience is key - never force components apart.</p>

<h3>Delicate Flex Cables</h3>
<p>Flex cables are extremely fragile and can tear easily. Always disconnect them carefully by lifting the connector straight up, never at an angle. Use proper tools and avoid excessive force.</p>

<h3>Stripped Screws</h3>
<p>If you encounter a stripped screw, try using a rubber band between the screwdriver and screw head for extra grip. As a last resort, carefully drill out the screw using appropriate safety measures.</p>

${additionalImages[2] ? `<img src="${additionalImages[2]}" alt="Advanced techniques" />` : ''}

<h2>Best Practices for Professional Results</h2>
<p>To consistently deliver high-quality repairs:</p>

<ul>
<li>Maintain a clean, organized workspace</li>
<li>Use proper ESD protection at all times</li>
<li>Follow manufacturer repair procedures when available</li>
<li>Keep detailed repair logs and documentation</li>
<li>Stay updated on new techniques and tools</li>
<li>Invest in quality replacement parts</li>
<li>Provide clear communication with customers</li>
<li>Test thoroughly before returning devices</li>
<li>Offer appropriate warranties on your work</li>
</ul>

<h2>Safety Considerations</h2>
<p>Safety should always be your top priority:</p>
<ul>
<li>Wear safety glasses when working with glass or using power tools</li>
<li>Handle batteries carefully - never puncture or short circuit them</li>
<li>Work in a well-ventilated area when soldering</li>
<li>Use proper lifting techniques for heavy equipment</li>
<li>Keep a fire extinguisher nearby</li>
<li>Dispose of damaged batteries properly</li>
<li>Use heat-resistant surfaces and tools</li>
<li>Avoid working on devices while they're powered on</li>
</ul>

<h2>Continuing Education and Skill Development</h2>
<p>The mobile repair industry evolves rapidly. Stay current by:</p>
<ul>
<li>Attending industry conferences and workshops</li>
<li>Joining professional repair associations</li>
<li>Following repair forums and online communities</li>
<li>Watching tutorial videos from experienced technicians</li>
<li>Practicing on older devices to build skills</li>
<li>Reading technical documentation and repair guides</li>
<li>Networking with other repair professionals</li>
<li>Experimenting with new tools and techniques</li>
</ul>

<h2>Business Aspects of Phone Repair</h2>
<p>Technical skills alone aren't enough for success. Consider these business factors:</p>

<h3>Pricing Strategy</h3>
<p>Research local market rates and factor in your costs for parts, labor, overhead, and desired profit margin. Be competitive but don't undervalue your expertise.</p>

<h3>Customer Service</h3>
<p>Excellent customer service builds loyalty and generates referrals. Communicate clearly, set realistic expectations, and follow through on commitments.</p>

<h3>Marketing</h3>
<p>Develop an online presence through a website and social media. Encourage satisfied customers to leave reviews and share their experiences.</p>

<h2>Conclusion</h2>
<p>${conclusion}</p>

<p>Whether you're just starting out or looking to refine your skills, continuous practice and learning are essential. The satisfaction of successfully repairing a device and helping a customer is one of the most rewarding aspects of this profession.</p>

<p>Remember to always prioritize quality over speed, invest in proper tools and training, and treat each repair with the care and attention it deserves. Your reputation is built on every device you repair.</p>
`;

  return content;
}

// 生成slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// 主函数
async function generateArticles() {
  console.log('开始生成100篇手机维修文章的SQL...\n');

  // 获取管理员用户ID和分类ID
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (!adminUser) {
    console.error('未找到管理员用户');
    return;
  }

  const authorId = adminUser.id;

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'article');

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  const imageKeys = Object.keys(images);
  let sqlStatements = [];

  // 生成100篇文章的SQL
  for (let i = 0; i < 100; i++) {
    const title = titles[i % titles.length];
    const slug = generateSlug(title) + '-' + (Math.floor(i / titles.length) + 1);
    
    const coverImageKey = imageKeys[i % imageKeys.length];
    const coverImage = images[coverImageKey];
    
    // 选择2-3张额外图片
    const additionalImages = [];
    for (let j = 1; j <= 2; j++) {
      const imgKey = imageKeys[(i + j) % imageKeys.length];
      additionalImages.push(images[imgKey]);
    }

    const categoryNames = Object.keys(categoryMap);
    const categoryName = categoryNames[i % categoryNames.length];
    const categoryId = categoryMap[categoryName];

    const content = generateArticleContent(title, coverImage, additionalImages);
    const excerpt = content.substring(content.indexOf('<p>') + 3, content.indexOf('</p>')).substring(0, 150) + '...';

    const viewCount = Math.floor(Math.random() * 500) + 50;

    // 转义单引号
    const escapedTitle = title.replace(/'/g, "''");
    const escapedSlug = slug.replace(/'/g, "''");
    const escapedContent = content.replace(/'/g, "''");
    const escapedExcerpt = excerpt.replace(/'/g, "''");
    const escapedCoverImage = coverImage.replace(/'/g, "''");

    const sql = `INSERT INTO articles (title, slug, content, excerpt, cover_image, category_id, author_id, status, view_count, language, published_at)
VALUES ('${escapedTitle}', '${escapedSlug}', '${escapedContent}', '${escapedExcerpt}', '${escapedCoverImage}', '${categoryId}', '${authorId}', 'published', ${viewCount}, 'en', NOW());`;

    sqlStatements.push(sql);

    if ((i + 1) % 10 === 0) {
      console.log(`已生成 ${i + 1} 篇文章的SQL...`);
    }
  }

  // 写入SQL文件
  const sqlContent = `-- 批量插入100篇手机维修英文文章
-- 生成时间: ${new Date().toISOString()}

${sqlStatements.join('\n\n')}
`;

  fs.writeFileSync('insert-phone-repair-articles.sql', sqlContent);
  console.log('\nSQL文件已生成: insert-phone-repair-articles.sql');
  console.log('请使用以下命令执行SQL:');
  console.log('psql -h <host> -U <user> -d <database> -f insert-phone-repair-articles.sql');
}

// 运行脚本
generateArticles().catch(console.error);
