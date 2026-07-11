<template>
	<!-- 书籍管理页面 - CRUD 列表页 -->
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 新增按钮 -->
			<cl-add-btn />
			<!-- 批量删除按钮 -->
			<cl-multi-delete-btn />
			<!-- 批量修改分类 -->
			<el-button
				type="warning"
				:disabled="!Table?.selection?.length"
				@click="handleBatchUpdateCategory"
			>
				批量修改分类
			</el-button>
			<cl-flex1 />
			<!-- 导入按钮 -->
			<cl-import-btn
				:template="importTemplateUrl"
				:on-submit="onImportSubmit"
				tips="请按照模板填写书籍信息，名称为必填项"
			/>
			<!-- 导出按钮 -->
			<cl-export-btn :columns="exportColumns" filename="书籍列表" />
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
			<!-- 优先级筛选 -->
			<cl-select
				:options="priorityOptions"
				prop="priority"
				:width="120"
				placeholder="优先级筛选"
				clearable
			/>
			<!-- 关键字搜索（按名称、作者） -->
			<cl-search-key placeholder="搜索名称、作者" />
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

		<!-- 批量修改分类弹窗 -->
		<el-dialog v-model="batchCategoryVisible" title="批量修改分类" :width="400" @close="batchCategoryId = null">
			<el-form>
				<el-form-item label="目标分类" required>
					<el-select
						v-model="batchCategoryId"
						placeholder="请选择分类"
						clearable
						style="width: 100%"
					>
						<el-option
							v-for="item in categoryOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="batchCategoryVisible = false">取消</el-button>
				<el-button type="primary" :loading="batchLoading" @click="confirmBatchUpdateCategory">确认修改</el-button>
			</template>
		</el-dialog>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'book'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { computed, h, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import BookCoverEdit from '../../components/book-cover-edit.vue';

const { service } = useCool();
const router = useRouter();

// 导入模板文件路径
const importTemplateUrl = '/书籍导入模板.xlsx';

// 质量评级选项 - 用于表格字典渲染、表单下拉选择、搜索筛选
const qualityOptions = reactive([
	{ label: 'S级', value: 'S', type: 'danger' },
	{ label: 'A级', value: 'A', type: 'warning' },
	{ label: 'B级', value: 'B', type: 'success' },
	{ label: 'C级', value: 'C', type: 'info' }
]);

// 优先级选项 - 用于表格字典渲染、表单下拉选择、搜索筛选
const priorityOptions = reactive([
	{ label: 'P0', value: 'P0', type: 'danger' },
	{ label: 'P1', value: 'P1', type: 'warning' },
	{ label: 'P2', value: 'P2', type: 'info' }
]);

// 分类选项 - 从接口获取
const categoryOptions = ref<any[]>([]);

// 批量修改分类
const batchCategoryVisible = ref(false);
const batchCategoryId = ref<number | null>(null);
const batchLoading = ref(false);

// API: service.knowledge.book - 书籍服务（由 EPS 自动生成，对应后端 /admin/knowledge/book）

function parseCovers(covers: any): { src: string; previewList: string[] } {
	if (Array.isArray(covers) && covers.length > 0) {
		const first = covers[0];
		if (typeof first === 'string') {
			return { src: first, previewList: covers };
		}
		if (typeof first === 'object' && first?.url) {
			const list = covers.map((c: any) => (typeof c === 'object' && c?.url ? c.url : String(c)));
			return { src: first.url, previewList: list };
		}
	}

	if (typeof covers === 'string' && covers) {
		try {
			const parsed = JSON.parse(covers);
			return parseCovers(parsed);
		} catch (e) {
			return { src: covers, previewList: [covers] };
		}
	}

	return { src: '', previewList: [] };
}

// cl-crud 配置
const Crud = useCrud({ service: service.knowledge.book }, app => {
	// 加载分类数据
	loadCategoryOptions();
	// 首次加载时刷新数据
	app.refresh();
});

// 加载分类选项
function loadCategoryOptions() {
	service.knowledge.bookCategory.list().then((res: any) => {
		categoryOptions.value = res.map((item: any) => ({
			label: item.name,
			value: item.id
		}));
	});
}

// 批量修改分类 - 打开弹窗
function handleBatchUpdateCategory() {
	if (!Table.value?.selection?.length) {
		ElMessage.warning('请先选择要修改的书籍');
		return;
	}
	batchCategoryVisible.value = true;
}

// 批量修改分类 - 确认提交
async function confirmBatchUpdateCategory() {
	if (!batchCategoryId.value) {
		ElMessage.warning('请选择目标分类');
		return;
	}
	const ids = Table.value?.selection?.map((row: any) => row.id);
	if (!ids || ids.length === 0) {
		ElMessage.warning('请先选择要修改的书籍');
		return;
	}
	batchLoading.value = true;
	try {
		await service.knowledge.book.request({
			url: '/batchUpdateCategory',
			method: 'POST',
			data: {
				ids,
				categoryId: batchCategoryId.value
			}
		});
		ElMessage.success('批量修改分类成功');
		batchCategoryVisible.value = false;
		batchCategoryId.value = null;
		Crud.value?.refresh();
	} catch (e: any) {
		ElMessage.error(e.message || '修改失败');
	} finally {
		batchLoading.value = false;
	}
}

// API: POST /admin/knowledge/book/import - 批量导入书籍数据

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
		const res = await service.knowledge.book.import(data.list);
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

// cl-table 配置 - 表格列定义
const Table = useTable({
	columns: [
		{
			// 多选框列
			type: 'selection',
			width: 60
		},
		{
			// 封面 - 显示第一张缩略图
			// 使用 render 函数而非 component，因为 component 的 props 函数会被缓存（只调用一次）
			// render 函数每一行都会调用，可以拿到每行的 row 数据
			label: '封面',
			prop: 'cover',
			width: 90,
			render(row: any, column: any, value: any, index: number) {
				const { src } = parseCovers(row?.cover ?? value);
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
					alt: '封面',
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
			// 原名
			label: '原名',
			prop: 'originalName',
			minWidth: 150,
			showOverflowTooltip: true
		},
		{
			// 作者
			label: '作者',
			prop: 'author',
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
			// 国家
			label: '国家',
			prop: 'country',
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
			// 优先级 - 显示标签样式
			label: '优先级',
			prop: 'priority',
			width: 90,
			dict: priorityOptions,
			dictColor: true
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
						router.push(`/knowledge/book/${scope.row.id}`);
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

	// 为 cover 列添加 formatter（导出时 render 不会被调用，需要 formatter 将数组转为文本）
	const coverCol = base.find((e: any) => e.prop === 'cover');
	if (coverCol) {
		coverCol.formatter = (_row: any, _col: any, value: any) => {
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
		{ label: '内容简介', prop: 'synopsis', minWidth: 300 },
		{ label: '背景故事', prop: 'backgroundStory', minWidth: 300 },
		{ label: '标签', prop: 'tags', minWidth: 150 },
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
					{ label: '封面上传', value: 'cover' },
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
					placeholder: '请输入书籍名称',
					maxlength: 200,
					showWordLimit: true
				}
			}
		},
		{
			group: 'base',
			label: '原名',
			prop: 'originalName',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入原名',
					maxlength: 200
				}
			}
		},
		{
			group: 'base',
			label: '作者',
			prop: 'author',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入作者',
					maxlength: 200
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
			label: '标签',
			prop: 'tags',
			span: 24,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入标签，多个用逗号分隔',
					maxlength: 500
				}
			}
		},
		{
			group: 'base',
			label: '分类',
			prop: 'categoryId',
			span: 12,
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
			label: '优先级',
			prop: 'priority',
			span: 12,
			component: {
				name: 'el-select',
				props: {
					placeholder: '请选择优先级',
					clearable: true
				},
				options: priorityOptions
			}
		},

		// ========== 封面上传 ==========
		{
			group: 'cover',
			label: '封面',
			prop: 'cover',
			value: [],
			component: {
				name: 'book-cover-edit',
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

		// ========== 详细信息 ==========
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
		}
	],

	// 打开弹窗时确保分类选项已加载
	onOpen() {
		if (categoryOptions.value.length === 0) {
			loadCategoryOptions();
		}
	}
});
</script>
