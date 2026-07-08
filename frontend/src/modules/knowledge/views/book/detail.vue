<template>
	<!-- 书籍详情页 - 展示书籍完整信息 -->
	<div class="book-detail">
		<!-- 顶部导航栏 -->
		<el-page-header class="detail-header" @back="handleBack">
			<template #content>
				<span class="header-title">书籍详情</span>
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
				<!-- 卡片1：封面轮播与基本信息 -->
				<el-card class="detail-card card-cover" shadow="hover">
					<div class="cover-wrapper">
						<!-- 左侧：封面轮播 -->
						<div class="cover-carousel">
							<el-carousel
								:interval="5000"
								arrow="always"
								height="450px"
								indicator-position="outside"
							>
								<el-carousel-item v-for="(cover, index) in coverList" :key="index">
									<img :src="cover" :alt="`封面${index + 1}`" class="cover-image" />
								</el-carousel-item>
							</el-carousel>
						</div>

						<!-- 右侧：基本信息 -->
						<div class="basic-info">
							<!-- 书籍名称 -->
							<h1 class="book-name">{{ bookInfo.name }}</h1>

							<!-- 质量评级标签 -->
							<el-tag
								:type="qualityTagType"
								size="large"
								effect="dark"
								class="quality-tag"
							>
								{{ bookInfo.quality }}级
							</el-tag>

							<!-- 基本信息列表 -->
							<div class="info-list">
								<div class="info-item">
									<span class="info-label">原名：</span>
									<span class="info-value">{{ bookInfo.originalName || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">作者：</span>
									<span class="info-value">{{ bookInfo.author || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">年份：</span>
									<span class="info-value">{{ bookInfo.year || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">国家：</span>
									<span class="info-value">{{ bookInfo.country || '-' }}</span>
								</div>
								<div class="info-item">
									<span class="info-label">优先级：</span>
									<el-tag
										v-if="bookInfo.priority"
										:type="priorityTagType"
										size="small"
									>
										{{ bookInfo.priority }}
									</el-tag>
									<span v-else class="info-value">-</span>
								</div>
								<div class="info-item">
									<span class="info-label">标签：</span>
									<span class="info-value">{{ bookInfo.tags || '-' }}</span>
								</div>
							</div>

							<!-- 评分区域 -->
							<div class="rating-section">
								<div class="rating-item">
									<div class="rating-label">豆瓣评分</div>
									<div class="rating-value douban">
										{{ bookInfo.doubanRating || '-' }}
									</div>
								</div>
							</div>
						</div>
					</div>
				</el-card>

				<!-- 卡片2：内容简介 -->
				<el-card class="detail-card" shadow="hover">
					<template #header>
						<span class="card-title">内容简介</span>
					</template>
					<div class="card-content text-content">
						{{ bookInfo.synopsis || '暂无信息' }}
					</div>
				</el-card>

				<!-- 卡片3：背景故事 -->
				<el-card class="detail-card" shadow="hover">
					<template #header>
						<span class="card-title">背景故事</span>
					</template>
					<div class="card-content text-content">
						{{ bookInfo.backgroundStory || '暂无信息' }}
					</div>
				</el-card>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
defineOptions({
	name: 'book-detail'
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

// 书籍详情数据
const bookInfo = reactive<any>({
	name: '',
	originalName: '',
	author: '',
	year: '',
	country: '',
	cover: [],
	doubanRating: null,
	priority: '',
	quality: '',
	tags: '',
	synopsis: '',
	backgroundStory: ''
});

// 封面列表 - 处理 cover 可能是数组或字符串的情况
const coverList = computed(() => {
	const covers = bookInfo.cover;
	if (Array.isArray(covers) && covers.length > 0) {
		return covers;
	} else if (typeof covers === 'string' && covers) {
		try {
			const parsed = JSON.parse(covers);
			return Array.isArray(parsed) ? parsed : [parsed];
		} catch (e) {
			return [covers];
		}
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
	return map[bookInfo.quality] || 'info';
});

// 优先级标签颜色映射 - P0红色，P1橙色，P2灰色
const priorityTagType = computed<
	'info' | 'primary' | 'success' | 'warning' | 'danger'
>(() => {
	const map: Record<string, 'info' | 'primary' | 'success' | 'warning' | 'danger'> = {
		P0: 'danger',
		P1: 'warning',
		P2: 'info'
	};
	return map[bookInfo.priority] || 'info';
});

// API: service.knowledge.book.info - 获取书籍详情

// 加载书籍详情数据
async function loadBookDetail() {
	loading.value = true;
	try {
		const id = route.params.id;
		const res = await service.knowledge.book.info({ id });
		Object.assign(bookInfo, res);
	} catch (e: any) {
		ElMessage.error(e.message || '加载详情失败');
	} finally {
		loading.value = false;
	}
}

// 返回列表页
function handleBack() {
	router.push('/knowledge/book');
}

// 跳转到编辑页 - 复用列表页的编辑功能
function handleEdit() {
	router.push({
		path: '/knowledge/book',
		query: { editId: bookInfo.id }
	});
}

// 页面初始化
onMounted(() => {
	loadBookDetail();
});
</script>

<style scoped lang="scss">
.book-detail {
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

	// 卡片1：封面轮播与基本信息
	.card-cover {
		.cover-wrapper {
			display: flex;
			gap: 30px;

			// 封面轮播区域
			.cover-carousel {
				flex: 0 0 45%;
				max-width: 400px;

				.cover-image {
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

				// 书籍名称
				.book-name {
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
						}
					}
				}
			}
		}
	}
}

// 响应式布局 - 小屏幕下单列显示
@media (max-width: 768px) {
	.book-detail {
		.card-cover {
			.cover-wrapper {
				flex-direction: column;
				gap: 20px;

				.cover-carousel {
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
