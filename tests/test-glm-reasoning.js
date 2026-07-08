const https = require('https');

const API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-placeholder-replace-with-real-key';

async function testModel(model, reasoningEnabled) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: '你好，介绍一下自己。' }
      ],
      max_tokens: 150,
      reasoning: {
        enabled: reasoningEnabled
      }
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
          const content = json.choices?.[0]?.message?.content || '(空)';
          const reasoning = json.choices?.[0]?.message?.reasoning || '(空)';
          
          resolve({
            success: res.statusCode === 200,
            model: model,
            content: content.substring(0, 100),
            hasContent: content !== '(空)' && content !== null,
            reasoningLength: reasoning !== '(空)' ? reasoning.length : 0,
            cost: json.usage?.cost || 0,
            finishReason: json.choices?.[0]?.finish_reason
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
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
  console.log('测试 GLM-4.5-Air 推理模式');
  console.log('========================================\n');

  const tests = [
    { model: 'z-ai/glm-4.5-air:free', reasoning: false },
    { model: 'z-ai/glm-4.5-air:free', reasoning: true },
    { model: 'z-ai/glm-4.5-air', reasoning: false },
    { model: 'z-ai/glm-4.5-air', reasoning: true }
  ];

  console.log('┌─────────────────────────────┬───────────┬──────────────┬──────────┬────────┐');
  console.log('│ 模型                        │ Reasoning │ 响应内容     │ Reasoning │ 费用   │');
  console.log('│                             │           │ 是否正常     │ 长度     │        │');
  console.log('├─────────────────────────────┼───────────┼──────────────┼──────────┼────────┤');

  for (const { model, reasoning } of tests) {
    const result = await testModel(model, reasoning);
    
    if (result.success) {
      console.log(`│ ${model.padEnd(25)} │ ${reasoning ? '启用' : '禁用'}    │ ${result.hasContent ? '✓ 正常' : '✗ 空'}    │ ${result.reasoningLength.toString().padStart(6)} │ $${result.cost.toFixed(6)} │`);
    } else {
      console.log(`│ ${model.padEnd(25)} │ ${reasoning ? '启用' : '禁用'}    │ 失败         │ -        │ -       │`);
    }
    
    if (result.hasContent) {
      console.log(`├─────────────────────────────┴───────────┴──────────────┴──────────┴────────┤`);
      console.log(`│ 响应示例: ${result.content}`);
    }
    console.log('└──────────────────────────────────────────────────────────────────────────────┘');
  }
}

runTests().catch(console.error);
