// utils/layoutUtils.ts
import { useEffect, useRef, useCallback, useState } from 'react';

// ===== TYPES =====
export interface MasonryConfig {
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  itemSelector?: string;
  breakpoints?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface GridLayoutConfig {
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  minItemWidth?: number;
  alignItems?: 'start' | 'center' | 'stretch' | 'end';
}

// ===== DEFAULT CONFIGS =====
const DEFAULT_MASONRY_CONFIG: Required<MasonryConfig> = {
  columns: {
    default: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 3,
  },
  gap: 24,
  itemSelector: '.masonry-item',
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

const DEFAULT_GRID_CONFIG: Required<GridLayoutConfig> = {
  columns: {
    default: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 3,
  },
  gap: 24,
  minItemWidth: 350,
  alignItems: 'start',
};

// ===== UTILITY FUNCTIONS =====
export const getCurrentBreakpoint = (width: number, breakpoints: MasonryConfig['breakpoints']) => {
  if (!breakpoints) return 'default';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'default';
};

export const getColumnsForBreakpoint = (
  columns: MasonryConfig['columns'] | GridLayoutConfig['columns'],
  breakpoint: string
): number => {
  if (!columns) return 1;
  return columns[breakpoint as keyof typeof columns] || columns.default || 1;
};

// ===== MASONRY HOOK =====
export const useMasonryLayout = (config: MasonryConfig = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLayoutComplete, setIsLayoutComplete] = useState(false);
  
  const finalConfig = { ...DEFAULT_MASONRY_CONFIG, ...config };

  const applyMasonryLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll(finalConfig.itemSelector);
    if (items.length === 0) return;

    // Get current breakpoint
    const containerWidth = container.offsetWidth;
    const breakpoint = getCurrentBreakpoint(containerWidth, finalConfig.breakpoints);
    const columnCount = getColumnsForBreakpoint(finalConfig.columns, breakpoint);

    // Reset container styles
    container.style.position = 'relative';
    
    // Initialize column heights
    const columnHeights = new Array(columnCount).fill(0);
    const columnWidth = (containerWidth - (finalConfig.gap * (columnCount - 1))) / columnCount;

    items.forEach((item, index) => {
      const element = item as HTMLElement;
      
      // Reset styles first
      element.style.position = 'absolute';
      element.style.width = `${columnWidth}px`;
      element.style.transition = 'all 0.3s ease';
      
      // Find shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Position element
      element.style.left = `${shortestColumnIndex * (columnWidth + finalConfig.gap)}px`;
      element.style.top = `${columnHeights[shortestColumnIndex]}px`;
      
      // Update column height
      const elementHeight = element.offsetHeight;
      columnHeights[shortestColumnIndex] += elementHeight + finalConfig.gap;
    });

    // Set container height
    const maxHeight = Math.max(...columnHeights) - finalConfig.gap;
    container.style.height = `${maxHeight}px`;
    
    setIsLayoutComplete(true);
  }, [finalConfig]);

  // Apply layout on mount and when dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(applyMasonryLayout, 100);
    return () => clearTimeout(timeoutId);
  }, [applyMasonryLayout]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsLayoutComplete(false);
      const timeoutId = setTimeout(applyMasonryLayout, 100);
      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyMasonryLayout]);

  return {
    containerRef,
    isLayoutComplete,
    refresh: applyMasonryLayout,
  };
};

// ===== GRID UTILITIES =====
export const generateGridClasses = (config: GridLayoutConfig = {}): string => {
  const finalConfig = { ...DEFAULT_GRID_CONFIG, ...config };
  
  const baseClasses = [
    'grid',
    'w-full',
    `gap-${Math.floor(finalConfig.gap / 4)}`, // Convert px to Tailwind spacing
    `items-${finalConfig.alignItems}`,
  ];

  // Generate responsive column classes
  const columnClasses: string[] = [];
  
  if (finalConfig.columns.default) {
    columnClasses.push(`grid-cols-${finalConfig.columns.default}`);
  }
  
  if (finalConfig.columns.sm) {
    columnClasses.push(`sm:grid-cols-${finalConfig.columns.sm}`);
  }
  
  if (finalConfig.columns.md) {
    columnClasses.push(`md:grid-cols-${finalConfig.columns.md}`);
  }
  
  if (finalConfig.columns.lg) {
    columnClasses.push(`lg:grid-cols-${finalConfig.columns.lg}`);
  }
  
  if (finalConfig.columns.xl) {
    columnClasses.push(`xl:grid-cols-${finalConfig.columns.xl}`);
  }

  return [...baseClasses, ...columnClasses].join(' ');
};

