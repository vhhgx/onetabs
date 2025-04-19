<template>
  <div class="vh-tabs-group">

    <!-- 这里 100% 继承了外部vh-tabs-group 类的100% 即最外层的100vh 所以高度要变成 calc(100% - 40px)  -->
    <div style="width: 500px; height: calc(100% );; background-color: wheat">

      <div style="height: 80px">
        <h1>OneTabs</h1>
        <div class="actions">
          <button class="save-btn" @click="saveCurrentTabs">保存当前标签</button>
          <button class="delete-btn" @click="resetStorage">重置数据</button>
        </div>
      </div>
      <!--      scrollbar-->
      <div class="tab-groups scrollbar" style="height: calc(100% - 80px - 40px);  padding: 20px">
        <template v-if="tabGroups.length > 0">
          <div
            v-for="(group, groupIndex) in tabGroups"
            :key="groupIndex"
            class="tab-group"
            :data-group-index="groupIndex"
          >
            <div class="group-header">
              <div>
                <div style="font-size: 16px; font-weight: 700">{{ group.tabs.length }} 个标签页</div>

              </div>

              <div style="font-size: 12px">
                <div class="restore-btn" @click="restoreGroup(groupIndex)">
                  恢复所有
                </div>
                <div class="delete-btn" @click="deleteGroup(groupIndex)">
                  删除组
                </div>
              </div>

              <div style="font-size: 12px"> {{ formatDate(group.date) }}</div>
            </div>
            <ul class="tab-list">
              <li
                v-for="(tab, tabIndex) in group.tabs"
                :key="tabIndex"
                class="tab-item"
                :data-tab-index="tabIndex"
                style=""
              >
                <img
                  :src="tab.favIconUrl || '/icons/icon16.png'"
                  alt="icon"
                  class="tab-icon"
                />
                <a :href="tab.url" target="_blank">{{ tab.title }}</a>
                <button
                  class="delete-tab-btn"
                  @click="deleteTab(groupIndex, tabIndex)"
                >
                  ×
                </button>
              </li>
            </ul>
          </div>
        </template>
        <div v-else class="empty-state">
          <p>没有保存的标签页组。点击"保存当前标签"按钮保存打开的标签页。</p>
        </div>
      </div>
    </div>
    <div style="flex: 1; background-color: gray; height: 100%;">
      2
    </div>


  </div>
</template>

<script setup>
import { ref } from 'vue'
import { saveTabGroups } from '@/utils/chrome-storage'

