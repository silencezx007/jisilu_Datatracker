import { describe, expect, it } from "vitest";
import { fetchLofData, filterLofData, monitorLofOpportunities } from "./jisiluService";

describe("Jisilu Service", () => {
  it("should fetch LOF data from Jisilu API", async () => {
    const data = await fetchLofData();
    
    expect(data).toBeDefined();
    expect(data.rows).toBeDefined();
    expect(Array.isArray(data.rows)).toBe(true);
    expect(data.rows.length).toBeGreaterThan(0);
    
    // 检查第一条数据的结构
    const firstRow = data.rows[0];
    expect(firstRow).toHaveProperty('id');
    expect(firstRow).toHaveProperty('cell');
    expect(firstRow.cell).toHaveProperty('fund_id');
    expect(firstRow.cell).toHaveProperty('fund_nm');
    expect(firstRow.cell).toHaveProperty('discount_rt');
    expect(firstRow.cell).toHaveProperty('apply_status');
  }, 15000); // 增加超时时间到 15 秒

  it("should filter LOF data correctly", async () => {
    const data = await fetchLofData();
    const filtered = filterLofData(data, 2.0);
    
    // 所有筛选出的基金应该满足条件
    for (const fund of filtered) {
      expect(fund.discountRate).toBeGreaterThan(2.0);
      expect(fund.applyStatus).toContain('限');
    }
    
    // 结果应该按溢价率降序排列
    for (let i = 0; i < filtered.length - 1; i++) {
      expect(filtered[i].discountRate).toBeGreaterThanOrEqual(filtered[i + 1].discountRate);
    }
  }, 15000);

  it("should complete full monitoring workflow", async () => {
    const opportunities = await monitorLofOpportunities(2.0);
    
    expect(Array.isArray(opportunities)).toBe(true);
    
    // 如果有结果，验证数据结构
    if (opportunities.length > 0) {
      const first = opportunities[0];
      expect(first).toHaveProperty('fundId');
      expect(first).toHaveProperty('fundName');
      expect(first).toHaveProperty('discountRate');
      expect(first).toHaveProperty('applyStatus');
      expect(first.discountRate).toBeGreaterThan(2.0);
      expect(first.applyStatus).toContain('限');
    }
  }, 15000);
});
