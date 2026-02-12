/**
 * Generates a unique ID with an optional prefix.
 * Uses a combination of timestamp and random string.
 *
 * @param prefix - Optional prefix for the ID (default: 'id')
 * @returns A unique string ID
 */
export const generateUniqueId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${random}`;
};
