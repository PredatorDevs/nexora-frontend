import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/dom';

configure({ asyncUtilTimeout: 5_000 });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

const browserGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (element) => browserGetComputedStyle(element);
