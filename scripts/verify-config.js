/**
 * Coze API 配置验证脚本
 * 用于验证环境变量配置是否正确
 */

const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.bold(colors.cyan('\n🔍 Coze API 配置验证器\n')));

// 检查 .env.local 文件是否存在
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.local.example');

if (!fs.existsSync(envPath)) {
  console.log(colors.red('❌ 未找到 .env.local 文件'));
  console.log(colors.yellow('📝 请在项目根目录创建 .env.local 文件'));
  
  if (fs.existsSync(envExamplePath)) {
    console.log(colors.blue('💡 提示：可以复制 .env.local.example 作为模板'));
  }
  
  console.log(colors.cyan('\n📋 必需的环境变量：'));
  console.log('   • COZE_API_KEY=your_api_key');
  console.log('   • NEXT_PUBLIC_COZE_BOT_ID=your_bot_id');
  
  console.log(colors.yellow('\n💡 配置步骤：'));
  console.log('   1. 在项目根目录创建 .env.local 文件');
  console.log('   2. 添加您的 COZE_API_KEY');
  console.log('   3. 添加您的 NEXT_PUBLIC_COZE_BOT_ID');
  console.log('   4. 重新运行此验证脚本');
  
  process.exit(1);
}

// 读取环境变量
console.log(colors.green('✅ 找到 .env.local 文件'));

// 加载环境变量
require('dotenv').config({ path: envPath });

const config = {
  COZE_API_KEY: process.env.COZE_API_KEY,
  NEXT_PUBLIC_COZE_BOT_ID: process.env.NEXT_PUBLIC_COZE_BOT_ID,
  NEXT_PUBLIC_COZE_API_URL: process.env.NEXT_PUBLIC_COZE_API_URL || 'https://api.coze.cn/v3/chat',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
};

let hasErrors = false;

console.log(colors.bold('\n📋 配置检查结果：\n'));

// 检查必需的环境变量
if (!config.COZE_API_KEY) {
  console.log(colors.red('❌ COZE_API_KEY 未设置'));
  console.log(colors.yellow('   请设置您的 Coze API Key'));
  hasErrors = true;
} else if (!config.COZE_API_KEY.startsWith('pat_')) {
  console.log(colors.yellow('⚠️  COZE_API_KEY 格式可能不正确'));
  console.log(colors.yellow('   Coze API Key 通常以 "pat_" 开头'));
  console.log(colors.green('✅ COZE_API_KEY 已设置'));
} else {
  console.log(colors.green('✅ COZE_API_KEY 已设置'));
}

if (!config.NEXT_PUBLIC_COZE_BOT_ID) {
  console.log(colors.red('❌ NEXT_PUBLIC_COZE_BOT_ID 未设置'));
  console.log(colors.yellow('   请设置您的 Bot ID'));
  hasErrors = true;
} else if (!/^\d+$/.test(config.NEXT_PUBLIC_COZE_BOT_ID)) {
  console.log(colors.yellow('⚠️  NEXT_PUBLIC_COZE_BOT_ID 格式可能不正确'));
  console.log(colors.yellow('   Bot ID 应该是纯数字'));
  console.log(colors.green('✅ NEXT_PUBLIC_COZE_BOT_ID 已设置'));
} else {
  console.log(colors.green('✅ NEXT_PUBLIC_COZE_BOT_ID 已设置'));
}

console.log(colors.green('✅ NEXT_PUBLIC_COZE_API_URL: ') + config.NEXT_PUBLIC_COZE_API_URL);
console.log(colors.green('✅ NEXT_PUBLIC_APP_URL: ') + config.NEXT_PUBLIC_APP_URL);

console.log(colors.bold('\n📊 总结：\n'));

if (hasErrors) {
  console.log(colors.red('❌ 配置有问题，请修复上述错误'));
  console.log(colors.cyan('\n📚 帮助资源：'));
  console.log('   • Coze 官网: https://www.coze.cn');
  console.log('   • 项目文档: README.md');
  console.log('   • 问题反馈: GitHub Issues');
  
  console.log(colors.yellow('\n💡 配置步骤：'));
  console.log('   1. 在项目根目录创建 .env.local 文件');
  console.log('   2. 添加您的 COZE_API_KEY');
  console.log('   3. 添加您的 NEXT_PUBLIC_COZE_BOT_ID');
  console.log('   4. 重新运行此验证脚本');
  
  process.exit(1);
} else {
  console.log(colors.green('✅ 配置看起来正确！'));
  console.log(colors.blue('🚀 你可以运行 npm run dev 启动开发服务器'));
  
  console.log(colors.yellow('\n💡 下一步建议：'));
  console.log('   • 运行 npm run dev 启动开发服务器');
  console.log('   • 在浏览器中测试小红书链接提取功能');
  console.log('   • 查看浏览器控制台确认 API 调用正常');
}

console.log(colors.bold(colors.cyan('\n✨ 验证完成\n'))); 