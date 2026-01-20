/**
 * 判断当前环境是否为Chrome扩展环境
 * @returns {boolean} 是否在Chrome扩展中运行
 */
export function isExtensionEnvironment() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
}

/**
 * Chrome 存储 API 工具集
 *
 * 本文件提供两种不同的存储方式：
 * 1. 本地存储 (local)：
 *    - 通过 chromeStorageGet/chromeStorageSet 和 getFromStorage/setToStorage 函数访问
 *    - 存储容量大（通常 5MB 左右）
 *    - 仅在当前设备上保存数据
 *    - 适合存储大量数据，如标签组、历史记录等
 *
 * 2. 同步存储 (sync)：
 *    - 通过 chromeSyncStorageGet/chromeSyncStorageSet 函数访问
 *    - 存储容量有限（通常 100KB 左右）
 *    - 数据会自动在用户登录相同 Google 账户的所有设备间同步
 *    - 适合存储用户偏好设置、配置选项等小型但需要跨设备同步的数据
 *
 * 非扩展环境下，这两种存储方式都会回退到使用 localStorage，并使用不同的前缀区分。
 */

/**
 * 从 Chrome 存储中获取数据
 * @param {string} key - 存储的键名
 * @returns {Promise<any>} 存储的数据
 */
export function chromeStorageGet(key) {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      // 如果不在扩展环境中，从localStorage获取
      try {
        const item = localStorage.getItem(`onetabs_${key}`)
        const data = item ? JSON.parse(item) : null
        // 返回格式保持与Chrome扩展一致：{ key: value }
        resolve(data ? { [key]: data } : {})
      } catch (error) {
        console.error('localStorage读取失败:', error)
        reject(error)
      }
      return
    }

    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }
        resolve(result)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 将数据保存到 Chrome 存储
 * @param {string} key - 存储的键名
 * @param {any} data - 要存储的数据
 * @returns {Promise<void>}
 */
export function chromeStorageSet(key, data) {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      // 如果不在扩展环境中，存储到localStorage
      try {
        localStorage.setItem(`onetabs_${key}`, JSON.stringify(data))
        console.log(`localStorage保存成功: onetabs_${key}`, data)
        resolve()
      } catch (error) {
        console.error('localStorage保存失败:', error)
        reject(error)
      }
      return
    }

    try {
      chrome.storage.local.set({ [key]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 从 Chrome 同步存储中获取数据
 * @param {string} key - 存储的键名
 * @returns {Promise<any>} 存储的数据
 */
export function chromeSyncStorageGet(key) {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      // 如果不在扩展环境中，从localStorage获取
      try {
        const item = localStorage.getItem(`onetabs_sync_${key}`)
        resolve(item ? JSON.parse(item) : {})
      } catch (error) {
        reject(error)
      }
      return
    }

    chrome.storage.sync.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve(result)
    })
  })
}

/**
 * 将数据保存到 Chrome 同步存储
 * @param {string} key - 存储的键名
 * @param {any} data - 要存储的数据
 * @returns {Promise<void>}
 */
export function chromeSyncStorageSet(key, data) {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      // The storage key will be prefixed with "onetabs_sync_" to differentiate it
      try {
        localStorage.setItem(`onetabs_sync_${key}`, JSON.stringify(data))
        resolve()
      } catch (error) {
        reject(error)
      }
      return
    }

    chrome.storage.sync.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve()
    })
  })
}

/**
 * 获取 Chrome 存储中的数据
 * @param {string} key 存储键名
 * @returns {Promise<any>} 存储的数据
 */
export function getFromStorage(key) {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      try {
        const item = localStorage.getItem(`onetabs_${key}`)
        resolve(item ? JSON.parse(item) : null)
      } catch (error) {
        reject(error)
      }
      return
    }

    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve(result[key])
    })
  })
}

/**
 * 设置 Chrome 存储中的数据
 * @param {string} key 存储键名
 * @param {any} value 要存储的值
 * @returns {Promise<void>}
 */
export function setToStorage(key, value) {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      try {
        localStorage.setItem(`onetabs_${key}`, JSON.stringify(value))
        resolve()
      } catch (error) {
        reject(error)
      }
      return
    }

    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve()
    })
  })
}

/**
 * 获取标签组数据
 * @returns {Promise<Array>} 标签组数组
 */
