/* =========================================================
   weather/js/02-api.js
   天气模块前端请求引擎 (只和 Cloudflare Worker 通信)
   ========================================================= */

/**
 * 请求完整天气数据（Worker 已经处理好了文字排版和缓存）
 * @param {string} cityId 城市 ID (如 101010100)
 * @param {string} cityName 城市名称 (如 北京)
 * @returns {Promise<object>} 返回包含 ai_text 和 fromCache 的对象
 */
async function getWeatherReport(cityId, cityName) {
  try {
    // 1. 拼接请求参数，向 Worker 发起请求
    const url = `${WORKER_API_URL}?cityId=${encodeURIComponent(cityId)}&cityName=${encodeURIComponent(cityName)}`;
    
    console.log(`[天气系统] 正在向云端代理请求【${cityName}】的数据...`);
    
    // 2. 发送网络请求
    const response = await fetch(url);
    
    // 3. 检查网络响应状态
    if (!response.ok) {
      throw new Error(`网络请求失败，状态码: ${response.status}`);
    }
    
    // 4. 解析 JSON 数据
    const result = await response.json();
    
    // 5. 检查业务逻辑是否报错（比如和风天气接口挂了，Worker 会返回 error 字段）
    if (result.error) {
      throw new Error(result.error);
    }

    // 6. 打印日志，方便你在控制台观察是否走了缓存
    if (result.fromCache) {
      console.log(`[天气系统] ✅ 命中云端缓存，秒开！`);
    } else {
      console.log(`[天气系统] 🚀 首次请求，Worker 刚刚调用和风+AI 生成完毕！`);
    }

    // 7. 返回最终结果给 UI 渲染使用
    return {
      cityName: cityName,
      ai_text: result.ai_text, // ★ 这就是 AI 按照长图排版生成的一整段纯文本
      fromCache: result.fromCache
    };

  } catch (error) {
    console.error('❌ 获取天气数据失败:', error);
    // 将错误抛给上一层（03-ui.js）去展示友好的提示
    throw error; 
  }
}