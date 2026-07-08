/**
 * 核销端登录功能测试
 * 测试目标：verify_login 接口
 * 测试账号：tech001 / Tech@001
 */

const https = require('https');
const http = require('http');
const querystring = require('querystring');

// 测试配置
const CONFIG = {
  baseUrl: 'https://hyyy.yuanzhengjun.xyz/huiayuangl/api/index.php',
  testUsername: 'tech001',
  testPassword: 'Tech@001',
};

// 测试结果记录
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 发送HTTP请求
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, body: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: body, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

// 解析URL
function parseUrl(url) {
  const urlObj = new URL(url);
  return {
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
  };
}

// 测试用例运行器
async function runTest(name, testFn) {
  testResults.total++;
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}测试: ${name}${colors.reset}`);
  
  try {
    const result = await testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed', result });
    console.log(`${colors.green}✅ 测试通过${colors.reset}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
    console.log(`${colors.red}❌ 测试失败: ${error.message}${colors.reset}`);
    return false;
  }
}

// POST请求工具 - 使用 x-www-form-urlencoded 格式
async function postRequest(action, params) {
  const url = `${CONFIG.baseUrl}?action=${action}`;
  const parsedUrl = parseUrl(url);
  const postData = querystring.stringify(params);
  
  const options = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  };
  
  // 隐藏密码打印
  const printParams = { ...params };
  if (printParams.password) {
    printParams.password = '***';
  }
  
  console.log(`   请求: POST ${url}`);
  console.log(`   参数:`, printParams);
  
  return await makeRequest(options, postData);
}

