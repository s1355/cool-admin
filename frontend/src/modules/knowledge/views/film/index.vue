<template>
	<!-- 电影管理页面 - CRUD 列表页 -->
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 新增按钮 -->
			<cl-add-btn />
			<!-- 批量删除按钮 -->
			<cl-multi-delete-btn />
			<cl-flex1 />
			<!-- 导入按钮 -->
			<cl-import-btn
				:template="importTemplateUrl"
				:on-submit="onImportSubmit"
				tips="请按照模板填写电影信息，名称为必填项"
			/>
			<!-- 导出按钮 -->
			<cl-export-btn :columns="exportColumns" filename="电影列表" />
			<!-- 分类筛选 -->
			<cl-select
				:options="categoryOptions"
				prop="categoryId"
				:width="140"
				placeholder="分类筛选"
				clearable
			/>
			<!-- 质量筛选 -->
			<cl-select
				:options="qualityOptions"
				prop="quality"
				:width="120"
				placeholder="质量筛选"
				clearable
			/>
			<!-- 是否已看筛选 -->
			<cl-select
				:options="watchedOptions"
				prop="watched"
				:width="120"
				placeholder="已看筛选"
				clearable
			/>
			<!-- 关键字搜索（按名称、导演、主要人物） -->
			<cl-search-key placeholder="搜索名称、导演" />
		</cl-row>

		<cl-row>
			<!-- 数据表格 -->
			<cl-table ref="Table" />
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<!-- 分页 -->
			<cl-pagination />
		</cl-row>

		<!-- 新增、编辑弹窗 -->
		<cl-upsert ref="Upsert" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'film'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { computed, h, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import FilmPosterEdit from '../../components/film-poster-edit.vue';

const { service } = useCool();
const router = useRouter();

// 导入模板文件路径
const importTemplateUrl = '/电影导入模板.xlsx';

// 质量评级选项 - 用于表格字典渲染、表单下拉选择、搜索筛选
const qualityOptions = reactive([
	{ label: 'S级', value: 'S', type: 'danger' },
	{ label: 'A级', value: 'A', type: 'warning' },
	{ label: 'B级', value: 'B', type: 'success' },
	{ label: 'C级', value: 'C', type: 'info' }
]);

// 是否已看选项 - 用于表格字典渲染、搜索筛选
const watchedOptions = reactive([
	{ label: '已看', value: true, type: 'success' },
	{ label: '未看', value: false, type: 'info' }
]);

// 分类选项 - 从接口获取
const categoryOptions = ref<any[]>([]);

// API: service.knowledge.film - 电影服务（由 EPS 自动生成，对应后端 /admin/knowledge/film）
// API: service.knowledge.filmCategory - 电影分类服务（对应后端 /admin/knowledge/film-category）

function parsePosters(posters: any): { src: string; previewList: string[] } {
	if (Array.isArray(posters) && posters.length > 0) {
		return { src: posters[0], previewList: posters };
	}

	if (typeof posters === 'string' && posters) {
		try {
			const parsed = JSON.parse(posters);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return { src: parsed[0], previewList: parsed };
			}
			if (parsed) {
				return { src: parsed, previewList: [parsed] };
			}
		} catch (e) {
			return { src: posters, previewList: [posters] };
		}
	}

	return { src: '', previewList: [] };
}

// cl-crud 配置
const Crud = useCrud({ service: service.knowledge.film }, app => {
	// 加载分类数据
	loadCategoryOptions();
	// 首次加载时刷新数据
	app.refresh();
});

// API: POST /admin/knowledge/film/import - 批量导入电影数据

/**
 * 导入提交处理
 * @param data 导入数据，包含 list（解析后的 Excel 数据数组）和 file（原始文件）
 */
async function onImportSubmit(data: { list: any[]; file: File }, { done, close }: any) {
	if (!data.list || data.list.length === 0) {
		ElMessage.warning('导入数据为空');
		done();
		return;
	}

	try {
		const res = await service.knowledge.film.import(data.list);
		close();
		if (res.success > 0) {
			ElMessage.success(`导入完成：成功 ${res.success} 条，失败 ${res.fail} 条`);
			// 刷新列表
			Crud.value?.refresh();
		} else {
			ElMessage.error('导入失败，请检查数据格式');
		}
	} catch (e: any) {
		ElMessage.error(e.message || '导入失败');
		done();
	}
}

