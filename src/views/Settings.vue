<template>
  <div class="settings-container">
    <h1>设置</h1>
    
    <div class="settings-section">
      <h2>同步设置</h2>
      <label>
        <input type="checkbox" v-model="syncEnabled" @change="saveSyncSettings"> 启用云同步
      </label>
      
      <div v-if="syncEnabled" class="sync-options">
        <h3>同步账号</h3>
        <div v-if="!isLoggedIn">
          <input type="email" v-model="email" placeholder="邮箱">
          <input type="password" v-model="password" placeholder="密码">
          <button @click="login">登录</button>
          <button @click="register">注册</button>
        </div>
        <div v-else>
          <p>已登录为: {{ userEmail }}</p>
          <button @click="logout">退出登录</button>
          <button @click="syncNow">立即同步</button>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h2>显示设置</h2>
      <label>
        <input type="checkbox" v-model="darkMode" @change="saveDisplaySettings"> 深色模式
      </label>
      <label>
        <input type="checkbox" v-model="showFavicons" @change="saveDisplaySettings"> 显示网站图标
      </label>
    </div>
    
    <div class="settings-section">
      <h2>数据管理</h2>
      <button @click="exportData" class="export-btn">导出数据</button>
      <input type="file" @change="importData" ref="importFile" style="display:none">
      <button @click="triggerImport" class="import-btn">导入数据</button>
      <button @click="clearData" class="clear-btn">清除所有数据</button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onActivated, onDeactivated } from 'vue'
import { useTabsStore } from '../stores/tabsStore'

// 检查是否在Chrome扩展环境中
const isChromeExtension = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// 获取适当的存储API
const getStorageApi = () => {
  if (isChromeExtension()) {
    return chrome.storage.sync;
  }
  
  // 在非扩展环境中使用localStorage模拟chrome.storage.sync API
  return {
    get: (keys, callback) => {
      try {
        const result = {};
        if (typeof keys === 'string') {
          result[keys] = JSON.parse(localStorage.getItem('settings_' + keys) || 'null');
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = JSON.parse(localStorage.getItem('settings_' + key) || 'null');
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            const value = localStorage.getItem('settings_' + key);
            result[key] = value !== null ? JSON.parse(value) : keys[key];
          });
        }
        callback(result);
      } catch (error) {
        console.error('模拟存储读取错误:', error);
        callback({});
      }
    },
    set: (items, callback) => {
      try {
        Object.keys(items).forEach(key => {
          localStorage.setItem('settings_' + key, JSON.stringify(items[key]));
        });
        if (callback) callback();
      } catch (error) {
        console.error('模拟存储写入错误:', error);
        if (callback) callback(error);
      }
    },
    remove: (keys, callback) => {
      try {
        if (typeof keys === 'string') {
          localStorage.removeItem('settings_' + keys);
        } else if (Array.isArray(keys)) {
          keys.forEach(key => localStorage.removeItem('settings_' + key));
        }
        if (callback) callback();
      } catch (error) {
        console.error('模拟存储删除错误:', error);
        if (callback) callback(error);
      }
    }
  };
};

export default defineComponent({
  name: 'SettingsView',
  
  setup() {
    const tabsStore = useTabsStore();
    const storageApi = getStorageApi();
    const syncEnabled = ref(false);
    const darkMode = ref(false);
    const showFavicons = ref(true);
    const isLoggedIn = ref(false);
    const userEmail = ref('');
    const email = ref('');
    const password = ref('');
    const importFile = ref(null);
    const isDev = ref(process.env.NODE_ENV === 'development');
    
    onMounted(() => {
      // 从存储加载设置
      storageApi.get(['syncEnabled', 'darkMode', 'showFavicons', 'userInfo'], (data) => {
        syncEnabled.value = data.syncEnabled || false;
        darkMode.value = data.darkMode || false;
        showFavicons.value = data.showFavicons !== false; // 默认为true
        
        if (data.userInfo && data.userInfo.email) {
          isLoggedIn.value = true;
          userEmail.value = data.userInfo.email;
        }
        
        // 应用深色模式
        if (darkMode.value) {
          document.body.classList.add('dark-theme');
        }
      });
    });
    
    onActivated(() => {
      console.log('设置页面被激活');
      // 可以在这里重新获取最新数据
    });
    
    onDeactivated(() => {
      console.log('设置页面被停用');
      // 可以在这里清理资源
    });
    
    const saveSyncSettings = () => {
      storageApi.set({ syncEnabled: syncEnabled.value });
    };
    
    const saveDisplaySettings = () => {
      storageApi.set({ 
        darkMode: darkMode.value,
        showFavicons: showFavicons.value
      });
      
      if (darkMode.value) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    };
    
    const login = async () => {
      if (!email.value || !password.value) {
        alert('请输入邮箱和密码');
        return;
      }
      
      try {
        // 这里应该调用实际的登录API
        // const response = await apiService.login(email.value, password.value);
        
        // 模拟登录成功
        const mockUserInfo = {
          email: email.value,
          token: 'mock-token-' + Date.now()
        };
        
        storageApi.set({ userInfo: mockUserInfo });
        isLoggedIn.value = true;
        userEmail.value = email.value;
        
        // 清空表单
        email.value = '';
        password.value = '';
        
        alert('登录成功');
      } catch (error) {
        alert('登录失败: ' + error.message);
      }
    };
    
    const register = async () => {
      // 注册逻辑，类似login
      alert('注册功能尚未实现');
    };
    
    const logout = () => {
      storageApi.remove('userInfo', () => {
        isLoggedIn.value = false;
        userEmail.value = '';
      });
    };
    
    const syncNow = async () => {
      try {
        // 这里应该调用实际的同步API
        // await tabsStore.syncWithCloud();
        alert('同步成功');
      } catch (error) {
        alert('同步失败: ' + error.message);
      }
    };
    
    const exportData = async () => {
      try {
        const data = await tabsStore.getAllData();
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'onetabs_backup_' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出失败: ' + (error.message || '未知错误'));
      }
    };
    
    const triggerImport = () => {
      importFile.value.click();
    };
    
    const importData = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await tabsStore.importData(data);
          alert('数据导入成功');
        } catch (error) {
          alert('导入失败: ' + error.message);
        }
      };
      reader.readAsText(file);
      
      // 重置文件输入以便再次导入
      event.target.value = null;
    };
    
    const clearData = () => {
      if (confirm('确定要删除所有已保存的标签页数据吗？此操作无法撤销。')) {
        // 检查方法存在再调用
        if (typeof tabsStore.clearAllData === 'function') {
          tabsStore.clearAllData();
          alert('所有数据已清除');
        } else {
          console.error('clearAllData 方法未实现');
          alert('清除数据功能尚未实现');
        }
      }
    };
    
    return {
      syncEnabled,
      darkMode,
      showFavicons,
      isLoggedIn,
      userEmail,
      email,
      password,
      importFile,
      saveSyncSettings,
      saveDisplaySettings,
      login,
      register,
      logout,
      syncNow,
      exportData,
      triggerImport,
      importData,
      clearData,
      isDev
    };
  }
})
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  border-bottom: none;
}

h2 {
  color: #333;
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 10px;
}

input[type="checkbox"] {
  margin-right: 8px;
}

input[type="email"],
input[type="password"] {
  padding: 8px;
  margin-right: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sync-options {
  margin-top: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.clear-btn {
  background-color: #ea4335;
}

.import-btn,
.export-btn {
  background-color: #34a853;
  margin-right: 10px;
}
</style>
