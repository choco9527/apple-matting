<template>
  <el-config-provider :locale="locale">
    <MainLayout />
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/views/layouts/MainLayout.vue'

const { messages, locale: currentLocale } = useI18n()
const locale = computed(() => messages.value[currentLocale.value])
</script>
