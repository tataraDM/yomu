/** page-flip 库的类型声明（该库未自带 .d.ts） */
declare module "page-flip" {
  export interface PageFlipOptions {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    startPage?: number;
  }

  export interface FlipEvent {
    data: number;
    object: PageFlip;
  }

  export interface ChangeStateEvent {
    data: string;
    object: PageFlip;
  }

  export class PageFlip {
    constructor(element: HTMLElement, options: PageFlipOptions);
    loadFromImages(images: string[]): void;
    loadFromHTML(elements: HTMLElement[]): void;
    updateFromImages(images: string[]): void;
    updateFromHtml(elements: HTMLElement[]): void;
    destroy(): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(pageIndex: number, corner?: "top" | "bottom"): void;
    turnToPage(pageIndex: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "landscape" | "portrait";
    getState(): string;
    on(event: "flip", callback: (e: FlipEvent) => void): PageFlip;
    on(event: "changeState", callback: (e: ChangeStateEvent) => void): PageFlip;
    on(event: "changeOrientation", callback: (e: { data: string; object: PageFlip }) => void): PageFlip;
    on(event: "init", callback: (e: { data: unknown; object: PageFlip }) => void): PageFlip;
    on(event: string, callback: (e: unknown) => void): PageFlip;
    off(event: string): void;
    update(): void;
  }
}
