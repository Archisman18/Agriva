// easeInOutCubic easing for smooth acceleration and deceleration
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

let activeAnimationId: number | null = null;

export function scrollToSection(
  targetId: string,
  offset?: number,
  duration: number = 800
): void {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  // Cancel any running scroll animation to prevent fighting/jitter
  if (activeAnimationId !== null) {
    cancelAnimationFrame(activeAnimationId);
    activeAnimationId = null;
  }

  // Calculate destination
  const navHeight =
    offset !== undefined
      ? offset
      : document.querySelector('nav.landing-nav')?.clientHeight || 0;

  const startPosition = window.pageYOffset || document.documentElement.scrollTop;
  const targetRect = targetElement.getBoundingClientRect();
  const targetPosition = targetRect.top + startPosition - navHeight;
  const distance = targetPosition - startPosition;

  // If already at or very close to destination, trigger highlight directly
  if (Math.abs(distance) < 5) {
    triggerSectionHighlight(targetElement);
    return;
  }

  let startTime: number | null = null;

  function step(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const easeProgress = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * easeProgress);

    if (timeElapsed < duration) {
      activeAnimationId = requestAnimationFrame(step);
    } else {
      window.scrollTo(0, targetPosition);
      activeAnimationId = null;
      const el = document.getElementById(targetId);
      if (el) {
        triggerSectionHighlight(el);
      }
    }
  }

  activeAnimationId = requestAnimationFrame(step);
}

function triggerSectionHighlight(targetElement: HTMLElement) {
  const titleH1 = targetElement.querySelector('.title h1') as HTMLElement | null;
  if (titleH1) {
    titleH1.classList.remove('section-highlight');
    // Force reflow to allow re-triggering animation
    void titleH1.offsetWidth;
    titleH1.classList.add('section-highlight');
    setTimeout(() => {
      titleH1.classList.remove('section-highlight');
    }, 700);
  }
}
