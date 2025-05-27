import type { MenuData } from '~@/layouts/basic-layout/typing'
import dynamicRoutes, { rootRoute, getRoutesByRole } from '~@/router/dynamic-routes'
import { genRoutes } from '~@/router/generate-route'
import { updateInfo } from '~@/api/user'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const routerData = shallowRef()
  const menuData = shallowRef<MenuData>([])
  
  // 使用 useStorage 持久化存储用户信息
  const userInfo: any = useStorage('user-info', {})

  const avatar = computed(() => userInfo.value.avatarUrl && userInfo.value.avatarUrl != "" ? userInfo.value.avatarUrl : 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png')
  const nickname = computed(() => userInfo.value.nickname ?? userInfo.value.username)
  const role = computed(() => userInfo.value.role || 'guest')

  const generateRoutes = async () => {
    const userRole = role.value
    const routes = getRoutesByRole(userRole) // 根据角色获取路由
    
    const currentRoute = {
      ...rootRoute,
      children: routes,
    }
    menuData.value = genRoutes(routes)
    return currentRoute
  }

  const generateDynamicRoutes = async () => {
    const routerDatas = await generateRoutes()
    routerData.value = routerDatas
    return routerDatas
  }

  // 更新用户信息
  const updateAvatar = async (url: any) => {
    userInfo.value.avatarUrl = url
    await updateInfo(userInfo.value)
  }

  // 更新用户基本信息
  const updateUserInfo = async (data: any) => {
    userInfo.value = { ...userInfo.value, ...data }
    return userInfo.value
  }

  // 清除用户信息并退出登录
  const logout = () => {
    clearUserInfo()
    // 使用 window.location.href 重定向到登录页
    window.location.href = '/login'
  }

  // 清除用户信息
  const clearUserInfo = () => {
    userInfo.value = {}
  }

  // 检查用户是否有特定权限
  const hasPermission = (requiredRole: string | string[]) => {
    const userRole = role.value
    if (!userRole) return false
    
    if (userRole === 'admin') return true // 管理员拥有所有权限
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole)
    }
    
    return requiredRole === userRole
  }

  return {
    routerData,
    menuData,
    generateDynamicRoutes,
    avatar,
    nickname,
    role,
    userInfo,
    clearUserInfo,
    updateAvatar,
    updateUserInfo,
    logout,
    hasPermission
  }
})
