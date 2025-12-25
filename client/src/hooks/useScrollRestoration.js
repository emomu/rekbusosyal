import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Session storage based scroll restoration
 * Saves and restores scroll position when navigating back to a page
 */
const scrollPositions = new Map();

export function useScrollRestoration(scrollableElementRef) {
  const location = useLocation();
  const isRestoringRef = useRef(false);

  useEffect(() => {
    const element = scrollableElementRef?.current || window;
    const scrollKey = location.key || location.pathname;

    // Restore scroll position when coming back to a page
    const savedPosition = scrollPositions.get(scrollKey);

    if (savedPosition !== undefined && !isRestoringRef.current) {
      isRestoringRef.current = true;

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (element === window) {
            window.scrollTo(0, savedPosition);
          } else {
            element.scrollTop = savedPosition;
          }
          isRestoringRef.current = false;
        });
      });
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      const currentPosition = element === window
        ? window.scrollY
        : element.scrollTop;

      scrollPositions.set(scrollKey, currentPosition);
    };

    // Add scroll listener
    if (element === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Cleanup
    return () => {
      if (element === window) {
        window.removeEventListener('scroll', handleScroll);
      } else {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [location.key, location.pathname, scrollableElementRef]);
}

/**
 * Simple version that scrolls to top on route change
 * Use this for pages where you always want to start at the top
 */
export function useScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
}
