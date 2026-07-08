const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const BACKEND_URL = 'http://localhost:8001';
const APP_KEYS = 'a02e8413-52ff-467b-b1cb-b968e5bd8765';
const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');
const CACHE_DIR = path.join(os.homedir(), '.cool-admin', md5(APP_KEYS), 'cache');

function getCaptchaFromCache(captchaId) {
  const key = `verify:img:${captchaId}`;
  const files = fs.readdirSync(CACHE_DIR);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
      const data = JSON.parse(content);
      if (data.key === key) {
        return data.val;
      }
    } catch (e) {}
  }
  return null;
}

(async () => {
  // 1. 获取验证码
  const captchaResp = await axios.get(`${BACKEND_URL}/admin/base/open/captcha`, { timeout: 10000 });
  const captchaId = captchaResp.data.data.captchaId;
  await new Promise(r => setTimeout(r, 200));
  const verifyCode = getCaptchaFromCache(captchaId);
  console.log('captchaId:', captchaId);
  console.log('verifyCode:', verifyCode);
  
  // 2. 登录
  const loginResp = await axios.post(`${BACKEND_URL}/admin/base/open/login`, {
    username: 'admin',
    password: '123456',
    captchaId: captchaId,
    verifyCode: verifyCode
  }, { timeout: 10000 });
  
  console.log('\nLogin response:');
  console.log(JSON.stringify(loginResp.data, null, 2));
  
  const token = loginResp.data.data.token;
  console.log('\nToken:', token);
  
  // 3. 尝试调用一个需要认证的接口
  console.log('\n--- Test with Authorization: Bearer <token> ---');
  try {
    const resp = await axios.get(`${BACKEND_URL}/admin/knowledge/film/page?page=1&size=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    console.log('Status:', resp.status);
    console.log('Data keys:', Object.keys(resp.data));
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data));
  }
  
  // 尝试其他 header 格式
  console.log('\n--- Test with Authorization: <token> (no Bearer) ---');
  try {
    const resp = await axios.get(`${BACKEND_URL}/admin/knowledge/film/page?page=1&size=10`, {
      headers: {
        'Authorization': token
      },
      timeout: 10000
    });
    console.log('Status:', resp.status);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data));
  }
  
  // 尝试 token header
  console.log('\n--- Test with token header ---');
  try {
    const resp = await axios.get(`${BACKEND_URL}/admin/knowledge/film/page?page=1&size=10`, {
      headers: {
        'token': token
      },
      timeout: 10000
    });
    console.log('Status:', resp.status);
  } catch (error) {
    console.log('Error status:', error.response?.status);
  }
  
  // 尝试 satoken (sa-token 风格)
  console.log('\n--- Test with satoken header ---');
  try {
    const resp = await axios.get(`${BACKEND_URL}/admin/knowledge/film/page?page=1&size=10`, {
      headers: {
        'satoken': token
      },
      timeout: 10000
    });
    console.log('Status:', resp.status);
  } catch (error) {
    console.log('Error status:', error.response?.status);
  }
  
})();
