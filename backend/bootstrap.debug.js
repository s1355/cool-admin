const { Bootstrap } = require('@midwayjs/bootstrap');
const koa = require('@midwayjs/koa');

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED:', err);
});

Bootstrap.configure({
    imports: [
        koa,
        require('./dist/configuration'),
    ],

}).run().then(() => {
    console.log('BOOTSTRAP DONE');
}).catch(err => {
    console.error('BOOTSTRAP ERROR:', err);
});
