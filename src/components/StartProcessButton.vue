<template>
  <el-button 
    v-bind="$attrs"
    :type="type" 
    :size="size" 
    class="start-process-button"
    @click="handleStartProcess"
  >
    <el-icon class="start-process-icon"><VideoPlay /></el-icon>
    {{ text }}
  </el-button>
</template>

<script setup>
import { VideoPlay } from '@element-plus/icons-vue'

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
    default: 'default'
  }
})

const emit = defineEmits(['startProcess'])

const handleStartProcess = () => {
  emit('startProcess')
}
</script>

<style scoped>
.start-process-button {
  padding: 5px 10px;
  font-size: 16px;
}


.start-process-icon {
  margin-right: 8px;
}
</style> 