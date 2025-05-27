import type { RouteRecordRaw } from 'vue-router'
export const ROOT_ROUTE_REDIRECT_PATH = '/analysis'
import { useUserStore } from '~@/stores/user'

const Layout = () => import('~/layouts/index.vue')
const basicRouteMap = {
  // iframe模式下使用
  Iframe: () => import('~/pages/common/iframe.vue'),
  // 一般用于存在子集的页面
  RouteView: () => import('~/pages/common/route-view.vue'),
}

// 定义不同角色的路由
const adminRoutes = [
  {
    path: '/analysis',
    name: 'Analysis', 
    component: () => import('~/pages/analysis/index.vue'),
    meta: {
      title: '工作台',
      icon: 'FundProjectionScreenOutlined',
      roles: ['admin', 'user']
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('~/pages/system/settings/index.vue'),
    meta: {
      title: '个人中心',
      hideInMenu: true,
      roles: ['admin', 'user'] // 所有角色可见
    },
  },
  {
    path: '/system',
    redirect: '/system/role',
    name: 'System',
    meta: {
      title: '系统管理',
      icon: 'SettingOutlined',
      roles: ['admin'] // 仅管理员可见
    },
    component: basicRouteMap.RouteView,
    children: [
      {
        path: '/system/role',
        name: 'Role',
        component: () => import('~/pages/system/role/index.vue'),
        meta: {
          title: '角色管理',
          roles: ['admin']
        },
      },
      {
        path: '/system/user',
        name: 'User',
        component: () => import('~/pages/system/user/index.vue'),
        meta: {
          title: '用户管理',
          roles: ['admin']
        },
      },
    ],
  }
]

export const rootRoute: RouteRecordRaw = {
  path: '/',
  name: 'rootPath',
  redirect: () => {
    const userStore = useUserStore()
    if (userStore.userInfo && userStore.userInfo.role) {
      if (userStore.userInfo.role === 'admin') {
        return ROOT_ROUTE_REDIRECT_PATH
      } else {
        return '/analysis' // 普通用户默认跳转到工作台
      }
    }
    return ROOT_ROUTE_REDIRECT_PATH
  },
  component: Layout,
  children: [],
}

// 根据角色过滤路由
const filterRoutesByRole = (routes: any[], role: string) => {
  return routes.filter(route => {
    if (route.meta && route.meta.roles && route.meta.roles.length > 0) {
      return route.meta.roles.includes(role)
    }
    return true
  }).map(route => {
    if (route.children) {
      route.children = filterRoutesByRole(route.children, role)
    }
    return route
  })
}

// 导出路由
export default adminRoutes as RouteRecordRaw[]

// 导出获取角色路由的方法
export const getRoutesByRole = (role: string) => {
  return filterRoutesByRole(adminRoutes, role) as RouteRecordRaw[]
}
