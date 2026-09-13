import { useEffect, useRef } from 'react';

/**
 * Adds a 'revealed' class to observed elements when they enter the viewport.
 * Elements must have the class 'reveal' on them.
 *
 * @param {string} selector - CSS selector for elements to observe (default '.reveal')
 * @param {number} threshold - IntersectionObserver threshold (default 0.15)
 */
export function useScrollReveal(selector = '.reveal', threshold = 0.15) {
  useEffect(() => {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector, threshold]);
}

/**
 * Returns a ref that adds 'revealed' class when the element enters the viewport.
 */
export function useRevealRef() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}
