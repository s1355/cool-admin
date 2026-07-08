process.env.NODE_ENV = 'production';
const http = require('http');

function waitForServer(url, maxAttempts, delay) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const tryConnect = () => {
            attempts++;
            http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            }).on('error', (err) => {
                if (attempts < maxAttempts) {
                    setTimeout(tryConnect, delay);
                } else {
                    reject(new Error(`Failed after ${attempts} attempts: ${err.message}`));
                }
            });
        };
        tryConnect();
    });
}

async function main() {
    console.log('Starting server...');
    const { Bootstrap } = require('@midwayjs/bootstrap');
    const koa = require('@midwayjs/koa');

    Bootstrap.configure({
        imports: [koa, require('./dist/configuration')],
    });

    await Bootstrap.run();
    console.log('Server started, waiting for async decorators...');
    await new Promise(r => setTimeout(r, 3000));

    const result = await waitForServer('http://localhost:8001/admin/base/open/login', 5, 2000);
    console.log('Status:', result.status);
    console.log('Body:', result.data);

    // Wait for logs to flush
    await new Promise(r => setTimeout(r, 3000));
    process.exit(0);
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
