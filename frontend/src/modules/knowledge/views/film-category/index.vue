<template>
	<!-- 电影分类管理页面 - CRUD 列表页 -->
	<cl-crud ref="Crud">
		<cl-row>
			<!-- 刷新按钮 -->
			<cl-refresh-btn />
			<!-- 新增按钮 - 手动实现 -->
			<el-button type="success" @click="handleAdd">
				<el-icon><Plus /></el-icon>
				新增
			</el-button>
			<!-- 批量删除按钮 - 手动实现 -->
			<el-button type="danger" :disabled="!Table?.selection?.length" @click="handleMultiDelete">
				<el-icon><Delete /></el-icon>
				删除
			</el-button>
			<cl-flex1 />
			<!-- 状态筛选 -->
			<cl-select
				:options="statusOptions"
				prop="status"
				:width="120"
				placeholder="状态筛选"
				clearable
			/>
			<!-- 关键字搜索（按名称） -->
			<cl-search-key placeholder="搜索名称" />
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
	name: 'film-category'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { reactive, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';

const { service } = useCool();

// 状态选项配置 - 用于表格字典渲染、表单下拉选择、搜索筛选
const statusOptions = reactive([
	{
		label: '启用',
		value: 1,
		type: 'success'
	},
	{
		label: '禁用',
		value: 0,
		type: 'danger'
	}
]);

// API: service.knowledge.filmCategory - 电影分类服务（由 EPS 自动生成）
// 对应后端路由 /admin/knowledge/film-category

// cl-crud 配置
const Crud = useCrud({ service: service.knowledge.filmCategory }, app => {
	// 首次加载时刷新数据
	app.refresh();
});

// cl-table 配置 - 表格列定义
const Table = useTable({
	columns: [
		{
			// 多选框列
			type: 'selection',
			width: 60
		},
		{
			// 名称
			label: '名称',
			prop: 'name',
			minWidth: 180
		},
		{
			// 排序
			label: '排序',
			prop: 'sort',
			width: 100,
			sortable: 'custom'
		},
		{
			// 状态 - 使用字典渲染为标签样式
			label: '状态',
			prop: 'status',
			width: 100,
			dict: statusOptions,
			dictColor: true
		},
		{
			// 备注
			label: '备注',
			prop: 'remark',
			minWidth: 200,
			showOverflowTooltip: true
		},
		{
			// 创建时间
			label: '创建时间',
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc'
		},
		{
			// 操作列 - 编辑、删除按钮（自定义配置确保渲染）
			type: 'op',
			width: 180,
			buttons: [
				{
					label: '编辑',
					type: 'primary',
					onClick({ scope }: any) {
						Upsert.value?.edit(scope.row);
					}
				},
				{
					label: '删除',
					type: 'danger',
					onClick({ scope }: any) {
						ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
							type: 'warning'
						}).then(() => {
							service.knowledge.filmCategory.delete({ ids: [scope.row.id] }).then(() => {
								ElMessage.success('删除成功');
								Crud.value?.refresh();
							});
						}).catch(() => {});
					}
				}
			]
		}
	]
});

// cl-upsert 配置 - 新增/编辑表单
const Upsert = useUpsert({
	dialog: {
		width: '600px'
	},

	items: [
		{
			// 名称 - 必填，文本输入
			label: '名称',
			prop: 'name',
			required: true,
			component: {
				name: 'el-input',
				props: {
					placeholder: '请输入分类名称',
					maxlength: 50,
					showWordLimit: true
				}
			}
		},
		{
			// 排序 - 数字输入，默认0
			label: '排序',
			prop: 'sort',
			value: 0,
			component: {
				name: 'el-input-number',
				props: {
					min: 0,
					max: 9999
				}
			}
		},
		{
			// 状态 - 下拉选择，默认1（启用）
			label: '状态',
			prop: 'status',
			value: 1,
			required: true,
			component: {
				name: 'el-select',
				props: {
					placeholder: '请选择状态'
				},
				options: statusOptions
			}
		},
		{
			// 备注 - 文本域
			label: '备注',
			prop: 'remark',
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 4,
					placeholder: '请输入备注信息',
					maxlength: 200,
					showWordLimit: true
				}
			}
		}
	]
});

// 新增分类 - 打开空表单弹窗
function handleAdd() {
	Upsert.value?.add();
}

// 批量删除分类
function handleMultiDelete() {
	const ids = Table.value?.selection?.map((row: any) => row.id) || [];
	if (!ids.length) {
		ElMessage.warning('请先选择要删除的分类');
		return;
	}
	ElMessageBox.confirm(`确定要删除选中的 ${ids.length} 个分类吗？`, '提示', {
		type: 'warning'
	}).then(() => {
		service.knowledge.filmCategory.delete({ ids }).then(() => {
			ElMessage.success('删除成功');
			Crud.value?.refresh();
		}).catch((err: any) => {
			ElMessage.error('删除失败：' + (err.message || '未知错误'));
		});
	}).catch(() => {});
}
</script>

<style scoped>
/* 操作列按钮横向排列 */
:deep(.cl-table__op) {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8px;
	flex-wrap: nowrap;
}
</style>
