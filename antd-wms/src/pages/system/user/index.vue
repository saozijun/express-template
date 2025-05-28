<template>
  <div class="box">
    <a-card mb-4>
      <a-form :model="formModel">
        <a-row :gutter="[15, 0]">
          <a-col>
            <a-form-item name="nickname" label="名称">
              <a-input v-model:value="formModel.nickname" placeholder="请输入名称" />
            </a-form-item>
          </a-col>
          <a-col>
            <a-form-item name="role" label="角色">
              <a-select v-model:value="formModel.role" placeholder="请选择角色" allowClear>
                <a-select-option v-for="(item) in roleList" :value="item.flag" :key="item.id">{{item.name}}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col>
            <a-space flex justify-end w-full>
              <a-button :loading="loading" type="primary" @click="onSearch">
                查询
              </a-button>
              <a-button :loading="loading" @click="onReset">
                重置
              </a-button>
              <a-button v-if="isAdmin" type="primary" @click="open">
                <template #icon>
                  <PlusOutlined />
                </template>
                新增
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
    <a-table :columns="columns" :data-source="tableData" :pagination="false" :loading="loading">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <span>
            <a-tag  color="blue"> {{ record.role.name }}</a-tag>
          </span>
        </template>
        <template v-else-if="column.key === 'status'">
          <span>
            <a-switch v-model:checked="record.status" @change="toggleStatus(record)" v-if="isAdmin && record.id !== 1" checked-children="启用" un-checked-children="禁用" checkedValue="active" unCheckedValue="inactive" />
            <template v-else>
              <a-tag color="green">启用</a-tag>
            </template>
          </span>
        </template>
        <template v-else-if="column.key === 'operation'">
          <a-button style="padding: 0;" type="link" @click="open(record)">编辑</a-button>
          <a-button  type="link" @click="handleResetPassword(record)" v-if="isAdmin && record.id !== 1">重置密码</a-button>
          <a-popconfirm title="确定删除吗?" @confirm="onDelete(record.id)">
            <a-button type="link" style="padding: 0;" danger v-if="isAdmin && record.id !== 1">删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    <div class="pagination">
      <a-pagination v-model:current="formModel.pageNum" :total="total" @change="onPageChange" />
    </div>
    <Edit ref="editRef" @saveOk="getList"></Edit>
  </div>
</template>
<script setup>
import { PlusOutlined } from '@ant-design/icons-vue';
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { list, del, updateStatus, resetPassword } from '~/api/user'
import { zdList } from '~/api/role'
import { useUserStore } from '~/stores/user'
import Edit from './components/Edit.vue';

const userStore = useUserStore()
const isAdmin = computed(() => {
  return userStore.userInfo?.role === 'admin'
})

const editRef = ref(null)
const expand = ref(false)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const roleList = ref([])
const formModel = ref({
    pageNum: 1,
    pageSize: 10,
    nickname: "",
    role: undefined
})

onMounted(async () => {
  await loadRoles()
  getList()
})

const loadRoles = async () => {
  try {
    const { data } = await zdList()
    roleList.value = data
  } catch (error) {}
}

const onPageChange = (page) => {
  formModel.value.pageNum = page
  getList()
}

const onSearch = () => {
  formModel.value.pageNum = 1
  getList()
}

const onReset = () => {
  formModel.value = {
    pageNum: 1,
    pageSize: 10,
    nickname: "",
    role: undefined
  }
  getList()
}

const getList = async () => {
  loading.value = true
  try {
    const { data } = await list(formModel.value)
    total.value = data.total
    data.records.map((item,i) => {
      item.index = i + 1
      // 确保有状态字段
      if (!item.status) {
        item.status = 'active'
      }
    })
    tableData.value = data.records
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}

const onDelete = async (id) => {
  try {
    await del({id})
    getList()
    message.success('删除成功');
  } catch (error) {}
}

// 切换用户状态
const toggleStatus = async (record) => {
  try {
    await updateStatus({ id: record.id, status: record.status })
    getList()
    message.success(`${record.status === 'active' ? '启用' : '禁用'}成功`)
  } catch (error) {}
}

const open = (record = {}) => {
  editRef.value.open(record)
}

// 处理重置密码
const handleResetPassword = async (record) => {
  try {
    await resetPassword({
      id: record.id
    })
    message.success('密码已重置为：user123')
  } catch (error) {
    console.error(error)
  }
}

const columns = [
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 80,
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
  },
  {
    title: '账号',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '操作',
    key: 'operation',
    fixed: 'right',
    width: 230,
  },
];
</script>

<style lang="less" scoped>
.box {
  height: calc(100vh - 170px);
}

:deep( .ant-form-item ) {
  margin-bottom: 0;
}
.pagination{
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>