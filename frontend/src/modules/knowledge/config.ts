import { type ModuleConfig } from '/@/cool';

export default (): ModuleConfig => {
	return {
		components: Object.values(import.meta.glob('./components/**/*.{vue,tsx}')),
		views: [
			{
				// 电影详情页 - 动态路由
				path: '/knowledge/film/:id',
				meta: {
					label: '电影详情'
				},
				component: () => import('./views/film/detail.vue')
			},
			{
				// 书籍详情页 - 动态路由
				path: '/knowledge/book/:id',
				meta: {
					label: '书籍详情'
				},
				component: () => import('./views/book/detail.vue')
			}
		]
	};
};
