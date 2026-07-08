process.env.NODE_ENV = 'production';
process.on('uncaughtException', err => console.error('UNCAUGHT:', err));
process.on('unhandledRejection', err => console.error('UNHANDLED:', err));

const { Bootstrap } = require('@midwayjs/bootstrap');
const koa = require('@midwayjs/koa');

Bootstrap.configure({
    imports: [koa, require('./dist/configuration')],
    moduleDetector: false,
}).run().then(() => {
    console.log('APP STARTED SUCCESSFULLY');

    // Try to find and test the Koa app
    const http = require('http');
    
    // Make a request after a short delay
    setTimeout(() => {
        const postData = JSON.stringify({ username: 'admin', password: '123456', captchaId: '', code: '' });
        const req = http.request({
            hostname: 'localhost',
            port: 8001,
            path: '/admin/base/open/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Response status:', res.statusCode);
                console.log('Response body:', data);
                process.exit(0);
            });
        });
        req.on('error', (err) => {
            console.error('Request error:', err);
            process.exit(1);
        });
        req.write(postData);
        req.end();
    }, 2000);
}).catch(err => {
    console.error('BOOTSTRAP ERROR:', err);
    process.exit(1);
});

// Keep alive
setInterval(() => {}, 10000);
