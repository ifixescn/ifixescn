/*
# 生成1000个测试会员账号

本次操作通过Node.js脚本生成了1000个测试会员账号，用于丰富会员系统。

## 账号信息
- 用户名格式：firstname.lastname 或 firstname_lastname（更真实的格式）
- 邮箱格式：username@ifixescn.com
- 默认密码：Member123
- 邮箱状态：已验证

## 会员等级分布
- Member（普通会员）：约200个
- Silver（银卡会员）：约200个
- Gold（金卡会员）：约200个
- Premium（白金会员）：约200个
- SVIP（超级会员）：约200个

## 个人资料
- 英文姓名作为昵称
- 随机生成的电话号码（+1开头）
- 随机分配的国家和城市
- 随机生成的地址和邮编
- 随机选择的个人简介
- 根据会员等级分配相应的积分和等级

## 生成方式
使用scripts/generate-members.js脚本通过Supabase API批量生成

## 注意事项
这些是测试数据，所有账号使用相同的密码：Member123

## 更新记录
- 2025-11-09: 修复用户名格式，去掉数字后缀，使用更真实的格式
*/

-- 此文件仅用于记录，实际数据已通过脚本生成
SELECT 'Test members generated successfully' as status;
