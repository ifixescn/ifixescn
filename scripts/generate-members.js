/**
 * 生成1000个测试会员账号
 * 使用Node.js脚本通过Supabase API生成
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
  'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon',
  'Benjamin', 'Samuel', 'Raymond', 'Gregory', 'Frank', 'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
  'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
  'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
  'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Italy', 'Spain', 'Netherlands', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria',
  'Belgium', 'Ireland', 'New Zealand', 'Singapore', 'Japan'
];

const cities = [
  'New York', 'London', 'Toronto', 'Sydney', 'Berlin',
  'Paris', 'Rome', 'Madrid', 'Amsterdam', 'Stockholm',
  'Oslo', 'Copenhagen', 'Helsinki', 'Zurich', 'Vienna',
  'Brussels', 'Dublin', 'Auckland', 'Singapore', 'Tokyo',
  'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin',
  'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow',
  'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton',
  'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'
];

const streets = [
  'Main Street', 'High Street', 'Park Avenue', 'Oak Street', 'Maple Avenue',
  'Washington Street', 'Lake Street', 'Hill Road', 'Church Street', 'Market Street',
  'Elm Street', 'Pine Street', 'Cedar Avenue', 'View Road', 'Spring Street',
  'River Road', 'Forest Avenue', 'Garden Street', 'Valley Road', 'Sunset Boulevard'
];

const bios = [
  'Technology enthusiast and lifelong learner.',
  'Passionate about innovation and creativity.',
  'Love exploring new ideas and technologies.',
  'Always curious, always learning.',
  'Dedicated professional with a passion for excellence.',
  'Believer in continuous improvement.',
  'Striving to make a positive impact.',
  'Enthusiastic about solving complex problems.',
  'Committed to personal and professional growth.',
  'Passionate about building great products.',
  'Love connecting with like-minded people.',
  'Always looking for new challenges.',
  'Dedicated to making a difference.',
  'Passionate about technology and design.',
  'Believer in the power of collaboration.'
];

const memberLevels = ['member', 'silver', 'gold', 'premium', 'svip'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成唯一的用户名
function generateUniqueUsername(firstName, lastName, existingUsernames) {
  const firstLower = firstName.toLowerCase();
  const lastLower = lastName.toLowerCase();
  
  // 尝试不同的格式
  const formats = [
    `${firstLower}.${lastLower}`,
    `${firstLower}_${lastLower}`,
    `${firstLower}${lastLower}`,
    `${firstLower}${lastLower.charAt(0)}`
  ];
  
  // 首先尝试基本格式
  for (const format of formats) {
    if (!existingUsernames.has(format)) {
      existingUsernames.add(format);
      return format;
    }
  }
  
  // 如果都重复了，添加随机字母
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let username;
  let attempts = 0;
  do {
    const suffix = Array.from({ length: 2 }, () => 
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    username = `${firstLower}.${lastLower}${suffix}`;
    attempts++;
  } while (existingUsernames.has(username) && attempts < 100);
  
  existingUsernames.add(username);
  return username;
}

async function generateMembers() {
  console.log('开始生成1000个会员账号...');
  
  let successCount = 0;
  let errorCount = 0;
  const existingUsernames = new Set();
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const username = generateUniqueUsername(firstName, lastName, existingUsernames);
      const email = `${username}@ifixescn.com`;
      const password = 'Member123';
      
      // 注册用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            email
          },
          emailRedirectTo: undefined
        }
      });
      
      if (authError) {
        console.error(`账号 ${i} 注册失败:`, authError.message);
        errorCount++;
        continue;
      }
      
      if (!authData.user) {
        console.error(`账号 ${i} 注册失败: 未返回用户数据`);
        errorCount++;
        continue;
      }
      
      // 生成随机数据
      const nickname = `${firstName} ${lastName}`;
      const phone = `+1${String(randomInt(1000000000, 9999999999))}`;
      const country = randomElement(countries);
      const city = randomElement(cities);
      const address = `${randomInt(100, 9999)} ${randomElement(streets)}`;
      const postalCode = String(randomInt(10000, 99999));
      const bio = randomElement(bios);
      const memberLevel = randomElement(memberLevels);
      
      let points, level;
      switch (memberLevel) {
        case 'member':
          points = randomInt(0, 1000);
          level = 1;
          break;
        case 'silver':
          points = randomInt(1000, 3000);
          level = 2;
          break;
        case 'gold':
          points = randomInt(3000, 6000);
          level = 3;
          break;
        case 'premium':
          points = randomInt(6000, 10000);
          level = 4;
          break;
        case 'svip':
          points = randomInt(10000, 20000);
          level = 5;
          break;
      }
      
      // 更新profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nickname,
          phone,
          member_level: memberLevel,
          points,
          level,
          country,
          city,
          address,
          postal_code: postalCode,
          bio,
          status: 'active',
          profile_visibility: 'public',
          show_email: false,
          show_articles: true,
          show_questions: true,
          show_sns: true
        })
        .eq('id', authData.user.id);
      
      if (updateError) {
        console.error(`账号 ${i} 更新profile失败:`, updateError.message);
        errorCount++;
        continue;
      }
      
      successCount++;
      
      if (successCount % 50 === 0) {
        console.log(`已成功生成 ${successCount} 个会员账号...`);
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`账号 ${i} 生成失败:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n生成完成！');
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${errorCount} 个`);
}

generateMembers().catch(console.error);
