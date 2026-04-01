<template>
  <div class="nav-container">
    <!-- Menu Section -->
    <el-menu :default-active="activeMenu" class="el-menu-vertical" :class="{ 'el-menu-vertical-collapse': isCollapse }"
      :collapse="isCollapse">
      <!-- AI抠图 -->
      <el-menu-item index="/matting/single" @click="$router.push('/matting/single')">
        <el-icon>
          <Picture />
        </el-icon>
        <template #title>{{ $t('sidebar.menu.single') }}</template>
      </el-menu-item>
      <el-menu-item index="/matting/batch" @click="$router.push('/matting/batch')">
        <el-icon>
          <Files />
        </el-icon>
        <template #title>{{ $t('sidebar.menu.batch') }}</template>
      </el-menu-item>
    </el-menu>

    <!-- Collapse Button Section -->
    <div class="collapse-container">
      <el-button type="primary" link @click="$emit('toggle')" class="collapse-btn">
        <el-icon :size="20">
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

defineProps({
  isCollapse: {
    type: Boolean,
    required: true
  }
})

defineEmits(['toggle'])

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped lang="scss">
.nav-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--layout-bg);
  box-shadow: var(--layout-shadow);
  border-radius: 0 4px 4px 0;
  transition: width 0.3s;
}

// Menu styles
.el-menu-vertical {
  border-right: none;
  flex: 1;
  background: transparent;
  width: 100%;
  overflow-y: auto;

  &-collapse {
    padding: 0 10px;
  }
}

// Menu items
:deep(.el-menu-item) {
  height: 45px;
  line-height: 45px;
  padding: 0 10px !important;
  border-radius: 4px;
  transition: all 0.3s ease;

  .el-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &:hover {
    background-color: var(--sidebar-hover) !important;
  }

  &.is-active {
    font-weight: 500;
    color: #27ba9b;
  }
}

// Collapsed menu styles
:deep(.el-menu--collapse) {
  width: 100%;

  .el-menu-item {
    width: 100%;
  }
}

// Collapse button
.collapse-container {
  padding: 5px 0;
}

.collapse-btn {
  width: 100%;
  display: flex;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    background-color: var(--sidebar-hover);
  }
}
</style>