export async function getTabGroups() {
  const tabGroups = await getFromStorage('tabGroups')
  // return Array.isArray(tabGroups) ? tabGroups : [];

  return [
    {
      date: 1745741417336,
      type: 'ungrouped',
      tabs: [
        {
          url: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/onetab.html',
          title: 'OneTab',
          favIconUrl: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/images/extension-icon32.png',
          groupId: -1,
        },
        {
          url: 'chrome://newtab/',
          title: '新标签页',
          favIconUrl: '',
          groupId: -1,
        },
      ],
      title: '未分组标签',
      isPinned: false,
    },
    {
      date: 1744610593188,
      isPinned: false,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '扩展程序',
          url: 'chrome://extensions/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744609261525,
      isPinned: false,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '扩展程序',
          url: 'chrome://extensions/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744609022851,
      isPinned: false,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '设置 - 自定义字体',
          url: 'chrome://settings/fonts?search=%E5%AD%97%E4%BD%93',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title: '扩展程序',
          url: 'chrome://extensions/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744603846945,
      groupInfo: {
        collapsed: false,
        color: 'yellow',
        id: 1599388511,
        title: 'news',
      },
      isPinned: false,
      tabs: [
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 1599388511,
          title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
          url: 'https://blog.csdn.net/c12312303/article/details/146428465',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 1599388511,
          title: 'npm 淘宝镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
        },
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 1599388511,
          title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
          url: 'https://blog.csdn.net/Achong999/article/details/127397533',
        },
        {
          favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
          groupId: 1599388511,
          title: 'iconfont-阿里巴巴矢量图标库',
          url: 'https://www.iconfont.cn/',
        },
        {
          favIconUrl: 'https://nuxt.com/icon.png',
          groupId: 1599388511,
          title: 'Installation · Get Started with Nuxt',
          url: 'https://nuxt.com/docs/getting-started/installation',
        },
        {
          favIconUrl: 'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
          groupId: 1599388511,
          title: '供应商-产品列表及详情优化',
          url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 1599388511,
          title: '国内 docker镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
        },
      ],
      title: 'news',
      type: 'grouped',
    },
    {
      date: 1744603846945,
      isPinned: false,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '新标签页',
          url: 'chrome://newtab/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744603562693,
      isPinned: false,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '新标签页',
          url: 'chrome://newtab/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744603134185,
      isPinned: false,
      tabs: [
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: -1,
          title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
          url: 'https://blog.csdn.net/c12312303/article/details/146428465',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: -1,
          title: 'npm 淘宝镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
        },
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: -1,
          title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
          url: 'https://blog.csdn.net/Achong999/article/details/127397533',
        },
        {
          favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
          groupId: -1,
          title: 'iconfont-阿里巴巴矢量图标库',
          url: 'https://www.iconfont.cn/',
        },
        {
          favIconUrl: 'https://nuxt.com/icon.png',
          groupId: -1,
          title: 'Installation · Get Started with Nuxt',
          url: 'https://nuxt.com/docs/getting-started/installation',
        },
        {
          favIconUrl: 'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
          groupId: -1,
          title: '供应商-产品列表及详情优化',
          url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: -1,
          title: '国内 docker镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744603110284,
      groupInfo: {
        collapsed: false,
        color: 'yellow',
        id: 1989148891,
        title: 'news-1',
      },
      isPinned: false,
      tabs: [
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 1989148891,
          title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
          url: 'https://blog.csdn.net/c12312303/article/details/146428465',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 1989148891,
          title: 'npm 淘宝镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
        },
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 1989148891,
          title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
          url: 'https://blog.csdn.net/Achong999/article/details/127397533',
        },
        {
          favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
          groupId: 1989148891,
          title: 'iconfont-阿里巴巴矢量图标库',
          url: 'https://www.iconfont.cn/',
        },
        {
          favIconUrl: 'https://nuxt.com/icon.png',
          groupId: 1989148891,
          title: 'Installation · Get Started with Nuxt',
          url: 'https://nuxt.com/docs/getting-started/installation',
        },
        {
          favIconUrl: 'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
          groupId: 1989148891,
          title: '供应商-产品列表及详情优化',
          url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 1989148891,
          title: '国内 docker镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
        },
      ],
      title: 'news-1',
      type: 'grouped',
    },
    {
      date: 1744603110284,
      isPinned: false,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '新标签页',
          url: 'chrome://newtab/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744603082841,
      groupInfo: {
        collapsed: false,
        color: 'yellow',
        id: 1166835629,
        title: 'news',
      },
      isPinned: false,
      tabs: [
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 1166835629,
          title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
          url: 'https://blog.csdn.net/c12312303/article/details/146428465',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 1166835629,
          title: 'npm 淘宝镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
        },
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 1166835629,
          title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
          url: 'https://blog.csdn.net/Achong999/article/details/127397533',
        },
        {
          favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
          groupId: 1166835629,
          title: 'iconfont-阿里巴巴矢量图标库',
          url: 'https://www.iconfont.cn/',
        },
        {
          favIconUrl: 'https://nuxt.com/icon.png',
          groupId: 1166835629,
          title: 'Installation · Get Started with Nuxt',
          url: 'https://nuxt.com/docs/getting-started/installation',
        },
        {
          favIconUrl: 'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
          groupId: 1166835629,
          title: '供应商-产品列表及详情优化',
          url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 1166835629,
          title: '国内 docker镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
        },
      ],
      title: 'news-2',
      type: 'grouped',
    },
    {
      date: 1744603082841,
      groupInfo: {
        collapsed: false,
        color: 'yellow',
        id: 2059450153,
        title: 'news',
      },
      isPinned: false,
      tabs: [
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 2059450153,
          title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
          url: 'https://blog.csdn.net/c12312303/article/details/146428465',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 2059450153,
          title: 'npm 淘宝镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
        },
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 2059450153,
          title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
          url: 'https://blog.csdn.net/Achong999/article/details/127397533',
        },
        {
          favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
          groupId: 2059450153,
          title: 'iconfont-阿里巴巴矢量图标库',
          url: 'https://www.iconfont.cn/',
        },
        {
          favIconUrl: 'https://nuxt.com/icon.png',
          groupId: 2059450153,
          title: 'Installation · Get Started with Nuxt',
          url: 'https://nuxt.com/docs/getting-started/installation',
        },
        {
          favIconUrl: 'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
          groupId: 2059450153,
          title: '供应商-产品列表及详情优化',
          url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 2059450153,
          title: '国内 docker镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
        },
      ],
      title: '新的',
      type: 'grouped',
    },
    {
      date: 1744603082841,
      isPinned: false,
      tabs: [
        {
          favIconUrl: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/images/extension-icon32.png',
          groupId: -1,
          title: 'OneTab',
          url: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/onetab.html',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title: '扩展程序',
          url: 'chrome://extensions/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744603072776,
      isPinned: false,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '新标签页',
          url: 'chrome://newtab/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744598783384,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '新标签页',
          url: 'chrome://newtab/',
        },
        {
          favIconUrl: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/images/extension-icon32.png',
          groupId: -1,
          title: 'OneTab',
          url: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/onetab.html',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'https://rp.mockplus.cn/favicon_rp_preview.ico',
          groupId: -1,
          title: '询盘列表 - 摹客RP',
          url: 'https://rp.mockplus.cn/run/YVHYp83hzg/HMUBX9gqkU/K7XBQ6x_3g?cps=hide&rps=hide&nav=1&ha=0&la=0&fc=0&out=1&rt=1&dt=none&as=true',
        },
        {
          favIconUrl: 'https://sso-cdn.lanhuapp.com/ssoweb/favicon.ico',
          groupId: -1,
          title: '开始使用 - 蓝湖',
          url: 'https://lanhuapp.com/sso/#/main/home?redirect_to=https%253A%252F%252Flanhuapp.com%252Fweb%252F%253Freferrer%253Dinner_link%2526next_url%253Ditem%25252Fboard%25252Fdetail%25253Fpid%25253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526project_id%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526image_id%253D6dcb16ef-b298-4f42-b049-add732b7273f%2526fromEditor%253Dtrue%2526type%253Dprojectdetail',
        },
        {
          favIconUrl: 'https://sso-cdn.lanhuapp.com/ssoweb/favicon.ico',
          groupId: -1,
          title: '开始使用 - 蓝湖',
          url: 'https://lanhuapp.com/sso/#/main/home?tid=14bab8c2-d754-4c1b-b75e-d297276805be&redirect_to=https%253A%252F%252Flanhuapp.com%252Fweb%252F%253Freferrer%253Dinner_link%2526next_url%253Ditem%25252Fboard%25252Fdetail%25253Ftid%25253D14bab8c2-d754-4c1b-b75e-d297276805be%2526pid%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526project_id%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526image_id%253D0303a614-d609-4c37-a804-33d55571a2e9%2526fromEditor%253Dtrue%2526type%253Dimage',
        },
        {
          favIconUrl: 'https://cdn.yopinhub.com/2025/02/714f969a1c4948dda72e165b1c06be1a.jpg',
          groupId: -1,
          title: '主页 - 山东优品',
          url: 'http://localhost:3000/zh_CN#/',
        },
        {
          favIconUrl: 'https://cdn.yopinhub.com/2025/02/714f969a1c4948dda72e165b1c06be1a.jpg',
          groupId: -1,
          title: '主页 - 山东优品',
          url: 'http://localhost:3000/zh_CN',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title: '',
          url: '',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title:
            'raw.githubusercontent.com/vhhgx/cdn-src/refs/heads/main/src/bash/init.sh?token=GHSAT0AAAAAADA6PETS6O5I3RSXYZEHKUQ6Z72BQEA',
          url: 'https://raw.githubusercontent.com/vhhgx/cdn-src/refs/heads/main/src/bash/init.sh?token=GHSAT0AAAAAADA6PETS6O5I3RSXYZEHKUQ6Z72BQEA',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title: '扩展程序',
          url: 'chrome://extensions/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744598697470,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '新标签页',
          url: 'chrome://newtab/',
        },
        {
          favIconUrl: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/images/extension-icon32.png',
          groupId: -1,
          title: 'OneTab',
          url: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/onetab.html',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'https://rp.mockplus.cn/favicon_rp_preview.ico',
          groupId: -1,
          title: '询盘列表 - 摹客RP',
          url: 'https://rp.mockplus.cn/run/YVHYp83hzg/HMUBX9gqkU/K7XBQ6x_3g?cps=hide&rps=hide&nav=1&ha=0&la=0&fc=0&out=1&rt=1&dt=none&as=true',
        },
        {
          favIconUrl: 'https://sso-cdn.lanhuapp.com/ssoweb/favicon.ico',
          groupId: -1,
          title: '开始使用 - 蓝湖',
          url: 'https://lanhuapp.com/sso/#/main/home?redirect_to=https%253A%252F%252Flanhuapp.com%252Fweb%252F%253Freferrer%253Dinner_link%2526next_url%253Ditem%25252Fboard%25252Fdetail%25253Fpid%25253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526project_id%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526image_id%253D6dcb16ef-b298-4f42-b049-add732b7273f%2526fromEditor%253Dtrue%2526type%253Dprojectdetail',
        },
        {
          favIconUrl: 'https://sso-cdn.lanhuapp.com/ssoweb/favicon.ico',
          groupId: -1,
          title: '开始使用 - 蓝湖',
          url: 'https://lanhuapp.com/sso/#/main/home?tid=14bab8c2-d754-4c1b-b75e-d297276805be&redirect_to=https%253A%252F%252Flanhuapp.com%252Fweb%252F%253Freferrer%253Dinner_link%2526next_url%253Ditem%25252Fboard%25252Fdetail%25253Ftid%25253D14bab8c2-d754-4c1b-b75e-d297276805be%2526pid%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526project_id%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526image_id%253D0303a614-d609-4c37-a804-33d55571a2e9%2526fromEditor%253Dtrue%2526type%253Dimage',
        },
        {
          favIconUrl: 'https://cdn.yopinhub.com/2025/02/714f969a1c4948dda72e165b1c06be1a.jpg',
          groupId: -1,
          title: '主页 - 山东优品',
          url: 'http://localhost:3000/zh_CN#/',
        },
        {
          favIconUrl: 'https://cdn.yopinhub.com/2025/02/714f969a1c4948dda72e165b1c06be1a.jpg',
          groupId: -1,
          title: '主页 - 山东优品',
          url: 'http://localhost:3000/zh_CN',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title: 'hub.docker.com',
          url: 'https://hub.docker.com/_/node/tags?name=18.20.5',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title:
            'raw.githubusercontent.com/vhhgx/cdn-src/refs/heads/main/src/bash/init.sh?token=GHSAT0AAAAAADA6PETS6O5I3RSXYZEHKUQ6Z72BQEA',
          url: 'https://raw.githubusercontent.com/vhhgx/cdn-src/refs/heads/main/src/bash/init.sh?token=GHSAT0AAAAAADA6PETS6O5I3RSXYZEHKUQ6Z72BQEA',
        },
        {
          favIconUrl: '',
          groupId: -1,
          title: '扩展程序',
          url: 'chrome://extensions/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744598597864,
      groupInfo: {
        collapsed: false,
        color: 'yellow',
        id: 9451810,
        title: 'news',
      },
      tabs: [
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 9451810,
          title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
          url: 'https://blog.csdn.net/c12312303/article/details/146428465',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 9451810,
          title: 'npm 淘宝镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
        },
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 9451810,
          title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
          url: 'https://blog.csdn.net/Achong999/article/details/127397533',
        },
        {
          favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
          groupId: 9451810,
          title: 'iconfont-阿里巴巴矢量图标库',
          url: 'https://www.iconfont.cn/',
        },
        {
          favIconUrl: 'https://nuxt.com/icon.png',
          groupId: 9451810,
          title: 'Installation · Get Started with Nuxt',
          url: 'https://nuxt.com/docs/getting-started/installation',
        },
        {
          favIconUrl: 'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
          groupId: 9451810,
          title: '供应商-产品列表及详情优化',
          url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 9451810,
          title: '国内 docker镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
        },
      ],
      title: 'news',
      type: 'grouped',
    },
    {
      date: 1744598597863,
      tabs: [
        {
          favIconUrl: '',
          groupId: -1,
          title: '新标签页',
          url: 'chrome://newtab/',
        },
        {
          favIconUrl: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/images/extension-icon32.png',
          groupId: -1,
          title: 'OneTab',
          url: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/onetab.html',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'http://192.168.31.254:8000/icon-32.png',
          groupId: -1,
          title: '易运营技术分享平台',
          url: 'http://192.168.31.254:8000/login',
        },
        {
          favIconUrl: 'https://rp.mockplus.cn/favicon_rp_preview.ico',
          groupId: -1,
          title: '询盘列表 - 摹客RP',
          url: 'https://rp.mockplus.cn/run/YVHYp83hzg/HMUBX9gqkU/K7XBQ6x_3g?cps=hide&rps=hide&nav=1&ha=0&la=0&fc=0&out=1&rt=1&dt=none&as=true',
        },
        {
          favIconUrl: 'https://sso-cdn.lanhuapp.com/ssoweb/favicon.ico',
          groupId: -1,
          title: '开始使用 - 蓝湖',
          url: 'https://lanhuapp.com/sso/#/main/home?redirect_to=https%253A%252F%252Flanhuapp.com%252Fweb%252F%253Freferrer%253Dinner_link%2526next_url%253Ditem%25252Fboard%25252Fdetail%25253Fpid%25253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526project_id%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526image_id%253D6dcb16ef-b298-4f42-b049-add732b7273f%2526fromEditor%253Dtrue%2526type%253Dprojectdetail',
        },
        {
          favIconUrl: 'https://sso-cdn.lanhuapp.com/ssoweb/favicon.ico',
          groupId: -1,
          title: '开始使用 - 蓝湖',
          url: 'https://lanhuapp.com/sso/#/main/home?tid=14bab8c2-d754-4c1b-b75e-d297276805be&redirect_to=https%253A%252F%252Flanhuapp.com%252Fweb%252F%253Freferrer%253Dinner_link%2526next_url%253Ditem%25252Fboard%25252Fdetail%25253Ftid%25253D14bab8c2-d754-4c1b-b75e-d297276805be%2526pid%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526project_id%253D8cddd3ba-dda5-4a94-a815-a11a86aa36fe%2526image_id%253D0303a614-d609-4c37-a804-33d55571a2e9%2526fromEditor%253Dtrue%2526type%253Dimage',
        },
        {
          favIconUrl: 'https://cdn.yopinhub.com/2025/02/714f969a1c4948dda72e165b1c06be1a.jpg',
          groupId: -1,
          title: '主页 - 山东优品',
          url: 'http://localhost:3000/zh_CN#/',
        },
      ],
      title: '未分组标签',
      type: 'ungrouped',
    },
    {
      date: 1744598261667,
      groupedTabs: {
        21219761: {
          info: {
            collapsed: false,
            color: 'yellow',
            id: 21219761,
            title: 'news',
          },
          tabs: [
            {
              favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
              groupId: 21219761,
              title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
              url: 'https://blog.csdn.net/c12312303/article/details/146428465',
            },
            {
              favIconUrl: 'https://www.baidu.com/favicon.ico',
              groupId: 21219761,
              title: 'npm 淘宝镜像_百度搜索',
              url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
            },
            {
              favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
              groupId: 21219761,
              title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
              url: 'https://blog.csdn.net/Achong999/article/details/127397533',
            },
            {
              favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
              groupId: 21219761,
              title: 'iconfont-阿里巴巴矢量图标库',
              url: 'https://www.iconfont.cn/',
            },
            {
              favIconUrl: 'https://nuxt.com/icon.png',
              groupId: 21219761,
              title: 'Installation · Get Started with Nuxt',
              url: 'https://nuxt.com/docs/getting-started/installation',
            },
            {
              favIconUrl:
                'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
              groupId: 21219761,
              title: '供应商-产品列表及详情优化',
              url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
            },
            {
              favIconUrl: 'https://www.baidu.com/favicon.ico',
              groupId: 21219761,
              title: '国内 docker镜像_百度搜索',
              url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
            },
          ],
        },
      },
      originalGroups: {
        21219761: {
          info: {
            collapsed: false,
            color: 'yellow',
            id: 21219761,
            title: 'news',
          },
          tabIds: {
            0: {
              favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
              groupId: 21219761,
              title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
              url: 'https://blog.csdn.net/c12312303/article/details/146428465',
            },
            1: {
              favIconUrl: 'https://www.baidu.com/favicon.ico',
              groupId: 21219761,
              title: 'npm 淘宝镜像_百度搜索',
              url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
            },
            2: {
              favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
              groupId: 21219761,
              title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
              url: 'https://blog.csdn.net/Achong999/article/details/127397533',
            },
            3: {
              favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
              groupId: 21219761,
              title: 'iconfont-阿里巴巴矢量图标库',
              url: 'https://www.iconfont.cn/',
            },
            4: {
              favIconUrl: 'https://nuxt.com/icon.png',
              groupId: 21219761,
              title: 'Installation · Get Started with Nuxt',
              url: 'https://nuxt.com/docs/getting-started/installation',
            },
            5: {
              favIconUrl:
                'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
              groupId: 21219761,
              title: '供应商-产品列表及详情优化',
              url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
            },
            6: {
              favIconUrl: 'https://www.baidu.com/favicon.ico',
              groupId: 21219761,
              title: '国内 docker镜像_百度搜索',
              url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
            },
          },
        },
      },
      tabs: [
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 21219761,
          title: '国内仍然可用docker镜像源汇总，长期维护，定期更新（2025年3月21日）_docker 国内镜像源-CSDN博客',
          url: 'https://blog.csdn.net/c12312303/article/details/146428465',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 21219761,
          title: 'npm 淘宝镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=npm%20%E6%B7%98%E5%AE%9D%E9%95%9C%E5%83%8F',
        },
        {
          favIconUrl: 'https://g.csdnimg.cn/static/logo/favicon32.ico',
          groupId: 21219761,
          title: 'npm安装、切换淘宝镜像_npm淘宝镜像-CSDN博客',
          url: 'https://blog.csdn.net/Achong999/article/details/127397533',
        },
        {
          favIconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Z5paLz1O0zuCC7osS_!!6000000001644-55-tps-83-82.svg',
          groupId: 21219761,
          title: 'iconfont-阿里巴巴矢量图标库',
          url: 'https://www.iconfont.cn/',
        },
        {
          favIconUrl: 'https://nuxt.com/icon.png',
          groupId: 21219761,
          title: 'Installation · Get Started with Nuxt',
          url: 'https://nuxt.com/docs/getting-started/installation',
        },
        {
          favIconUrl: 'https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original',
          groupId: 21219761,
          title: '供应商-产品列表及详情优化',
          url: 'https://www.yuque.com/chenkai-nfwtm/btm6bw/yefrv0rpap1oz0fu?singleDoc#wLQkN',
        },
        {
          favIconUrl: 'https://www.baidu.com/favicon.ico',
          groupId: 21219761,
          title: '国内 docker镜像_百度搜索',
          url: 'https://www.baidu.com/s?ie=UTF-8&wd=%E5%9B%BD%E5%86%85%20docker%E9%95%9C%E5%83%8F',
        },
      ],
    },
  ]
}

/**
 * 保存标签组数据
 * @param {Array} tabGroups 标签组数组
 * @returns {Promise<void>}
 */
export function saveTabGroups(tabGroups) {
  return setToStorage('tabGroups', tabGroups)
}
