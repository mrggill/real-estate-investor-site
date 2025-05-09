// src/components/SkipToContent.tsx
export default function SkipToContent() {
    return (
      
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Skip to content
      </a>
    );
  }