// 加载分类选项
function loadCategoryOptions() {
	service.knowledge.filmCategory.list().then((res: any) => {
		categoryOptions.value = res.map((item: any) => ({
			label: item.name,
			value: item.id
		}));
	});
}

// cl-table 配置 - 表格列定义
const Table = useTable({
	columns: [
		{
			// 多选框列
			type: 'selection',
			width: 60
		},
		{
			// 海报 - 显示第一张缩略图
			// 使用 render 函数而非 component，因为 component 的 props 函数会被缓存（只调用一次）
			// render 函数每一行都会调用，可以拿到每行的 row 数据
			label: '海报',
			prop: 'posters',
			width: 90,
			render(row: any, column: any, value: any, index: number) {
				const { src } = parsePosters(row?.posters ?? value);
				if (!src) {
					return null;
				}
				return h('img', {
					src,
					style: {
						width: '60px',
						height: '80px',
						borderRadius: '4px',
						objectFit: 'cover',
						cursor: 'pointer',
						display: 'block'
					},
					alt: '海报',
					onClick: () => {
						window.open(src, '_blank');
					}
				});
			}
		},
		{
			// 名称
			label: '名称',
			prop: 'name',
			minWidth: 200,
			showOverflowTooltip: true
		},
		{
			// 导演
			label: '导演',
			prop: 'director',
			minWidth: 120,
			showOverflowTooltip: true
		},
		{
			// 年份
			label: '年份',
			prop: 'year',
			width: 90
		},
		{
			// 分类 - 显示分类名称
			label: '分类',
			prop: 'categoryId',
			width: 120,
			dict: categoryOptions
		},
		{
			// 质量评级 - 显示标签样式
			label: '质量评级',
			prop: 'quality',
			width: 100,
			dict: qualityOptions,
			dictColor: true
		},
		{
			// 豆瓣评分
			label: '豆瓣评分',
			prop: 'doubanRating',
			width: 100
		},
		{
			// 是否已看 - 显示标签样式
			label: '是否已看',
			prop: 'watched',
			width: 100,
			dict: watchedOptions,
			dictColor: true
		},
		{
			// 创建时间
			label: '创建时间',
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc'
		},
		{
			// 操作列 - 详情、编辑、删除
			type: 'op',
			width: 280,
			buttons: [
				{
					label: '详情',
					type: 'primary',
					onClick({ scope }: any) {
						// 跳转到详情页
						router.push(`/knowledge/film/${scope.row.id}`);
					}
				},
				'edit',
				'delete'
			]
		}
	]
});

// 导出列 - 包含表格列 + 额外字段（不在表格展示，导出时可选）
const exportColumns = computed(() => {
	const cols: any[] = Table.value?.columns ? [...Table.value.columns] : [];
	const base = cols.filter((e: any) => !['selection', 'expand', 'index', 'op'].includes(e.type));

	// 为 posters 列添加 formatter（导出时 render 不会被调用，需要 formatter 将数组转为文本）
	const postersCol = base.find((e: any) => e.prop === 'posters');
	if (postersCol) {
		postersCol.formatter = (_row: any, _col: any, value: any) => {
			if (Array.isArray(value)) {
				return value.join(', ');
			}
			if (typeof value === 'string') {
				try {
					const parsed = JSON.parse(value);
					return Array.isArray(parsed) ? parsed.join(', ') : value;
				} catch {
					return value;
				}
			}
			return String(value || '');
		};
	}

	base.push(
		{ label: '国家', prop: 'country', width: 100 },
		{ label: '语言', prop: 'language', width: 100 },
		{ label: '主要人物', prop: 'mainCharacters', minWidth: 200 },
		{ label: '内容简介', prop: 'synopsis', minWidth: 300 },
		{ label: '背景故事', prop: 'backgroundStory', minWidth: 300 },
		{ label: '荣誉', prop: 'honors', minWidth: 200 },
		{ label: '亮点所在', prop: 'highlights', minWidth: 200 },
		{ label: '为什么值得一看', prop: 'whyWorthWatching', minWidth: 300 },
		{ label: '链接', prop: 'link', minWidth: 200 },
		{ label: 'TMDB评分', prop: 'tmdbRating', width: 100 },
		{ label: '更新时间', prop: 'updateTime', minWidth: 170 }
	);

	return base;
});

