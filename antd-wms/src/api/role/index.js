
/**
 * 列表
 * @param {*} data 
 * @returns 
 */
export const  list = (data) => {
  return useGet('/role/page', data)
}

/**
 * 新增编辑
 * @param {*} data 
 * @returns 
 */
export const  save = (data) => {
  return usePost('/role/save', data)
}

/**
 * 删除
 * @param {*} data 
 * @returns 
 */
export const del = (data) => {
  return usePost('/role/delete', data)
}

/**
 * 字典项
 * @param {*} data 
 * @returns 
 */
export const zdList = (data) => {
  return useGet('/role/roleList', data)
}


