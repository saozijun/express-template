/**
 * 列表
 * @param {*} data 
 * @returns 
 */
export const  list = (data) => {
  return useGet('/user/page', data)
}

/**
 * 新增用户（仅管理员）
 * @param {*} data 
 * @returns 
 */
export const add = (data) => {
  return usePost('/user/add', data)
}

/**
 * 新增编辑
 * @param {*} data 
 * @returns 
 */
export const  save = (data) => {
  return usePost('/user/save', data)
}

/**
 * 删除
 * @param {*} data 
 * @returns 
 */
export const del = (data) => {
  return usePost('/user/delete', data)
}

/**
 * 更新信息
 * @param {*} data 
 * @returns 
 */
export const updateInfo = (data) => {
  return usePost('/user/upload/avatar', data)
}

/**
 * 更新用户状态
 * @param {*} data 
 * @returns 
 */
export const updateStatus = (data) => {
  return usePost('/user/status', data)
}

/**
 * 重置密码
 * @param {*} data 
 * @returns 
 */
export const resetPassword = (data) => {
  return usePost('/user/reset-password', data)
}