const tabGroups = ref([
  {
    date: 1744537979252,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序',
        url: 'chrome://extensions/'
      }
    ]
  },
  {
    date: 1744537690213,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序',
        url: 'chrome://extensions/'
      }
    ]
  },
  {
    date: 1744537529403,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序',
        url: 'chrome://extensions/'
      }
    ]
  },
  {
    date: 1744537171928,
    tabs: [
      {
        favIconUrl: '',
        title: 'OneTabs',
        url: 'http://localhost:5173/#/'
      },
      {
        favIconUrl: '',
        title: '扩展程序',
        url: 'chrome://extensions/?errors=baiipjemgglfngcfgjbpneglbeimeolf'
      }
    ]
  },
  {
    date: 1744536157348,
    tabs: [
      {
        favIconUrl:
          'chrome-extension://neenonboocaimmddlbnpigomdcdekjjc/icons/icon16.png',
        title: 'OneTabs - 设置',
        url: 'chrome-extension://neenonboocaimmddlbnpigomdcdekjjc/index.html#/settings'
      }
    ]
  },
  {
    date: 1744535996432,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序 - OneTabs',
        url: 'chrome://extensions/?id=baiipjemgglfngcfgjbpneglbeimeolf'
      },
      {
        favIconUrl: 'https://github.githubassets.com/favicons/favicon-dark.svg',
        title:
          'GitHub - mde/ejs: Embedded JavaScript templates -- http://ejs.co',
        url: 'https://github.com/mde/ejs'
      },
      {
        favIconUrl:
          'https://static-production.npmjs.com/b0f1a8318363185cc2ea6a40ac23eeb2.png',
        title: 'ejs - npm',
        url: 'https://www.npmjs.com/package/ejs'
      }
    ]
  },
  {
    date: 1744535963447,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序',
        url: 'chrome://extensions/?errors=baiipjemgglfngcfgjbpneglbeimeolf'
      }
    ]
  },
  {
    date: 1744535934009,
    tabs: [
      {
        favIconUrl:
          'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/images/extension-icon32.png',
        title: 'OneTab',
        url: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/onetab.html'
      }
    ]
  },
  {
    date: 1744535876482,
    tabs: [
      {
        favIconUrl:
          'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/images/extension-icon32.png',
        title: 'OneTab',
        url: 'chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/onetab.html'
      }
    ]
  },
  {
    date: 1744535863808,
    tabs: [
      {
        favIconUrl:
          'chrome-extension://baiipjemgglfngcfgjbpneglbeimeolf/icons/icon48.png',
        title: 'chrome-extension://baiipjemgglfngcfgjbpneglbeimeolf/',
        url: 'chrome-extension://baiipjemgglfngcfgjbpneglbeimeolf/'
      }
    ]
  },
  {
    date: 1744535860726,
    tabs: [
      {
        favIconUrl:
          'chrome-extension://baiipjemgglfngcfgjbpneglbeimeolf/icons/icon48.png',
        title: 'chrome-extension://baiipjemgglfngcfgjbpneglbeimeolf/settings',
        url: 'chrome-extension://baiipjemgglfngcfgjbpneglbeimeolf/settings'
      }
    ]
  },
  {
    date: 1744535829331,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序',
        url: 'chrome://extensions/'
      }
    ]
  },
  {
    date: 1744534585630,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序',
        url: 'chrome://extensions/'
      }
    ]
  },
  {
    date: 1744534559305,
    tabs: [
      {
        favIconUrl: '',
        title: '扩展程序 - OneTabs',
        url: 'chrome://extensions/?id=baiipjemgglfngcfgjbpneglbeimeolf'
      }
    ]
  },
  {
    date: 1744534454201,
    tabs: [
      {
        favIconUrl: 'https://github.githubassets.com/favicons/favicon-dark.svg',
        title: 'Sign in to GitHub · GitHub',
        url: 'https://github.com/login?client_id=01ab8ac9400c4e429b23&login=vhhgx&return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3D01ab8ac9400c4e429b23%26login%3Dvhhgx%26redirect_uri%3Dhttps%253A%252F%252Fvscode.dev%252Fredirect%26scope%3Dread%253Auser%2Brepo%2Buser%253Aemail%2Bworkflow%26state%3Dvscode%25253A%25252F%25252Fvscode.github-authentication%25252Fdid-authenticate%25253Fnonce%25253D771598e1f2ed9eaa%252526windowId%25253D2'
      },
      {
        favIconUrl: 'https://github.githubassets.com/favicons/favicon-dark.svg',
        title: 'vhhgx (扬灵) · GitHub',
        url: 'https://github.com/vhhgx'
      },
      {
        favIconUrl: 'https://www.baidu.com/favicon.ico',
        title: 'yazi 文件管理器_百度搜索',
        url: 'https://www.baidu.com/s?ie=UTF-8&wd=yazi%20%E6%96%87%E4%BB%B6%E7%AE%A1%E7%90%86%E5%99%A8'
      },
      {
        favIconUrl: 'https://yazi-rs.github.io/webp/logo.webp',
        title: 'Installation | Yazi',
        url: 'https://yazi-rs.github.io/docs/installation/'
      },
      {
        favIconUrl: '',
        title: 'blog.csdn.net',
        url: 'https://blog.csdn.net/edwinjhlee/article/details/140781522'
      },
      {
        favIconUrl: '',
        title: 'www.cnblogs.com',
        url: 'https://www.cnblogs.com/exuli/p/18720794'
      },
      {
        favIconUrl:
          'https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/static/favicons/favicon-32x32.png',
        title:
          '你还在重复的搬砖！？写个 cli 工具解放你的双手吧 - 动态生成代码模板why 在我平时的授课工作里面，需要频繁的创建 - 掘金',
        url: 'https://juejin.cn/post/6977567286013984776?utm_source=gold_browser_extension'
      },
      {
        favIconUrl: 'https://github.githubassets.com/favicons/favicon-dark.svg',
        title:
          'teach-koa-setup/bin/template/package.ejs at main · cuixiaorui/teach-koa-setup · GitHub',
        url: 'https://github.com/cuixiaorui/teach-koa-setup/blob/main/bin/template/package.ejs'
      },
      {
        favIconUrl: 'https://github.githubassets.com/favicons/favicon-dark.svg',
        title: 'Forbidden · GitHub',
        url: 'https://github.com/'
      },
      {
        favIconUrl:
          'https://static-production.npmjs.com/b0f1a8318363185cc2ea6a40ac23eeb2.png',
        title: 'ejs - npm',
        url: 'https://www.npmjs.com/package/ejs'
      },
      {
        favIconUrl: 'https://github.githubassets.com/favicons/favicon-dark.svg',
        title:
          'GitHub - mde/ejs: Embedded JavaScript templates -- http://ejs.co',
        url: 'https://github.com/mde/ejs'
      },
      {
        favIconUrl: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico',
        title:
          '重磅！前端框架 styled-components 宣布停止维护，CSS-in-JS 时代终结？',
        url: 'https://mp.weixin.qq.com/s/55rkCJAirbIwtQPcRJoAMw'
      }
    ]
  }
])

