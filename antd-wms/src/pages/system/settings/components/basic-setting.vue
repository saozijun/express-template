<script setup>
import { UploadOutlined, UserOutlined } from "@ant-design/icons-vue";
import { useUserStore } from "~@/stores/user";
import { message } from "ant-design-vue";
import { updateInfo, uploadAvatar } from '~/api/user'
import { ref, computed, onMounted } from 'vue';
import { useAuthorization } from '~/composables/authorization'
const userStore = useUserStore();
const formRef = ref();
const labelCol = { span: 0 };
const wrapperCol = { span: 13 };
const baseUrl = import.meta.env.VITE_APP_BASE_URL;
const formState = computed(() => userStore.userInfo);
const avatar = computed(() => userStore.avatar);
const uploadLoading = ref(false);
const token = computed(() => useAuthorization().value);


const rules = computed(() => {
  return {
    nickname: [{ required: true, message: "请输入昵称", trigger: "change" }],
  };
});

const onSubmit = async () => {
  try {
    await formRef.value.validate();
    await updateInfo(formState.value);
    await userStore.updateUserInfo(formState.value);
    message.success("修改成功");
  } catch (error) {
    console.error(error);
    message.error("修改失败");
  }
}

const handleChange = (info) => {
  if (info.file.status === 'uploading') {
    uploadLoading.value = true;
    return;
  }
  if (info.file.status === "done") {
    uploadLoading.value = false;
    if (info.file.response && info.file.response.code === 200) {
      message.success(`上传成功`);
      // 获取头像URL
      const avatarUrl = info.file.response.data?.avatar;
      console.log('上传响应:', info.file.response);
      if (avatarUrl) {
        userStore.updateAvatar(avatarUrl);
      } else {
        console.error('上传响应中没有头像URL', info.file.response);
        message.error('上传成功但未获取到头像URL');
      }
    } else {
      message.error(info.file.response?.message || '上传失败');
    }
  } else if (info.file.status === "error") {
    uploadLoading.value = false;
    message.error(`上传失败: ${info.file.error?.message || '未知错误'}`);
  }
};

// 计算请求头
const headers = computed(() => {
  return {
    Authorization: token.value ? `Bearer ${token.value}` : ''
  };
});
</script>

<template>
  <a-card title="基本设置" :bordered="false">
    <a-row>
      <a-col :span="12">
        <a-form
          ref="formRef"
          :model="formState"
          :rules="rules"
          :label-col="labelCol"
          :wrapper-col="wrapperCol"
        >
          <a-form-item :label-col="{ span: 24 }" label="昵称" name="nickname">
            <a-input
              v-model:value="formState.nickname"
              placeholder="请输入"
              style="width: 320px"
            />
          </a-form-item>
          <a-form-item :label-col="{ span: 24 }" label="邮箱" name="email">
            <a-input
              v-model:value="formState.email"
              placeholder="请输入"
              style="width: 320px"
            />
          </a-form-item>

          <a-form-item>
            <a-button type="primary" @click="onSubmit"> 提交 </a-button>
          </a-form-item>
        </a-form>
      </a-col>
      <a-col :span="4">
        <p>头像</p>
        <div class="flex flex-col items-center">
          <a-avatar :size="100">
            <template #icon>
              <img v-if="avatar" :src="avatar" alt="用户头像" />
              <UserOutlined v-else />
            </template>
          </a-avatar>
          
          <a-upload
            name="file"
            :action="`${baseUrl}/user/upload/avatar`"
            :data="{ id: formState.id }"
            :headers="headers"
            :show-upload-list="false"
            @change="handleChange"
          >
            <a-button class="mt-4" :loading="uploadLoading">
              <template #icon><UploadOutlined /></template>
              上传头像
            </a-button>
          </a-upload>
        </div>
      </a-col>
    </a-row>
  </a-card>
</template>