// cl-upsert 配置 - 新增/编辑表单
const Upsert = useUpsert({
	dialog: {
		width: '900px'
	},

	items: [
		// Tabs 分组配置
		{
			type: 'tabs',
			props: {
				labels: [
					{ label: '基础信息', value: 'base' },
					{ label: '海报上传', value: 'posters' },
					{ label: '评分信息', value: 'rating' },
					{ label: '详细信息', value: 'detail' }
				]
			}
		},

		// ========== 基础信息 ==========
		{
			group: 'base',
			label: '名称',
			prop: 'name',
			required: true,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入电影名称',
					maxlength: 200,
					showWordLimit: true
				}
			}
		},
		{
			group: 'base',
			label: '分类',
			prop: 'categoryId',
			required: true,
			component: {
				name: 'el-select',
				props: {
					placeholder: '请选择分类',
					clearable: true
				},
				options: categoryOptions
			}
		},
		{
			group: 'base',
			label: '导演',
			prop: 'director',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入导演姓名',
					maxlength: 100
				}
			}
		},
		{
			group: 'base',
			label: '年份',
			prop: 'year',
			span: 12,
			component: {
				name: 'el-input-number',
				props: {
					min: 1900,
					max: 2100,
					placeholder: '请输入年份'
				}
			}
		},
		{
			group: 'base',
			label: '国家',
			prop: 'country',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入国家/地区',
					maxlength: 50
				}
			}
		},
		{
			group: 'base',
			label: '语言',
			prop: 'language',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入语言',
					maxlength: 50
				}
			}
		},
		{
			group: 'base',
			label: '质量评级',
			prop: 'quality',
			span: 12,
			component: {
				name: 'el-select',
				props: {
					placeholder: '请选择质量评级',
					clearable: true
				},
				options: qualityOptions
			}
		},
		{
			group: 'base',
			label: '是否已看',
			prop: 'watched',
			span: 12,
			value: false,
			component: {
				name: 'el-switch',
				props: {
					activeText: '已看',
					inactiveText: '未看'
				}
			}
		},

		// ========== 海报上传 ==========
		{
			group: 'posters',
			label: '海报',
			prop: 'posters',
			value: [],
			component: {
				name: 'film-poster-edit',
				props: {
					limit: 10
				}
			}
		},

		// ========== 评分信息 ==========
		{
			group: 'rating',
			label: '豆瓣评分',
			prop: 'doubanRating',
			span: 12,
			component: {
				name: 'el-input-number',
				props: {
					min: 0,
					max: 10,
					step: 0.1,
					precision: 1,
					placeholder: '0-10分'
				}
			}
		},
		{
			group: 'rating',
			label: 'TMDB评分',
			prop: 'tmdbRating',
			span: 12,
			component: {
				name: 'el-input-number',
				props: {
					min: 0,
					max: 10,
					step: 0.1,
					precision: 1,
					placeholder: '0-10分'
				}
			}
		},

		// ========== 详细信息 ==========
		{
			group: 'detail',
			label: '主要人物',
			prop: 'mainCharacters',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 3,
					placeholder: '请输入主要人物信息',
					maxlength: 500,
					showWordLimit: true
				}
			}
		},
		{
			group: 'detail',
			label: '内容简介',
			prop: 'synopsis',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 6,
					placeholder: '请输入内容简介',
					maxlength: 2000,
					showWordLimit: true
				}
			}
		},
		{
			group: 'detail',
			label: '背景故事',
			prop: 'backgroundStory',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 6,
					placeholder: '请输入背景故事',
					maxlength: 2000,
					showWordLimit: true
				}
			}
		},
		{
			group: 'detail',
			label: '荣誉',
			prop: 'honors',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 4,
					placeholder: '请输入获奖荣誉信息',
					maxlength: 1000,
					showWordLimit: true
				}
			}
		},
		{
			group: 'detail',
			label: '亮点所在',
			prop: 'highlights',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 4,
					placeholder: '请输入影片亮点',
					maxlength: 1000,
					showWordLimit: true
				}
			}
		},
		{
			group: 'detail',
			label: '为什么值得一看',
			prop: 'whyWorthWatching',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 6,
					placeholder: '请输入推荐理由',
					maxlength: 2000,
					showWordLimit: true
				}
			}
		},
		{
			group: 'detail',
			label: '链接',
			prop: 'link',
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入相关链接',
					maxlength: 500
				}
			}
		}
	],

	onOpen() {
		// 打开弹窗时确保分类选项已加载
		if (categoryOptions.value.length === 0) {
			loadCategoryOptions();
		}
	}
});
</script>