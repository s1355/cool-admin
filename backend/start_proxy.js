import { Bootstrap } from '@midwayjs/bootstrap';
import { resolve } from 'path';
import * as koa from '@midwayjs/koa';

Bootstrap.configure({
  imports: [
    koa,
    require(resolve(__dirname, 'dist/configuration')),
  ],
  moduleDetector: false,
}).run();
