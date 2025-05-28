<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useUserStore } from "~@/stores/user";
import { changePassword } from '~/api/user';

interface DataItem {
  title: string
  desc: string
}

const userStore = useUserStore();
const visible = ref(false);
const confirmLoading = ref(false);

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const rules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule:any, value:any) => {
        if (value !== formState.newPassword) {
          return Promise.reject('两次输入的密码不一致');
        }
        return Promise.resolve();
      },
      trigger: 'blur'
    }
  ]
};

const formRef = ref();

const data = computed<DataItem[]>(() => {
  return [
    {
      title: "账户密码",
      desc: "当前密码强度: 强",
    }
  ]
});

const showModal = () => {
  visible.value = true;
  // 重置表单
  formState.oldPassword = '';
  formState.newPassword = '';
  formState.confirmPassword = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const handleOk = async () => {
  try {
    await formRef.value.validate();
    confirmLoading.value = true;
    
    const userId = userStore.userInfo.id;
    const params = {
      id: userId,
      oldPassword: formState.oldPassword,
      newPassword: formState.newPassword
    };
    
    const res = await changePassword(params);
    if (res.code === 200) {
      message.success('密码修改成功');
      visible.value = false;
    } else {
      message.error(res.msg || '密码修改失败');
    }
  } catch (error:any) {
    console.error('修改密码出错:', error);
    message.error(error.response?.data?.msg || '表单验证失败');
  } finally {
    confirmLoading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};
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
            <a-button type="link" @click="showModal">
              修改
            </a-button>
          </template>
        </a-list-item>
      </template>
    </a-list>
    
    <a-modal
      v-model:visible="visible"
      title="修改密码"
      :confirm-loading="confirmLoading"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="当前密码" name="oldPassword">
          <a-input-password v-model:value="formState.oldPassword" placeholder="请输入当前密码" />
        </a-form-item>
        <a-form-item label="新密码" name="newPassword">
          <a-input-password v-model:value="formState.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认新密码" name="confirmPassword">
          <a-input-password v-model:value="formState.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<style scoped lang="less">
:deep(.ant-card-body) {
  padding-left: 0 !important;
}
</style>
