const { Bootstrap } = require('@midwayjs/bootstrap');
const koa = require('@midwayjs/koa');

Bootstrap.configure({
  imports: [
    koa,
    require('./dist/configuration'),
  ],
  // moduleDetector: false, 移除：禁用后 DI 容器无法自动注册 @Provide() 装饰的类
}).run();
