<template>
	<div class="film-poster-edit">
		<!-- 已有海报列表 -->
		<div v-if="posters.length > 0" class="poster-list">
			<div v-for="(url, index) in posters" :key="url + index" class="poster-item">
				<el-image
					class="poster-img"
					:src="url"
					fit="cover"
					:preview-src-list="posters"
					:initial-index="index"
					@error="onImgError($event, index)"
				>
					<template #error>
						<div class="poster-error">
							<el-icon><PictureFilled /></el-icon>
							<span>加载失败</span>
						</div>
					</template>
				</el-image>
				<div class="poster-actions">
					<el-button
						type="primary"
						size="small"
						link
						@click="editPoster(index)"
					>
						<el-icon><Edit /></el-icon>
					</el-button>
					<el-button
						type="danger"
						size="small"
						link
						@click="removePoster(index)"
					>
						<el-icon><Delete /></el-icon>
					</el-button>
				</div>
			</div>
		</div>

		<!-- 添加按钮 -->
		<div class="poster-add" @click="showAddDialog">
			<el-icon><Plus /></el-icon>
			<span>添加海报</span>
		</div>

		<!-- 添加/编辑对话框 -->
		<el-dialog
			v-model="dialogVisible"
			:title="editingIndex === -1 ? '添加海报' : '编辑海报'"
			width="500px"
			destroy-on-close
		>
			<el-form label-width="80px">
				<el-form-item label="选择方式">
					<el-radio-group v-model="addMode">
						<el-radio label="url">输入链接</el-radio>
						<el-radio label="file">本地上传</el-radio>
					</el-radio-group>
				</el-form-item>

				<!-- 链接输入 -->
				<template v-if="addMode === 'url'">
					<el-form-item label="海报链接">
						<el-input
							v-model="inputUrl"
							placeholder="https://image.tmdb.org/t/p/original/xxx.jpg"
							clearable
						/>
					</el-form-item>
					<!-- 预览 -->
					<el-form-item v-if="inputUrl" label="预览">
						<div class="poster-preview">
							<img
								:src="inputUrl"
								alt="预览"
								@error="inputUrlError = true"
								@load="inputUrlError = false"
							/>
							<span v-if="inputUrlError" class="preview-error">链接无效或无法加载</span>
						</div>
					</el-form-item>
				</template>

				<!-- 本地上传 -->
				<template v-else>
					<el-form-item label="选择文件">
						<el-upload
							ref="uploadRef"
							action=""
							:auto-upload="false"
							:show-file-list="false"
							:accept="accept"
							:on-change="onFileChange"
						>
							<el-button type="primary">选择图片</el-button>
							</el-upload>
					</el-form-item>
					<el-form-item v-if="localFile" label="预览">
						<img :src="localFilePreview" alt="预览" class="poster-preview" />
					</el-form-item>
				</template>
			</el-form>

			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" :disabled="!canSubmit" @click="confirmAdd">
					确定
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'film-poster-edit'
});

import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete, Edit, PictureFilled } from '@element-plus/icons-vue';
import { useUpload } from '/@/plugins/upload';

const props = defineProps({
	// 绑定值：海报URL数组
	modelValue: {
		type: Array as () => string[],
		default: () => []
	},
	// 最大数量
	limit: {
		type: Number,
		default: 10
	},
	// 是否禁用
	disabled: Boolean
});

const emit = defineEmits(['update:modelValue']);

// 海报列表
const posters = ref<string[]>([...(props.modelValue || [])]);

// 监听外部值变化
watch(
	() => props.modelValue,
	(val) => {
		posters.value = [...(val || [])];
	},
	{ immediate: true, deep: true }
);

// 对话框
const dialogVisible = ref(false);
const addMode = ref<'url' | 'file'>('url');
const inputUrl = ref('');
const inputUrlError = ref(false);
const editingIndex = ref(-1);
const localFile = ref<File | null>(null);
const localFilePreview = ref('');