// NOTE : 这里是模拟数据，打包时需要放开注释，从 Chrome 存储中获取

// onMounted(() => {
//   loadTabGroups()
// })

// // 加载标签组数据
// const loadTabGroups = async () => {
//   tabGroups.value = await getTabGroups()
// }

// 保存当前标签
const saveCurrentTabs = () => {
  chrome.runtime.sendMessage({ action: 'saveTabs' })
  // 延迟加载保存的标签组
  setTimeout(() => {
    this.loadTabGroups()
  }, 500)
}

// 恢复标签组
const restoreGroup = (groupIndex) => {
  const group = tabGroups.value[groupIndex]
  if (group) {
    group.tabs.forEach((tab) => {
      chrome.tabs.create({ url: tab.url })
    })
  }
}

// 删除标签组
const deleteGroup = async (groupIndex) => {
  const updatedGroups = [...tabGroups.value]
  updatedGroups.splice(groupIndex, 1)

  await saveTabGroups(updatedGroups)
  tabGroups.value = updatedGroups
}

// 删除单个标签
const deleteTab = async (groupIndex, tabIndex) => {
  const updatedGroups = [...tabGroups.value]

  if (updatedGroups[groupIndex]) {
    updatedGroups[groupIndex].tabs.splice(tabIndex, 1)

    // 如果组中没有标签了，删除整个组
    if (updatedGroups[groupIndex].tabs.length === 0) {
      updatedGroups.splice(groupIndex, 1)
    }

    await saveTabGroups(updatedGroups)
    tabGroups.value = updatedGroups
  }
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 添加重置存储功能
const resetStorage = async () => {
  if (
    confirm(
      '确定要重置所有保存的标签组数据吗？这将删除所有已保存的标签页信息！'
    )
  ) {
    await saveTabGroups([])
    tabGroups.value = []
    alert('数据已重置')
  }
}
</script>

<style scoped lang="scss">

.vh-tabs-group {
  padding: 20px;
  //display: grid;
  display: flex;
  flex-direction: row;
  gap: 20px;
  height: calc(100% - 40px);
}

.onetabs-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}


header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

h1 {
  margin: 0;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: #4285f4;
  color: white;
  font-weight: 500;
}

button:hover {
  background-color: #3367d6;
}

//.delete-btn {
//  background-color: #ea4335;
//}
//
//.delete-btn:hover {
//  background-color: #d33426;
//}

.tab-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-group {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.group-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.tab-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.tab-item {
  display: flex;
  align-items: center;
  //padding: 8px 0;
  //border-bottom: 1px solid #eee;
}

.tab-item:last-child {
  border-bottom: none;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 10px;
}

.tab-item a {
  flex: 1;
  color: #333;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-item a:hover {
  color: darkslategrey;
}

.delete-tab-btn {
  background: none;
  border: none;
  color: #9e9e9e;
  font-size: 18px;
  cursor: pointer;
  padding: 0 8px;
}

.delete-tab-btn:hover {
  color: #ea4335;
}

.empty-state {
  text-align: center;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  color: #5f6368;
  font-size: 16px;
}
</style>
