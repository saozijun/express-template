<template>
  <a-modal
    v-model:open="visible"
    :title="modelRef.id ? '编辑' : '新增'"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    :afterClose="afterClose"
  >
    <a-form
      ref="formRef"
      :model="modelRef"
      :rules="rules"
      :label-col="{style:{width: '60px'}}"
    >
      <a-form-item label="昵称" name="nickname">
        <a-input v-model:value="modelRef.nickname" placeholder="请输入"/>
      </a-form-item>
      <a-form-item label="账号" name="username">
        <a-input v-model:value="modelRef.username" placeholder="请输入"/>
      </a-form-item>
      <a-form-item label="密码" name="password">
        <a-input-password v-model:value="modelRef.password" placeholder="请输入" :disabled="!!modelRef.id"/>
        <span v-if="modelRef.id" class="tip-text">编辑模式下不修改密码</span>
      </a-form-item>
      <a-form-item label="角色" name="roleId">
        <a-select v-model:value="modelRef.roleId" placeholder="请选择">
          <a-select-option v-for="(item) in roleList" :value="item.id" :key="item.id">{{item.name}}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="邮箱" name="email">
        <a-input v-model:value="modelRef.email" type="email" placeholder="请输入"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, computed } from "vue";
import { message } from 'ant-design-vue';
import { save, add } from '~/api/user'
import { zdList } from '~/api/role'

const formRef = ref();
const visible = ref(false);
const confirmLoading = ref(false);
const emits = defineEmits(["saveOk"]);
const roleList = ref([])

const modelRef = ref({
  nickname: "",
  username: "",
  password: "",
  email: "",
  role: "",
  roleId: ""
})

// 根据是否有ID决定密码验证规则
const passwordRule = computed(() => {
  return modelRef.value.id 
    ? [] // 编辑模式不验证密码
    : [{ required: true, message: '请输入密码', trigger: 'change' }]
})

const rules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'change' }],
  username: [{ required: true, message: '请输入账号', trigger: 'change' }],
  password: passwordRule,
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'change' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'change' }
  ],
};

const afterClose = () => {
  formRef.value?.resetFields();
};

const handleOk = async () => {
  try {
    await formRef.value.validate();
    confirmLoading.value = true;
    
    // 查找选中角色的标识
    const role = roleList.value.find(item => item.id == modelRef.value.roleId)
    if (role) {
      modelRef.value.role = role.flag
    }
    
    // 根据是否有ID判断是新增还是编辑
    if (modelRef.value.id) {
      // 编辑模式下如果密码为空，则从提交数据中删除
      const submitData = { ...modelRef.value }
      if (!submitData.password) {
        delete submitData.password
      }
      await save(submitData);
    } else {
      // 新增模式使用add接口
      await add(modelRef.value);
    }
    
    message.success('操作成功');
    emits('saveOk');
    visible.value = false;
  } catch (error) {} finally {
    confirmLoading.value = false;
  }
};

const open = async (row) => {
  modelRef.value = JSON.parse(JSON.stringify(row || {}));
  
  try {
    roleList.value = (await zdList()).data
  } catch (error) {}
  
  visible.value = true;
};

defineExpose({
  open,
});
</script>

<style lang="less" scoped>
.ant-form{
  margin-top: 20px;
}
.tip-text {
  color: #999;
  font-size: 12px;
}
</style>