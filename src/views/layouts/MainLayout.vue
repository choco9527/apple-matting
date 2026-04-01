<template>
  <el-container class="layout-container">
    <el-header class="header">
      <Header />
    </el-header>
    <el-container class="main-content-wrapper">
      <SideBar />
      <el-main class="main">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import SideBar from '@/components/SideBar/index.vue'
import Header from '@/components/Header/index.vue'
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 0;
  height: 60px;
  z-index: 10;
}

.main-content-wrapper {
  flex: 1;
  overflow: hidden;
}

.main {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}
</style>