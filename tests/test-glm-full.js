const https = require('https');

const API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-placeholder-replace-with-real-key';

async function testModel(model) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: '请用中文回答：什么是人工智能？' }
      ],
      max_tokens: 200
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            model: model,
            response: json
          });
        } catch (e) {
          resolve({
            success: false,
            error: '解析失败: ' + e.message,
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('测试 z-ai/glm-4.5-air 完整响应');
  console.log('========================================\n');

  const models = ['z-ai/glm-4.5-air:free', 'z-ai/glm-4.5-air'];
  
  for (const model of models) {
    console.log(`\n=== 测试: ${model} ===`);
    const result = await testModel(model);
    
    if (result.success) {
      console.log('状态码:', result.statusCode);
      console.log('\n完整响应JSON:');
      console.log(JSON.stringify(result.response, null, 2));
      
      const content = result.response.choices?.[0]?.message?.content;
      if (content) {
        console.log('\n响应内容:');
        console.log(content);
      } else {
        console.log('\n响应内容: 空');
      }
    } else {
      console.log('失败:', result.error);
      if (result.rawResponse) {
        console.log('原始响应:', result.rawResponse.substring(0, 200));
      }
    }
  }
}

runTests().catch(console.error);