// 上传相关
const uploadRef = ref();
const accept = 'image/*';
const { toUpload } = useUpload();

// 能否添加
const canAdd = computed(() => posters.value.length < props.limit);

// 能否提交
const canSubmit = computed(() => {
	if (addMode.value === 'url') {
		return inputUrl.value.trim().length > 0 && !inputUrlError.value;
	} else {
		return localFile.value !== null;
	}
});

// 显示添加对话框
function showAddDialog() {
	if (!canAdd.value) {
		ElMessage.warning(`最多只能添加 ${props.limit} 张海报`);
		return;
	}
	editingIndex.value = -1;
	inputUrl.value = '';
	inputUrlError.value = false;
	localFile.value = null;
	localFilePreview.value = '';
	addMode.value = 'url';
	dialogVisible.value = true;
}

// 编辑海报
function editPoster(index: number) {
	editingIndex.value = index;
	inputUrl.value = posters.value[index];
	inputUrlError.value = false;
	localFile.value = null;
	localFilePreview.value = '';
	addMode.value = 'url';
	dialogVisible.value = true;
}

// 删除海报
function removePoster(index: number) {
	posters.value.splice(index, 1);
	updateValue();
}

// 文件选择
function onFileChange(file: any) {
	localFile.value = file.raw;
	localFilePreview.value = URL.createObjectURL(file.raw);
}

// 确认添加/编辑
async function confirmAdd() {
	if (addMode.value === 'url') {
		const url = inputUrl.value.trim();
		if (editingIndex.value === -1) {
			posters.value.push(url);
		} else {
			posters.value[editingIndex.value] = url;
		}
	} else {
		if (localFile.value) {
			ElMessage.info('正在上传...');
			const { url } = await toUpload(localFile.value);
			if (editingIndex.value === -1) {
				posters.value.push(url);
			} else {
				posters.value[editingIndex.value] = url;
			}
		}
	}

	updateValue();
	dialogVisible.value = false;
}

// 更新绑定值
function updateValue() {
	emit('update:modelValue', [...posters.value]);
}

// 图片加载失败
function onImgError(e: Event, index: number) {
	// el-image 内部处理，这里不干预
}

// 暴露方法
defineExpose({
	list: posters
});
</script>

<style lang="scss" scoped>
.film-poster-edit {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: flex-start;
}

.poster-list {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.poster-item {
	width: 100px;
	height: 140px;
	border-radius: 8px;
	overflow: hidden;
	border: 1px solid var(--el-border-color-light);
	position: relative;
	background: var(--el-fill-color-light);
	transition: all 0.2s;

	&:hover {
		border-color: var(--el-color-primary);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
}

.poster-img {
	width: 100%;
	height: 115px;

	:deep(.el-image__inner) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.poster-error {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: var(--el-text-color-placeholder);
	font-size: 12px;
	gap: 4px;

	.el-icon {
		font-size: 32px;
	}
}

.poster-actions {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 24px;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.2s;

	.poster-item:hover & {
		opacity: 1;
	}

	:deep(.el-button) {
		color: #fff;
		padding: 0 4px;
		min-height: auto;
	}
}

.poster-add {
	width: 100px;
	height: 140px;
	border: 1px dashed var(--el-border-color);
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	cursor: pointer;
	color: var(--el-text-color-placeholder);
	font-size: 13px;
	transition: all 0.2s;

	&:hover {
		border-color: var(--el-color-primary);
		color: var(--el-color-primary);
		background: var(--el-fill-color-lighter);
	}

	.el-icon {
		font-size: 28px;
	}
}

.poster-preview {
	width: 200px;
	height: 150px;
	border-radius: 6px;
	overflow: hidden;
	border: 1px solid var(--el-border-color-light);

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: var(--el-fill-color-lighter);
	}
}

.preview-error {
	display: block;
	color: var(--el-color-danger);
	font-size: 12px;
	margin-top: 4px;
}
</style>
