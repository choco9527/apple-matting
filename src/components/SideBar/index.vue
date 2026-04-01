<template>
  <el-aside :width="isCollapse ? '80px' : '180px'" class="aside">
    <NavMenu :is-collapse="isCollapse" @toggle="toggleCollapse" />
  </el-aside>
</template>

<script setup>
import { ref } from 'vue'
import NavMenu from './NavMenu.vue'

const isCollapse = ref(false)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.aside {
  height: 100%;
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s;
}
</style>