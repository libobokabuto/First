import type { FormatAdapter } from '../model/types';
import { FileFormatEnum } from '../model/types';

/**
 * 格式适配器注册表
 * 统一管理所有格式的适配器实例
 */
const adapterMap = new Map<FileFormatEnum, FormatAdapter>();

/**
 * 创建并配置适配器注册表
 * 在应用启动时调用，注册所有可用的适配器
 */
export function createAdapterRegistry(adapters: FormatAdapter[]): void {
  for (const adapter of adapters) {
    adapterMap.set(adapter.format, adapter);
  }
}

/**
 * 根据文件扩展名获取对应的适配器
 * @param fileName 文件名（含扩展名）
 * @returns 匹配的适配器，未找到返回 null
 */
export function getAdapterForFile(fileName: string): FormatAdapter | null {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  for (const adapter of adapterMap.values()) {
    if (adapter.extensions.includes(ext)) {
      return adapter;
    }
  }
  return null;
}

/**
 * 根据格式枚举获取适配器
 */
export function getAdapter(format: FileFormatEnum): FormatAdapter | null {
  return adapterMap.get(format) ?? null;
}

/**
 * 获取所有已注册的适配器
 */
export function getAllAdapters(): FormatAdapter[] {
  return Array.from(adapterMap.values());
}
