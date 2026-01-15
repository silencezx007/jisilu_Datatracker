/**
 * Bark 推送服务
 * 用于向 iOS 设备发送推送通知
 */

export interface BarkNotification {
  deviceKey: string;
  title: string;
  body: string;
  group?: string;
  icon?: string;
  sound?: string;
}

/**
 * 发送 Bark 推送通知
 * @param notification 推送内容
 * @returns 是否发送成功
 */
export async function sendBarkNotification(
  notification: BarkNotification
): Promise<boolean> {
  const { deviceKey, title, body, group, icon, sound } = notification;

  if (!deviceKey) {
    console.warn('[Bark] Device key is not configured');
    return false;
  }

  try {
    // 构造 Bark API URL
    // 格式: https://api.day.app/{deviceKey}/{title}/{body}?group={group}&icon={icon}&sound={sound}
    const encodedTitle = encodeURIComponent(title);
    const encodedBody = encodeURIComponent(body);
    let url = `https://api.day.app/${deviceKey}/${encodedTitle}/${encodedBody}`;

    // 添加可选参数
    const params = new URLSearchParams();
    if (group) params.append('group', group);
    if (icon) params.append('icon', icon);
    if (sound) params.append('sound', sound);

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    console.log('[Bark] Sending notification:', { title, body, url: url.replace(deviceKey, '***') });

    // 发送 GET 请求
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('[Bark] Failed to send notification:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('[Bark] Notification sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[Bark] Error sending notification:', error);
    return false;
  }
}

/**
 * 发送 LOF 套利机会推送
 * @param opportunities LOF 套利机会列表
 * @param deviceKey Bark Device Key
 * @returns 是否发送成功
 */
export async function sendLofOpportunityNotification(
  opportunities: Array<{ fundName: string; discountRate: number }>,
  deviceKey: string
): Promise<boolean> {
  if (opportunities.length === 0) {
    return false;
  }

  // 构造推送内容
  const title = `发现 ${opportunities.length} 个套利机会`;
  const body = opportunities
    .map((opp) => `${opp.fundName} 溢价${opp.discountRate.toFixed(2)}%`)
    .join('\n');

  return sendBarkNotification({
    deviceKey,
    title,
    body,
    group: 'LOF套利',
    icon: 'https://api.iconify.design/mdi:chart-line.svg',
    sound: 'bell',
  });
}
