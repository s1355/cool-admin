const https = require('https');

const API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-placeholder-replace-with-real-key';

const MODELS_TO_TEST = [
  'z-ai/glm-4.5-air:free',
  'z-ai/glm-4.5-air'
];

function testModel(model) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: '你好，请用一句话介绍你自己。' }
      ],
      max_tokens: 100
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
        const elapsed = Date.now() - startTime;
        
        try {
          const json = JSON.parse(data);
          
          if (res.statusCode === 200) {
            const content = json.choices?.[0]?.message?.content || '无响应内容';
            resolve({
              success: true,
              model: model,
              elapsed: elapsed,
              content: content.substring(0, 80) + (content.length > 80 ? '...' : ''),
              usage: json.usage
            });
          } else {
            resolve({
              success: false,
              model: model,
              elapsed: elapsed,
              error: json.error?.message || data.substring(0, 100)
            });
          }
        } catch (e) {
          resolve({
            success: false,
            model: model,
            elapsed: elapsed,
            error: '解析失败: ' + e.message + ' | 响应: ' + data.substring(0, 50)
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        success: false,
        model: model,
        elapsed: Date.now() - startTime,
        error: '请求失败: ' + e.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('测试 z-ai/glm-4.5-air 模型格式');
  console.log('========================================');
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  for (const model of MODELS_TO_TEST) {
    console.log(`测试模型: ${model}`);
    const result = await testModel(model);
    
    if (result.success) {
      console.log(`  ✓ 成功 (${result.elapsed}ms)`);
      console.log(`  响应: ${result.content}`);
      if (result.usage) {
        console.log(`  Token: prompt=${result.usage.prompt_tokens}, completion=${result.usage.completion_tokens}`);
      }
    } else {
      console.log(`  ✗ 失败 (${result.elapsed}ms)`);
      console.log(`  错误: ${result.error}`);
    }
    console.log('');
  }

  console.log('========================================');
  console.log('测试完成');
  console.log('========================================');
}

runTests().catch(console.error);
