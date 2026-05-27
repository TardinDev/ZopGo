// Loaded by Jest after the test framework boots — adds the React Testing
// Library DOM matchers (toBeInTheDocument, toHaveClass, toHaveAttribute, ...)
// so component tests can assert on rendered output expressively.
import "@testing-library/jest-dom";

// Stub window.matchMedia (Ant Design's responsive utilities query it on
// mount and jsdom doesn't ship an implementation — every component test
// would otherwise throw "TypeError: window.matchMedia is not a function").
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }),
});
