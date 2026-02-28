import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addBrowsingHistory } from "@/db/api";

/**
 * 通用的浏览记录Hook
 * 自动记录用户浏览行为，仅在用户登录时记录
 * 
 * @param contentType - 内容类型：article, product, video, download, question
 * @param contentId - 内容ID
 * @param contentTitle - 内容标题
 * @param enabled - 是否启用记录（默认true）
 */
export function useRecordBrowsing(
  contentType: string,
  contentId: string | undefined,
  contentTitle: string | undefined,
  enabled: boolean = true
) {
  const { user } = useAuth();
  const recordedRef = useRef(false);

  useEffect(() => {
    // 只在以下条件都满足时记录：
    // 1. 启用记录
    // 2. 用户已登录
    // 3. 有内容ID和标题
    // 4. 还未记录过（防止重复记录）
    if (
      enabled &&
      user &&
      contentId &&
      contentTitle &&
      !recordedRef.current
    ) {
      // 延迟记录，确保用户真的在浏览内容
      const timer = setTimeout(() => {
        addBrowsingHistory(user.id, contentType, contentId, contentTitle)
          .then(() => {
            console.log(`浏览记录已添加: ${contentType} - ${contentTitle}`);
            recordedRef.current = true;
          })
          .catch((error) => {
            console.error("添加浏览记录失败:", error);
          });
      }, 2000); // 2秒后记录，确保用户真的在浏览

      return () => clearTimeout(timer);
    }
  }, [enabled, user, contentType, contentId, contentTitle]);
}
