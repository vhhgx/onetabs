/**
 * 存储管理器 - 处理大型数据的存储和检索
 */

// 分片大小 (500KB)
const CHUNK_SIZE = 500 * 1024;

/**
 * 将大型数据分片存储
 * @param {string} key 主键名
 * @param {any} data 要存储的数据
 * @returns {Promise<void>}
 */
export async function storeChunkedData(key, data) {
  try {
    const serializedData = JSON.stringify(data);
    const totalBytes = serializedData.length * 2; // 每个字符大约2字节
    
    console.log(`数据大小: ${formatSize(totalBytes)}`);
    
    if (totalBytes < CHUNK_SIZE) {
      // 数据小于分块大小，直接存储
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: data });
      } else {
        localStorage.setItem(`onetabs_${key}`, serializedData);
      }
      
      // 清理任何可能的旧分片
      await clearChunks(key);
      return;
    }
    
    // 数据较大，需要分片
    const chunks = [];
    const totalChunks = Math.ceil(serializedData.length / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, serializedData.length);
      const chunk = serializedData.substring(start, end);
      chunks.push(chunk);
    }
    
    // 存储元数据
    const metadata = {
      key,
      chunks: totalChunks,
      timestamp: Date.now(),
      totalSize: totalBytes
    };
    
    // 先存储元数据
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [`${key}_metadata`]: metadata });
      
      // 然后逐个存储分片
      for (let i = 0; i < chunks.length; i++) {
        await chrome.storage.local.set({ [`${key}_chunk_${i}`]: chunks[i] });
      }
      
      // 移除原始数据（如果存在）
      await chrome.storage.local.remove(key);
    } else {
      localStorage.setItem(`onetabs_${key}_metadata`, JSON.stringify(metadata));
      
      // 然后逐个存储分片
      for (let i = 0; i < chunks.length; i++) {
        localStorage.setItem(`onetabs_${key}_chunk_${i}`, chunks[i]);
      }
      
      // 移除原始数据（如果存在）
      localStorage.removeItem(`onetabs_${key}`);
    }
    
    console.log(`已分片存储数据 "${key}": ${totalChunks} 个分片，共 ${formatSize(totalBytes)}`);
  } catch (error) {
    console.error('分片存储失败:', error);
    throw error;
  }
}

/**
 * 从分片中检索大型数据
 * @param {string} key 主键名
 * @returns {Promise<any>} 检索到的数据
 */
export async function retrieveChunkedData(key) {
  try {
    // 首先尝试获取非分片数据
    let data;
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise(resolve => 
        chrome.storage.local.get(key, resolve)
      );
      data = result[key];
    } else {
      const serialized = localStorage.getItem(`onetabs_${key}`);
      data = serialized ? JSON.parse(serialized) : null;
    }
    
    if (data !== undefined && data !== null) {
      return data;
    }
    
    // 检查是否存在元数据
    let metadata;
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise(resolve => 
        chrome.storage.local.get(`${key}_metadata`, resolve)
      );
      metadata = result[`${key}_metadata`];
    } else {
      const serialized = localStorage.getItem(`onetabs_${key}_metadata`);
      metadata = serialized ? JSON.parse(serialized) : null;
    }
    
    if (!metadata) {
      // 没有找到数据
      return null;
    }
    
    // 检索所有分片
    const chunks = [];
    
    for (let i = 0; i < metadata.chunks; i++) {
      let chunk;
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await new Promise(resolve => 
          chrome.storage.local.get(`${key}_chunk_${i}`, resolve)
        );
        chunk = result[`${key}_chunk_${i}`];
      } else {
        chunk = localStorage.getItem(`onetabs_${key}_chunk_${i}`);
      }
      
      if (!chunk) {
        throw new Error(`无法检索分片 ${i}/${metadata.chunks}`);
      }
      
      chunks.push(chunk);
    }
    
    // 拼接所有分片并解析
    const serializedData = chunks.join('');
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('检索分片数据失败:', error);
    throw error;
  }
}

/**
 * 清理指定键的所有分片
 * @param {string} key 主键名
 */
async function clearChunks(key) {
  try {
    let metadata;
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise(resolve => 
        chrome.storage.local.get(`${key}_metadata`, resolve)
      );
      metadata = result[`${key}_metadata`];
      
      if (!metadata) return;
      
      // 移除所有分片
      const keysToRemove = [];
      for (let i = 0; i < metadata.chunks; i++) {
        keysToRemove.push(`${key}_chunk_${i}`);
      }
      
      // 移除元数据
      keysToRemove.push(`${key}_metadata`);
      
      await chrome.storage.local.remove(keysToRemove);
    } else {
      const serialized = localStorage.getItem(`onetabs_${key}_metadata`);
      metadata = serialized ? JSON.parse(serialized) : null;
      
      if (!metadata) return;
      
      // 移除所有分片
      for (let i = 0; i < metadata.chunks; i++) {
        localStorage.removeItem(`onetabs_${key}_chunk_${i}`);
      }
      
      // 移除元数据
      localStorage.removeItem(`onetabs_${key}_metadata`);
    }
    
    console.log(`已清理 "${key}" 的所有分片`);
  } catch (error) {
    console.error('清理分片失败:', error);
  }
}

/**
 * 格式化存储大小为友好显示
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 获取存储使用统计
 * @returns {Promise<{used: number, total: number, percent: number}>}
 */
export async function getStorageStats() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && chrome.storage.local.getBytesInUse) {
      const bytesInUse = await new Promise(resolve => 
        chrome.storage.local.getBytesInUse(null, resolve)
      );
      
      // Chrome 扩展本地存储一般有5MB限制
      const total = 5 * 1024 * 1024;
      
      return {
        used: bytesInUse,
        total: total,
        percent: (bytesInUse / total) * 100
      };
    } else {
      // 估算 localStorage 使用量
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += (localStorage[key].length * 2); // 每个字符约2字节
        }
      }
      
      // localStorage 一般限制为5MB左右
      const maxSize = 5 * 1024 * 1024;
      
      return {
        used: total,
        total: maxSize,
        percent: (total / maxSize) * 100
      };
    }
  } catch (error) {
    console.error('获取存储统计失败:', error);
    return { used: 0, total: 5 * 1024 * 1024, percent: 0 };
  }
}
