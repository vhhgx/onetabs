/**
 * 判断当前环境是否为Chrome扩展环境
 * @returns {boolean} 是否在Chrome扩展中运行
 */
export function isExtensionEnvironment() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
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
        const item = localStorage.getItem(`onetabs_${key}`);
        resolve(item ? JSON.parse(item) : {});
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(result);
      });
    } catch (error) {
      reject(error);
    }
  });
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
        localStorage.setItem(`onetabs_${key}`, JSON.stringify(data));
        resolve();
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    try {
      chrome.storage.local.set({ [key]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
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
        const item = localStorage.getItem(`onetabs_sync_${key}`);
        resolve(item ? JSON.parse(item) : {});
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    chrome.storage.sync.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(result);
    });
  });
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
        localStorage.setItem(`onetabs_sync_${key}`, JSON.stringify(data));
        resolve();
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    chrome.storage.sync.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
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
        const item = localStorage.getItem(`onetabs_${key}`);
        resolve(item ? JSON.parse(item) : null);
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(result[key]);
    });
  });
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
        localStorage.setItem(`onetabs_${key}`, JSON.stringify(value));
        resolve();
      } catch (error) {
        reject(error);
      }
      return;
    }
    
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

/**
 * 获取标签组数据
 * @returns {Promise<Array>} 标签组数组
 */
export async function getTabGroups() {
  const tabGroups = await getFromStorage('tabGroups');
  return Array.isArray(tabGroups) ? tabGroups : [];
}

/**
 * 保存标签组数据
 * @param {Array} tabGroups 标签组数组
 * @returns {Promise<void>}
 */
export function saveTabGroups(tabGroups) {
  return setToStorage('tabGroups', tabGroups);
}
