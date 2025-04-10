/**
 * 从 Chrome 存储中获取数据
 * @param {string} key - 存储的键名
 * @returns {Promise<any>} 存储的数据
 */
export function chromeStorageGet(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(result)
      })
    } catch (error) {
      reject(error);
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
    try {
      chrome.storage.local.set({ [key]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve()
      })
    } catch (error) {
      reject(error);
    }
  })
}

/**
 * 从 Chrome 同步存储中获取数据
 * @param {string} key - 存储的键名
 * @returns {Promise<any>} 存储的数据
 */
export function chromeSyncStorageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (result) => {
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
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: data }, () => {
      resolve()
    })
  })
}
