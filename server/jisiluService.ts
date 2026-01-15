import axios from 'axios';

/**
 * 集思录 LOF 基金数据接口响应类型
 */
export interface JisiluLofData {
  fund_id: string;
  fund_nm: string;
  price: string;
  discount_rt: string;
  apply_status: string;
  fund_nav: string;
  estimate_value: string;
  stock_ratio?: string;
  issuer_nm: string;
}

export interface JisiluApiResponse {
  page: number;
  rows: Array<{
    id: string;
    cell: JisiluLofData;
  }>;
}

/**
 * 筛选后的 LOF 基金数据
 */
export interface FilteredLofData {
  fundId: string;
  fundName: string;
  price: number | null;
  discountRate: number;
  applyStatus: string;
  fundNav: number | null;
  estimateValue: number | null;
  stockRatio: number | null;
  issuerName: string | null;
}

/**
 * 从集思录 API 获取单个类型的 LOF 基金数据
 */
async function fetchLofDataByType(url: string, type: string): Promise<JisiluApiResponse> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://www.jisilu.cn/data/lof/',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  
  try {
    const response = await axios.post<JisiluApiResponse>(url, {}, {
      headers,
      timeout: 10000
    });
    
    console.log(`[JisiluService] Fetched ${response.data.rows?.length || 0} ${type} LOF funds`);
    return response.data;
  } catch (error) {
    console.error(`[JisiluService] Failed to fetch ${type} LOF data:`, error);
    throw new Error(`Failed to fetch ${type} LOF data from Jisilu`);
  }
}

/**
 * 从 QDII API 获取 LOF 基金数据（过滤出LOF类型）
 */
async function fetchQdiiLofData(): Promise<JisiluApiResponse> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://www.jisilu.cn/data/qdii/',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  
  try {
    const response = await axios.post<JisiluApiResponse>('https://www.jisilu.cn/data/qdii/qdii_list/', {}, {
      headers,
      timeout: 10000
    });
    
    // 过滤出 LOF 类型的基金（fund_nm 包含 "LOF"）
    const lofRows = response.data.rows.filter(row => {
      const fundName = row.cell.fund_nm || '';
      return fundName.includes('LOF');
    });
    
    console.log(`[JisiluService] Fetched ${lofRows.length} QDII LOF funds (from ${response.data.rows.length} total QDII)`);
    
    return {
      page: response.data.page,
      rows: lofRows,
    };
  } catch (error) {
    console.error(`[JisiluService] Failed to fetch QDII LOF data:`, error);
    throw new Error('Failed to fetch QDII LOF data from Jisilu');
  }
}

/**
 * 从集思录 API 获取所有 LOF 基金数据（股票LOF + 指数LOF + QDII LOF）
 */
export async function fetchLofData(): Promise<JisiluApiResponse> {
  try {
    // 同时获取三个数据源
    const [stockData, indexData, qdiiData] = await Promise.all([
      fetchLofDataByType('https://www.jisilu.cn/data/lof/stock_lof_list/', '股票'),
      fetchLofDataByType('https://www.jisilu.cn/data/lof/index_lof_list/', '指数'),
      fetchQdiiLofData(),
    ]);
    
    // 合并三个数据源
    const allRows = [...stockData.rows, ...indexData.rows, ...qdiiData.rows];
    
    console.log(`[JisiluService] Total fetched ${allRows.length} LOF funds (股票: ${stockData.rows.length}, 指数: ${indexData.rows.length}, QDII: ${qdiiData.rows.length})`);
    
    return {
      page: 1,
      rows: allRows,
    };
  } catch (error) {
    console.error('[JisiluService] Failed to fetch LOF data:', error);
    throw new Error('Failed to fetch LOF data from Jisilu');
  }
}

/**
 * 筛选符合条件的 LOF 基金
 * 条件：溢价率 > discountThreshold% 且申购状态包含'限'字
 */
export function filterLofData(
  data: JisiluApiResponse,
  discountThreshold: number = 2.0
): FilteredLofData[] {
  const filtered: FilteredLofData[] = [];
  
  for (const row of data.rows) {
    const cell = row.cell;
    
    // 解析溢价率
    const discountRate = parseFloat(cell.discount_rt);
    
    // 检查溢价率是否大于阈值
    if (isNaN(discountRate) || discountRate <= discountThreshold) {
      continue;
    }
    
    // 检查申购状态是否包含'限'字
    if (!cell.apply_status || !cell.apply_status.includes('限')) {
      continue;
    }
    
    // 符合条件，添加到结果
    filtered.push({
      fundId: cell.fund_id,
      fundName: cell.fund_nm,
      price: cell.price ? parseFloat(cell.price) : null,
      discountRate: discountRate,
      applyStatus: cell.apply_status,
      fundNav: cell.fund_nav ? parseFloat(cell.fund_nav) : null,
      estimateValue: cell.estimate_value ? parseFloat(cell.estimate_value) : null,
      stockRatio: cell.stock_ratio ? parseFloat(cell.stock_ratio) : null,
      issuerName: cell.issuer_nm || null,
    });
  }
  
  // 按溢价率降序排序
  filtered.sort((a, b) => b.discountRate - a.discountRate);
  
  return filtered;
}

/**
 * 执行完整的监控流程：获取数据并筛选
 */
export async function monitorLofOpportunities(
  discountThreshold: number = 2.0
): Promise<FilteredLofData[]> {
  console.log('[JisiluService] Starting LOF monitoring...');
  
  const data = await fetchLofData();
  console.log(`[JisiluService] Fetched ${data.rows.length} total LOF funds`);
  
  const filtered = filterLofData(data, discountThreshold);
  console.log(`[JisiluService] Found ${filtered.length} opportunities (溢价率 > ${discountThreshold}% 且限购)`);
  
  return filtered;
}
