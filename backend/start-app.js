const { create } = require('@midwayjs/mock');
const { join } = require('path');

process.env.NODE_ENV = 'local';
process.env.MIDWAY_TS_MODE = 'false';
process.env.MIDWAY_HTTP_PORT = '8001';

async function main() {
  try {
    const framework = await create(process.cwd(), {
      appDir: process.cwd(),
      baseDir: join(process.cwd(), 'dist'),
    });
    const app = framework.getApplication();
    console.log('[OK] Server starting on port 8001');

    setInterval(() => {}, 1 << 30);
  } catch (err) {
    console.error('[FAIL]', err.message);
    process.exit(1);
  }
}

main();
