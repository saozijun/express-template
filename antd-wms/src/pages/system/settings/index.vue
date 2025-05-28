<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import basicSetting from './components/basic-setting.vue'
import securitySetting from './components/security-setting.vue'
import { useUserStore } from "~@/stores/user";

const userStore = useUserStore();
const selectedKeys = ref(['1']);
const isLoading = ref(true);

// 确保用户信息已加载
onMounted(async () => {
  try {
    // 如果用户信息为空，可以在这里添加加载用户信息的逻辑
    if (!userStore.userInfo || Object.keys(userStore.userInfo).length === 0) {
      console.log('用户信息未加载，请确保登录状态');
    }
  } finally {
    isLoading.value = false;
  }
});

const items = computed(() => {
  return [
    {
      key: '1',
      label: "基本设置",
      title: 'Navigation One',
    },
    {
      key: '2',
      label: "安全设置",
      title: 'Navigation Two',
    }
  ]
})
</script>

<template>
  <div class="box">
    <a-card v-if="!isLoading">
      <a-row :gutter="24">
        <a-col :span="4" style="padding-left: 0;">
          <a-menu
            v-model:selected-keys="selectedKeys"
            style="width: 250px"
            mode="inline"
            :items="items"
          />
        </a-col>
        <a-col :span="20">
          <keep-alive>
            <component :is="selectedKeys[0] === '1' ? basicSetting : securitySetting" />
          </keep-alive>
        </a-col>
      </a-row>
    </a-card>
    <a-spin v-else />
  </div>
</template>

<style scoped lang="less">
.box{
  height: calc(100vh - 170px);
}
</style>
