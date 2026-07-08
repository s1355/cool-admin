// 调用电影列表接口，查看 posters 字段格式
const BASE_URL = 'http://localhost:8001';

// 先登录获取 token
async function login() {
    const res = await fetch(`${BASE_URL}/admin/base/open/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: '123456',
            captchaId: 'test',
            verifyCode: 1111
        })
    });
    const data = await res.json();
    console.log('登录响应:', JSON.stringify(data).substring(0, 300));
    return data.data?.token;
}

async function main() {
    const token = await login();
    console.log('\nToken:', token ? '获取成功' : '获取失败');
    
    if (!token) {
        console.log('登录失败，请检查账号密码');
        return;
    }
    
    // 调用列表接口
    const res = await fetch(`${BASE_URL}/admin/knowledge/film/page?page=1&size=20`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const data = await res.json();
    console.log('\n列表返回码:', data.code);
    
    if (data.data && data.data.list) {
        const list = data.data.list;
        console.log(`\n共 ${list.length} 条数据\n`);
        
        // 打印每条数据的 posters 字段
        list.forEach((item, index) => {
            const p = item.posters;
            let typeInfo = '';
            if (p === null) typeInfo = 'null';
            else if (Array.isArray(p)) typeInfo = `数组[${p.length}]`;
            else if (typeof p === 'string') typeInfo = `字符串[${p.length}]: ${p.substring(0, 60)}`;
            else typeInfo = `${typeof p}: ${JSON.stringify(p).substring(0, 60)}`;
            
            console.log(`${index + 1}. ${item.name} - posters: ${typeInfo}`);
        });
    } else {
        console.log('列表数据为空，完整响应:', JSON.stringify(data).substring(0, 1000));
    }
}

main().catch(console.error);
