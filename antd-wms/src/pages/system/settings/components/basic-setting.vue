<script setup>
import { UploadOutlined } from "@ant-design/icons-vue";
import { useUserStore } from "~@/stores/user";
import { message } from "ant-design-vue";
import { updateInfo } from '~/api/user'
const userStore = useUserStore();
const formRef = ref();
const labelCol = { span: 0 };
const wrapperCol = { span: 13 };
const baseUrl = import.meta.env.VITE_APP_BASE_URL;
const formState =computed(() => userStore.userInfo);
const avatar = computed(() => userStore.avatar);
const rules = computed(() => {
  return {
    nickname: [{ required: true, message: "请输入昵称", trigger: "change" }],
  };
});

const onSubmit = async ()=> {
  await formRef.value.validate()
  await updateInfo(formState.value);
  message.success("修改成功")
}

const handleChange = (info) => {
  if (info.file.status === "done") {
    message.success(`上传成功`);
    userStore.updateAvatar(info.file.response);
  } else if (info.file.status === "error") {
    message.error(`上传失败`);
  }
};
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
              <img :src="avatar" alt="" />
            </template>
          </a-avatar>
          <a-upload
            name="file"
            :action="baseUrl + '/file/upload'"
            :show-upload-list="false"
            @change="handleChange"
          >
            <a-button class="mt-4">
              <UploadOutlined />
              上传头像
            </a-button>
          </a-upload>
        </div>
      </a-col>
    </a-row>
  </a-card>
</template>
