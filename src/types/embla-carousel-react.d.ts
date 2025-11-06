declare module 'embla-carousel-react' {
  import * as React from 'react';
  
  export interface EmblaCarouselType {
    canScrollPrev(): boolean;
    canScrollNext(): boolean;
    scrollPrev(): void;
    scrollNext(): void;
    on(event: string, callback: (api: EmblaCarouselType) => void): void;
    off(event: string, callback: (api: EmblaCarouselType) => void): void;
  }
  
  export type UseEmblaCarouselType = [
    React.RefObject<HTMLDivElement>,
    EmblaCarouselType | undefined
  ];
  
  export default function useEmblaCarousel(
    options?: any,
    plugins?: any[]
  ): UseEmblaCarouselType;
}



