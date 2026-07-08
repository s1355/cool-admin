<template>
	<!-- 电影详情页 - 展示电影完整信息 -->
	<div class="film-detail">
		<!-- 顶部导航栏 -->
		<el-page-header class="detail-header" @back="handleBack">
			<template #content>
				<span class="header-title">电影详情</span>
			</template>
			<template #extra>
				<el-button type="primary" @click="handleEdit">编辑</el-button>
			</template>
		</el-page-header>

		<!-- 主内容区 -->
		<div class="detail-content">
			<!-- 骨架屏加载状态 -->
			<template v-if="loading">
				<el-skeleton :rows="10" animated />
			</template>

			<!-- 详情内容 -->
			<template v-else>
				<!-- 卡片1：海报轮播与基本信息 -->
				<el-card class="detail-card card-poster" shadow="hover">
					<div class="poster-wrapper">
						<!-- 左侧：海报轮播 -->
						<div class="poster-carousel">
							<el-carousel
								:interval="5000"
								arrow="always"
								height="450px"
								indicator-position="outside"
							>
								<el-carousel-item v-for="(poster, index) in posterList" :key="index">
									<img :src="poster" :alt="`海报${index + 1}`" class="poster-image" />
								</el-carousel-item>
							</el-carousel>
						</div>

						<!-- 右侧：基本信息 -->
						<div class="basic-info">
							<!-- 电影名称 -->
							<h1 class="film-name">{{ filmInfo.name }}</h1>

							<!-- 质量评级标签 -->
							<el-tag
								:type="qualityTagType"
								size="large"
								effect="dark"
								class="quality-tag"
							>
								{{ filmInfo.quality }}级
							</el-tag>

							<!-- 基本信息列表 -->
							<div class="info-list">
								<div class="info-item">
									<span class="info-label">导演：</span>
									<span class="info-value">{{ filmInfo.director || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">年份：</span>
									<span class="info-value">{{ filmInfo.year || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">国家：</span>
									<span class="info-value">{{ filmInfo.country || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">语言：</span>
									<span class="info-value">{{ filmInfo.language || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">分类：</span>
									<el-tag v-if="categoryName" size="small" type="info">
										{{ categoryName }}
									</el-tag>
									<span v-else class="info-value">-</span>
								</div>
								<div class="info-item">
									<span class="info-label">状态：</span>
									<el-tag
										:type="filmInfo.watched ? 'success' : 'info'"
										size="small"
									>
										{{ filmInfo.watched ? '已看' : '未看' }}
									</el-tag>
								</div>
							</div>

							<!-- 评分区域 -->
							<div class="rating-section">
								<div class="rating-item">
									<div class="rating-label">豆瓣评分</div>
									<div class="rating-value douban">
										{{ filmInfo.doubanRating || '-' }}
									</div>
								</div>
								<div class="rating-item">
									<div class="rating-label">TMDB评分</div>
									<div class="rating-value tmdb">
										{{ filmInfo.tmdbRating || '-' }}
									</div>
								</div>
								</div>

							<!-- 链接 -->
						<div class="link-section" v-if="filmInfo.link">
							<span class="info-label">链接：</span>
							<el-link
								:href="sanitizeUrl(filmInfo.link)"
								target="_blank"
								type="primary"
								:underline="false"
							>
								{{ filmInfo.link }}
							</el-link>
						</div>
						</div>
					</div>
				</el-card>

				<!-- 卡片2：主要人物 -->
				<el-card class="detail-card" shadow="hover">
					<template #header>
						<span class="card-title">主要人物</span>
					</template>
					<div class="card-content text-content">
						{{ filmInfo.mainCharacters || '暂无信息' }}
					</div>
				</el-card>

				<!-- 卡片3：内容简介 -->
				<el-card class="detail-card" shadow="hover">
					<template #header>
						<span class="card-title">内容简介</span>
					</template>
					<div class="card-content text-content">
						{{ filmInfo.synopsis || '暂无信息' }}
					</div>
				</el-card>

				<!-- 卡片4：背景故事 -->
				<el-card class="detail-card" shadow="hover">
					<template #header>
						<span class="card-title">背景故事</span>
					</template>
					<div class="card-content text-content">
						{{ filmInfo.backgroundStory || '暂无信息' }}
					</div>
				</el-card>

				<!-- 卡片5：荣誉与亮点（左右两列） -->
				<el-row :gutter="20" class="detail-row">
					<el-col :xs="24" :sm="24" :md="12">
						<el-card class="detail-card" shadow="hover">
							<template #header>
								<span class="card-title">荣誉</span>
							</template>
							<div class="card-content text-content">
								{{ filmInfo.honors || '暂无信息' }}
							</div>
						</el-card>
					</el-col>
					<el-col :xs="24" :sm="24" :md="12">
						<el-card class="detail-card" shadow="hover">
							<template #header>
								<span class="card-title">亮点所在</span>
							</template>
							<div class="card-content text-content">
								{{ filmInfo.highlights || '暂无信息' }}
							</div>
						</el-card>
					</el-col>
				</el-row>

				<!-- 卡片6：为什么值得一看 -->
				<el-card class="detail-card card-highlight" shadow="hover">
					<template #header>
						<span class="card-title highlight-title">为什么值得一看</span>
					</template>
					<div class="card-content text-content highlight-content">
						{{ filmInfo.whyWorthWatching || '暂无信息' }}
					</div>
				</el-card>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
defineOptions({
	name: 'film-detail'
});

import { useCool } from '/@/cool';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const { service } = useCool();
const route = useRoute();
const router = useRouter();

// 加载状态 - 控制骨架屏显示
const loading = ref(true);

// 电影详情数据
const filmInfo = reactive<any>({
	name: '',
	quality: '',
	director: '',
	year: '',
	country: '',
	language: '',
	categoryId: null,
	categoryName: '',
	watched: false,
	posters: [],
	doubanRating: null,
	tmdbRating: null,
	link: '',
	mainCharacters: '',
	synopsis: '',
	backgroundStory: '',
	honors: '',
	highlights: '',
	whyWorthWatching: ''
});

// 分类选项 - 用于显示分类名称
const categoryOptions = ref<any[]>([]);

// 海报列表 - 处理 posters 可能是数组或字符串的情况
const posterList = computed(() => {
	const posters = filmInfo.posters;
	if (Array.isArray(posters) && posters.length > 0) {
		return posters;
	} else if (typeof posters === 'string' && posters) {
		return [posters];
	}
	return [];
});

// 质量标签颜色映射 - S级红色，A级橙色，B级蓝色，C级灰色
const qualityTagType = computed<
	'info' | 'primary' | 'success' | 'warning' | 'danger'
>(() => {
	const map: Record<string, 'info' | 'primary' | 'success' | 'warning' | 'danger'> = {
		S: 'danger',
		A: 'warning',
		B: 'primary',
		C: 'info'
	};
	return map[filmInfo.quality] || 'info';
});

// 分类名称 - 根据 categoryId 查找对应的分类名称
const categoryName = computed(() => {
	if (!filmInfo.categoryId) return '';
	const category = categoryOptions.value.find(
		(item: any) => item.id === filmInfo.categoryId
	);
	return category ? category.name : '';
});

// URL 协议过滤 - 只允许 http:// 和 https:// 协议，防止 javascript: 等恶意协议
function sanitizeUrl(url: string): string {
	if (!url) return '';
	// 只允许 http:// 和 https:// 协议
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}
	// 其他协议返回空字符串
	return '';
}

// API: service.knowledge.film.info - 获取电影详情
// API: service.knowledge.filmCategory.list - 获取电影分类列表

// 加载电影详情数据
async function loadFilmDetail() {
	loading.value = true;
	try {
		const id = route.params.id;
		const res = await service.knowledge.film.info({ id });
		Object.assign(filmInfo, res);
	} catch (e: any) {
		ElMessage.error(e.message || '加载详情失败');
	} finally {
		loading.value = false;
	}
}

// 加载分类选项 - 用于显示分类名称
async function loadCategoryOptions() {
	try {
		const res: any = await service.knowledge.filmCategory.list();
		categoryOptions.value = res || [];
	} catch (e) {
		console.error('加载分类选项失败', e);
	}
}

// 返回列表页
function handleBack() {
	router.push('/knowledge/film');
}

// 跳转到编辑页 - 复用列表页的编辑功能
function handleEdit() {
	// 通过路由传参，返回列表页并触发编辑
	router.push({
		path: '/knowledge/film',
		query: { editId: filmInfo.id }
	});
}

// 页面初始化
onMounted(() => {
	// 先加载分类选项，再加载详情
	loadCategoryOptions().then(() => {
		loadFilmDetail();
	});
});
</script>

<style scoped lang="scss">
.film-detail {
	height: 100%;
	overflow-y: auto;
	background: var(--el-bg-color-page);
	padding-bottom: 40px;
	box-sizing: border-box;

	// 顶部导航栏
	.detail-header {
		background: var(--el-bg-color);
		padding: 16px 20px;
		margin-bottom: 20px;
		border-bottom: 1px solid var(--el-border-color-lighter);

		.header-title {
			font-size: 18px;
			font-weight: 600;
		}
	}

	// 主内容区 - 居中，最大宽度1200px
	.detail-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	// 卡片通用样式
	.detail-card {
		margin-bottom: 20px;
		border-radius: 8px;
		transition: all 0.3s ease;

		// hover 轻微上浮效果
		&:hover {
			transform: translateY(-2px);
		}

		.card-title {
			font-size: 16px;
			font-weight: 600;
			color: var(--el-text-color-primary);
		}

		// 文本内容样式
		.text-content {
			line-height: 1.8;
			color: var(--el-text-color-regular);
			white-space: pre-wrap;
			word-break: break-word;
		}
	}

	// 左右两列布局行
	.detail-row {
		margin-bottom: 0;
	}

	// 卡片1：海报轮播与基本信息
	.card-poster {
		.poster-wrapper {
			display: flex;
			gap: 30px;

			// 海报轮播区域
			.poster-carousel {
				flex: 0 0 45%;
				max-width: 400px;

				.poster-image {
					width: 100%;
					height: 100%;
					object-fit: cover;
					border-radius: 4px;
				}
			}

			// 基本信息区域
			.basic-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 16px;

				// 电影名称
				.film-name {
					font-size: 24px;
					font-weight: 700;
					color: var(--el-text-color-primary);
					margin: 0;
					line-height: 1.4;
				}

				// 质量评级标签
				.quality-tag {
					align-self: flex-start;
					font-size: 14px;
					padding: 4px 12px;
				}

				// 信息列表
				.info-list {
					display: flex;
					flex-direction: column;
					gap: 10px;

					.info-item {
						display: flex;
						align-items: center;
						font-size: 14px;

						.info-label {
							color: var(--el-text-color-secondary);
							flex-shrink: 0;
							width: 60px;
						}

						.info-value {
							color: var(--el-text-color-primary);
						}
					}
				}

				// 评分区域
				.rating-section {
					display: flex;
					gap: 30px;
					padding: 16px 0;
					border-top: 1px solid var(--el-border-color-lighter);
					border-bottom: 1px solid var(--el-border-color-lighter);

					.rating-item {
						text-align: center;

						.rating-label {
							font-size: 12px;
							color: var(--el-text-color-secondary);
							margin-bottom: 6px;
						}

						.rating-value {
							font-size: 28px;
							font-weight: 700;

							&.douban {
								color: #41ac52;
							}

							&.tmdb {
								color: #01b4e4;
							}

							&.personal {
								:deep(.el-rate) {
									height: 28px;
									line-height: 28px;
								}

								:deep(.el-rate__text) {
									font-size: 20px;
									font-weight: 600;
								}
							}
						}
					}
				}

				// 链接区域
				.link-section {
					font-size: 14px;

					.info-label {
						color: var(--el-text-color-secondary);
					}
				}
			}
		}
	}

	// 卡片6：为什么值得一看 - 强调样式
	.card-highlight {
		border-left: 4px solid var(--el-color-primary);

		.highlight-title {
			color: var(--el-color-primary);
		}

		.highlight-content {
			color: var(--el-text-color-primary);
			font-weight: 500;
		}
	}
}

// 响应式布局 - 小屏幕下单列显示
@media (max-width: 768px) {
	.film-detail {
		.card-poster {
			.poster-wrapper {
				flex-direction: column;
				gap: 20px;

				.poster-carousel {
					flex: none;
					max-width: 100%;
					width: 100%;
				}
			}
		}

		.rating-section {
			flex-wrap: wrap;
			gap: 16px !important;

			.rating-item {
				flex: 1;
				min-width: 80px;
			}
		}
	}
}
</style>
