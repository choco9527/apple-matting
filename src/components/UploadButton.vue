<template>
  <el-button 
    v-bind="$attrs"
    :type="type" 
    :size="size" 
    class="upload-button"
    @click="handleUpload"
  >
    <el-icon class="upload-icon"><upload-filled /></el-icon>
    {{ text }}
  </el-button>
</template>

<script setup>
import { UploadFilled } from '@element-plus/icons-vue'

defineProps({
  /**
   * 按钮显示的文本
   */
  text: {
    type: String,
    default: '上传文件'
  },
  /**
   * 按钮类型，继承自 el-button 的 type
   */
  type: {
    type: String,
    default: 'primary'
  },
  /**
   * 按钮大小，继承自 el-button 的 size
   */
  size: {
    type: String,
    default: 'large'
  }
})

const emit = defineEmits(['upload'])

const handleUpload = () => {
  emit('upload')
}
</script>

<style scoped>
.upload-button {
  padding: 5px 10px;
  font-size: 16px;
}

.upload-icon {
  margin-right: 8px;
}
</style> 