export const generateAutoFitGridStyle = (config: GridLayoutConfig = {}): React.CSSProperties => {
  const finalConfig = { ...DEFAULT_GRID_CONFIG, ...config };
  
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${finalConfig.minItemWidth}px, 1fr))`,
    gap: `${finalConfig.gap}px`,
    alignItems: finalConfig.alignItems,
    width: '100%',
  };
};

// ===== CSS COLUMNS UTILITIES =====
export const generateColumnsClasses = (config: GridLayoutConfig = {}): string => {
  const finalConfig = { ...DEFAULT_GRID_CONFIG, ...config };
  
  const baseClasses = [
    'w-full',
    `gap-${Math.floor(finalConfig.gap / 4)}`,
  ];

  const columnClasses: string[] = [];
  
  if (finalConfig.columns.default) {
    columnClasses.push(`columns-${finalConfig.columns.default}`);
  }
  
  if (finalConfig.columns.sm) {
    columnClasses.push(`sm:columns-${finalConfig.columns.sm}`);
  }
  
  if (finalConfig.columns.md) {
    columnClasses.push(`md:columns-${finalConfig.columns.md}`);
  }
  
  if (finalConfig.columns.lg) {
    columnClasses.push(`lg:columns-${finalConfig.columns.lg}`);
  }
  
  if (finalConfig.columns.xl) {
    columnClasses.push(`xl:columns-${finalConfig.columns.xl}`);
  }

  return [...baseClasses, ...columnClasses].join(' ');
};

// ===== PREBUILT CONFIGURATIONS =====
export const LAYOUT_PRESETS = {
  // Standard responsive grid
  responsiveGrid: {
    columns: { default: 1, md: 2, xl: 3 },
    gap: 24,
    alignItems: 'start' as const,
  },
  
  // Dense grid for cards
  denseGrid: {
    columns: { default: 1, sm: 2, md: 3, lg: 4, xl: 5 },
    gap: 16,
    alignItems: 'start' as const,
  },
  
  // Masonry for varied content
  contentMasonry: {
    columns: { default: 1, md: 2, lg: 3, xl: 3 },
    gap: 24,
    itemSelector: '.masonry-item',
  },
  
  // Auto-fit grid
  autoFitGrid: {
    minItemWidth: 350,
    gap: 24,
    alignItems: 'start' as const,
  },
} as const;

// ===== COMPONENT HELPERS =====
export const GridContainer: React.FC<{
  children: React.ReactNode;
  config?: GridLayoutConfig;
  className?: string;
  useAutoFit?: boolean;
}> = ({ children, config = {}, className = '', useAutoFit = false }) => {
  const style = useAutoFit ? generateAutoFitGridStyle(config) : undefined;
  const classes = useAutoFit ? '' : generateGridClasses(config);
  
  return (
    <div 
     className={( `w-full ${className}` ).trim()}
      style={style}
    >
      {children}
    </div>
  );
};

export const MasonryContainer: React.FC<{
  children: React.ReactNode;
  config?: MasonryConfig;
  className?: string;
  showLoader?: boolean;
}> = ({ children, config = {}, className = '', showLoader = false }) => {
  const { containerRef, isLayoutComplete } = useMasonryLayout(config);
  
  return (
    <div className="relative">
      {showLoader && !isLayoutComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div 
        ref={containerRef}
        className={`w-full ${className}`.trim()}
        style={{ opacity: isLayoutComplete ? 1 : 0.7 }}
      >
        {children}
      </div>
    </div>
  );
};

export const ColumnsContainer: React.FC<{
  children: React.ReactNode;
  config?: GridLayoutConfig;
  className?: string;
}> = ({ children, config = {}, className = '' }) => {
  const classes = generateColumnsClasses(config);
  const finalConfig = { ...DEFAULT_GRID_CONFIG, ...config };
  
  return (
    <div 
      className={`${classes} ${className}`.trim()}
      style={{ columnGap: `${finalConfig.gap}px` }}
    >
      {children}
    </div>
  );
};