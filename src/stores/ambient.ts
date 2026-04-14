/** 动态背景色状态管理 — 从书籍封面提取主色 */
import { create } from "zustand";
import { FastAverageColor } from "fast-average-color";

interface AmbientState {
  /** 当前背景渐变色 (rgba) */
  color: string | null;
  /** 设置新颜色 */
  setColor: (color: string | null) => void;
}

export const useAmbientStore = create<AmbientState>()((set) => ({
  color: null,
  setColor: (color) => set({ color }),
}));

const fac = new FastAverageColor();

/** 从图片 URL 提取主色并更新 ambient store */
export async function extractAndSetColor(imgUrl: string) {
  try {
    const result = await fac.getColorAsync(imgUrl, {
      algorithm: "dominant",
      mode: "precision",
      ignoredColor: [
        [255, 255, 255, 255, 30], // 忽略白色
        [0, 0, 0, 255, 30],       // 忽略黑色
      ],
    });
    const [r, g, b] = result.value;
    useAmbientStore.getState().setColor(`${r}, ${g}, ${b}`);
  } catch {
    // 静默失败
  }
}
