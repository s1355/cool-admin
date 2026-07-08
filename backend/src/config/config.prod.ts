import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';
import { entities } from '../entities';

/**
 * 生产环境配置
 */
export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        username: 'cool-admin',
        password: '7dz2ssmWSNWfsAbK',
        database: 'cool-admin',
        // 首次建表用true，后续必须关掉
        synchronize: true,
        // 打印日志
        logging: true,
        // 字符集
        charset: 'utf8mb4',
        // 是否开启缓存
        cache: true,
        // 实体路径
        entities,
        // 订阅者（多租户未开启，暂不注册）
        // subscribers: [TenantSubscriber],
      },
    },
  },
  cool: {
    // 启用 EPS，前端需要获取 API 路由映射
    eps: true,
    // 首次运行需要 true 来导入种子数据（admin用户、菜单等），导入成功后改回 false
    initDB: true,
    initJudge: 'db',
    initMenu: true,
    // 禁用国际化翻译，消除 BaseTranslateMiddleware 无效错误
    i18n: {
      enable: false,
    },
  } as CoolConfig,
} as MidwayConfig;
