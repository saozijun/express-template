<script setup lang="ts">
interface DataItem {
  title: string
  desc: string
}

const data = computed<DataItem[]>(() => {
  return [
    {
      title: "账户密码",
      desc:  "当前密码强度: 强",
    }
  ]
})
</script>

<template>
  <a-card title="安全设置" :bordered="false">
    <a-list item-layout="horizontal" :data-source="data">
      <template #renderItem="{ item }">
        <a-list-item>
          <a-list-item-meta
            :description="item.desc"
          >
            <template #title>
              <p>{{ item.title }}</p>
            </template>
          </a-list-item-meta>
          <template #actions>
            <!-- <a-button type="link">
              修改
            </a-button> -->
          </template>
        </a-list-item>
      </template>
    </a-list>
  </a-card>
</template>

<style scoped lang="less">
:deep(.ant-card-body) {
  padding-left: 0 !important;
}
</style>
