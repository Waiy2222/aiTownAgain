export function validateDescriptionIndex(
  index: number,
  poolSize: number,
): string | null {
  if (index < 0 || index >= poolSize) {
    return `无效的角色索引: ${index}（共 ${poolSize} 个角色）`;
  }
  return null;
}
