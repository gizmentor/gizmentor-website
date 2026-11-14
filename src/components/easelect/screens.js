import homeImg from '../../assets/easelect/easelect-home.webp';
import questionImg from '../../assets/easelect/easelect-question.webp';
import productImg from '../../assets/easelect/easelect-product.webp';
import pricesImg from '../../assets/easelect/easelect-prices.webp';
import compareImg from '../../assets/easelect/easelect-compare.webp';
import sourcesImg from '../../assets/easelect/easelect-sources.webp';

/**
 * Real Easelect app screens from the current app (demo mode, UAE, November 2026), 640px wide.
 * question, sources and compare are cropped to the part the journey shows. Alt text lives in content.easelect.screens.
 */
export const screens = {
  home: { src: homeImg, w: 640, h: 1385 },
  question: { src: questionImg, w: 640, h: 747 },
  product: { src: productImg, w: 640, h: 1385 },
  prices: { src: pricesImg, w: 640, h: 1385 },
  compare: { src: compareImg, w: 640, h: 747 },
  sources: { src: sourcesImg, w: 640, h: 747 },
};
