/**
 * 登录
 * @param {*} data 
 * @returns 
 */
export const login = (data) => {
  return usePost('/auth/login', data)
}

/**
 * 注册
 * @param {*} data
 * @returns
 */
export const register = (data) => {
  return usePost('/auth/register', data)
}

/**
 * 注销
 * @returns
 */
export const logout = () => {
  return usePost('/auth/logout')
}

/**
 * 获取当前用户信息
 * @returns
 */
export const getCurrentUser = () => {
  return useGet('/auth/current')
}