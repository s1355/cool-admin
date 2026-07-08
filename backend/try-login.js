process.env.NODE_ENV = 'production';
const http = require('http');

function post(url, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({
                status: res.statusCode,
                body: Buffer.concat(chunks).toString()
            }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

let attempts = 0;
const maxAttempts = 30;
function poll() {
    attempts++;
    post('http://localhost:8001/admin/base/open/login', {
        username: 'admin', password: '123456', captchaId: '', code: ''
    }).then(r => {
        console.log(`[${attempts}] Status: ${r.status}, Body: ${r.body.substring(0, 200)}`);
        if (r.status === 200) {
            console.log('LOGIN WORKS!');
            process.exit(0);
        } else {
            if (attempts < maxAttempts) setTimeout(poll, 2000);
            else { console.log('Giving up'); process.exit(1); }
        }
    }).catch(err => {
        console.log(`[${attempts}] Error: ${err.message}`);
        if (attempts < maxAttempts) setTimeout(poll, 2000);
        else { console.log('Giving up'); process.exit(1); }
    });
}

console.log('Waiting 5 seconds for server to start...');
setTimeout(poll, 5000);