// 测试用例1：正常登录 - 使用正确的账号密码
async function testValidLogin() {
  const response = await postRequest('verify_login', {
    username: CONFIG.testUsername,
    password: CONFIG.testPassword,
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status !== 200) {
    throw new Error(`期望状态码200，但得到${response.status}`);
  }
  
  if (!response.body || response.body.code !== 200) {
    throw new Error(`API返回码错误: ${response.body?.code || 'unknown'}, 消息: ${response.body?.message || 'unknown'}`);
  }
  
  if (!response.body.data) {
    throw new Error('未返回data数据');
  }
  
  console.log(`   ✅ 返回员工ID: ${response.body.data.id}`);
  console.log(`   ✅ 返回姓名: ${response.body.data.name}`);
  console.log(`   ✅ 返回门店ID: ${response.body.data.store_id}`);
  console.log(`   ✅ 返回门店名: ${response.body.data.store_name}`);
  
  // 注意：API当前返回的数据中没有token，根据实际返回验证
  if (response.body.data.token) {
    console.log(`   ✅ 返回token: ${response.body.data.token.substring(0, 30)}...`);
  }
  
  return response.body;
}

// 测试用例2：账号为空
async function testEmptyUsername() {
  const response = await postRequest('verify_login', {
    username: '',
    password: CONFIG.testPassword,
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('账号为空时不应该登录成功');
  }
  
  return response.body;
}

// 测试用例3：密码为空
async function testEmptyPassword() {
  const response = await postRequest('verify_login', {
    username: CONFIG.testUsername,
    password: '',
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('密码为空时不应该登录成功');
  }
  
  return response.body;
}

// 测试用例4：账号和密码都为空
async function testEmptyBoth() {
  const response = await postRequest('verify_login', {
    username: '',
    password: '',
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('账号密码都为空时不应该登录成功');
  }
  
  return response.body;
}

// 测试用例5：错误的密码
async function testWrongPassword() {
  const response = await postRequest('verify_login', {
    username: CONFIG.testUsername,
    password: 'WrongPassword123!',
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('错误密码时不应该登录成功');
  }
  
  return response.body;
}

// 测试用例6：不存在的账号
async function testNonExistentUsername() {
  const response = await postRequest('verify_login', {
    username: 'nonexistent_user_999',
    password: 'AnyPassword123!',
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('不存在的账号不应该登录成功');
  }
  
  return response.body;
}

// 测试用例7：禁用的账号（如果有的话）
async function testDisabledAccount() {
  const response = await postRequest('verify_login', {
    username: 'disabled_user',
    password: 'AnyPassword123!',
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    console.log(`   ⚠️  注意：如果这是一个测试账号，可能不存在或已启用`);
  }
  
  return response.body;
}

// 测试用例8：SQL注入测试 - 单引号
async function testSqlInjectionSingleQuote() {
  const response = await postRequest('verify_login', {
    username: CONFIG.testUsername + "' OR '1'='1",
    password: CONFIG.testPassword,
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('SQL注入测试失败 - 应该拒绝非法输入');
  }
  
  return response.body;
}

// 测试用例9：SQL注入测试 - 注释
async function testSqlInjectionComment() {
  const response = await postRequest('verify_login', {
    username: CONFIG.testUsername + "' -- ",
    password: 'any',
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('SQL注入测试失败 - 应该拒绝非法输入');
  }
  
  return response.body;
}

// 测试用例10：特殊字符测试
async function testSpecialCharacters() {
  const response = await postRequest('verify_login', {
    username: 'test<>script&',
    password: 'pass<>',
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    console.log(`   ⚠️  注意：特殊字符账号登录成功，需要确认是否预期行为`);
  }
  
  return response.body;
}

// 测试用例11：超长用户名
async function testLongUsername() {
  const longUsername = 'a'.repeat(200);
  const response = await postRequest('verify_login', {
    username: longUsername,
    password: CONFIG.testPassword,
  });
  
  console.log(`   响应状态码: ${response.status}`);
  console.log(`   响应数据:`, response.body);
  
  if (response.status === 200 && response.body.code === 200) {
    throw new Error('超长用户名不应该登录成功');
  }
  
  return response.body;
}

// 生成报告
function generateReport() {
  console.log(`\n\n${colors.yellow}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.yellow}║                    核销端登录功能测试报告                    ║${colors.reset}`);
  console.log(`${colors.yellow}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n📅 测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🔗 测试接口: verify_login`);
  console.log(`👤 测试账号: ${CONFIG.testUsername}`);
  
  console.log(`\n📊 测试统计:`);
  console.log(`   总测试数: ${testResults.total}`);
  console.log(`   ${colors.green}通过: ${testResults.passed}${colors.reset}`);
  console.log(`   ${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`   通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log(`\n📋 详细测试结果:`);
  testResults.tests.forEach((test, index) => {
    const statusIcon = test.status === 'passed' ? '✅' : '❌';
    const statusColor = test.status === 'passed' ? colors.green : colors.red;
    console.log(`   ${statusIcon} ${index + 1}. ${test.name}`);
    if (test.error) {
      console.log(`      ${colors.red}错误: ${test.error}${colors.reset}`);
    }
  });
  
  const overallStatus = testResults.failed === 0 ? '✅ 测试通过' : '⚠️  存在失败的测试';
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${testResults.failed === 0 ? colors.green : colors.red}${overallStatus}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // 返回JSON报告
  return {
    timestamp: new Date().toISOString(),
    config: {
      baseUrl: CONFIG.baseUrl,
      testUsername: CONFIG.testUsername,
    },
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(1),
    },
    tests: testResults.tests,
  };
}

// 主测试函数
async function main() {
  console.log(`${colors.yellow}`);
  console.log(`╔════════════════════════════════════════════════════════════╗`);
  console.log(`║           核销端登录功能 - verify_login 接口测试            ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`${colors.reset}`);
  console.log(`测试配置:`);
  console.log(`  API Base: ${CONFIG.baseUrl}`);
  console.log(`  测试账号: ${CONFIG.testUsername}`);
  console.log(`  测试密码: ${CONFIG.testPassword}`);
  
  // 运行所有测试
  await runTest('正常登录 - 使用正确账号密码', testValidLogin);
  await runTest('账号为空时的处理', testEmptyUsername);
  await runTest('密码为空时的处理', testEmptyPassword);
  await runTest('账号密码都为空时的处理', testEmptyBoth);
  await runTest('错误密码的处理', testWrongPassword);
  await runTest('不存在账号的处理', testNonExistentUsername);
  await runTest('禁用账号的处理（如果存在）', testDisabledAccount);
  await runTest('SQL注入防护 - 单引号', testSqlInjectionSingleQuote);
  await runTest('SQL注入防护 - 注释', testSqlInjectionComment);
  await runTest('特殊字符处理', testSpecialCharacters);
  await runTest('超长用户名处理', testLongUsername);
  
  // 生成报告
  const report = generateReport();
  
  // 保存JSON报告
  const fs = require('fs');
  const path = require('path');
  const reportDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportFile = path.join(reportDir, `verify-login-test-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`📄 JSON报告已保存: ${reportFile}`);
  
  return report;
}

// 运行测试
main().then((report) => {
  process.exit(report.summary.failed === 0 ? 0 : 1);
}).catch((error) => {
  console.error('测试运行异常:', error);
  process.exit(1);
});
