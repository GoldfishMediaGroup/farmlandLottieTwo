(function () {
  const cfg = {
    selector: '[data-tantum="true"]',
    videos: {
      "cloud": [
        "animations/cloud/1.webm",
        "animations/cloud/2.webm",
      ],
      "lottie": [
         "animations/lottie/jump.json",
      ],
      "coat": [
        "animations/coat/1.webm",
        "animations/coat/2.webm",
      ],
      "portal": [
        "animations/portal/1.webm",
        "animations/portal/2.webm",
      ],
      "january": [
        "animations/january/1.webm"
      ]
    },
    position: 'bottom-right',
    offset: '0 0',
    size: '60%',
    zIndex: 100,
    objectFit: 'contain',
    threshold: 0.8,
    preload: 'auto',
    DEBUG: false,
  };

  const overlayByCard = new WeakMap();
  const videoByCard = new WeakMap();
  const visible = new Set();
  let currentCard = null;
  let io = null;
  let mo = null;
  
  let currentAnimation = "january";
  let animationStep = 0;
  let waitingForNextCard = false;
  let lastUsedCard = null;
  let isFirstAnimation = true;

  function getRandomAnimation() {
    const animationNames = Object.keys(cfg.videos);
    return animationNames[Math.floor(Math.random() * animationNames.length)];
  }

  function getVideoSrc(animationName, step) {
    const animation = cfg.videos[animationName];
    return animation ? animation[step] : null;
  }

  function isCardActuallyVisible(card) {
    if (!card) return false;
    
    const rect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth
    );
    
    const isLargeEnough = rect.width > 50 && rect.height > 50;
    
    const style = getComputedStyle(card);
    const isNotHidden = (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
    
    return isInViewport && isLargeEnough && isNotHidden;
  }

  function parseSize(sizeStr) {
    const s = (sizeStr || '').trim();
    if (!s) return { w: '40%', h: null };
    if (s.includes('x')) {
      const [w, h] = s.split('x').map(t => t.trim());
      return { w: w || '40%', h: h || null };
    }
    return { w: s, h: null };
  }

  function applyAnchorAndOffset(el, position, offset) {
    const [ox, oy] = (offset || '0 0').split(/\s+/);
    el.style.top = el.style.right = el.style.bottom = el.style.left = '';
    el.style.transform = '';

    switch ((position || 'center').toLowerCase()) {
      case 'top-left':     el.style.top='0'; el.style.left='0'; break;
      case 'top-right':    el.style.top='0'; el.style.right='0'; break;
      case 'bottom-left':  el.style.bottom='0'; el.style.left='0'; break;
      case 'bottom-right': el.style.bottom='0'; el.style.right='0'; break;
      default:             el.style.top='50%'; el.style.left='50%'; el.style.transform='translate(-50%,-50%)'; break;
    }
    if (ox !== '0' || oy !== '0') {
      el.style.transform += ` translate(${ox},${oy})`;
    }
  }

  function ensureOverlay(card) {
    if (overlayByCard.has(card)) {
      const ov = overlayByCard.get(card);
      ov.style.display = 'block';
      return ov;
    }

    const cs = getComputedStyle(card);
    if (cs.position === 'static') {
      card.style.position = 'relative';
    }

    const ov = document.createElement('div');
    ov.style.position = 'absolute';
    ov.style.pointerEvents = 'none';
    ov.style.zIndex = String(cfg.zIndex);
    ov.style.contain = 'layout style paint';
    ov.style.display = 'block';

    const { w, h } = parseSize(cfg.size);
    ov.style.width = w;
    if (h) ov.style.height = h;

    applyAnchorAndOffset(ov, cfg.position, cfg.offset);

    card.appendChild(ov);
    overlayByCard.set(card, ov);
    return ov;
  }

  function ensureVideo(card) {
    const src = getVideoSrc(currentAnimation, animationStep);
    if (!src) return null;

    if (videoByCard.has(card)) {
      const existingVideo = videoByCard.get(card);
      if (existingVideo.src.endsWith(src)) return existingVideo;
      existingVideo.remove();
      videoByCard.delete(card);
    }

    const ov = ensureOverlay(card);
    ov.innerHTML = '';

    const v = document.createElement('video');
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.controls = false;
    v.loop = false;
    v.preload = cfg.preload;
    v.style.display = 'block';
    v.style.width = '100%';
    v.style.height = '100%';
    v.style.objectFit = cfg.objectFit;
    v.style.opacity = '1';
    v.style.visibility = 'visible';

    ov.appendChild(v);
    videoByCard.set(card, v);
    return v;
  }

  function stopCard(card) {
    const v = videoByCard.get(card);
    if (v) { try { v.pause(); } catch {} }
  }

  function hideCard(card) {
    const ov = overlayByCard.get(card);
    if (ov) ov.style.display = 'none';
  }

  function showCard(card) {
    const ov = overlayByCard.get(card);
    if (ov) ov.style.display = 'block';
  }

  async function playOn(card) {
    if (!card) return;
    if (!isCardActuallyVisible(card)) return;
    
    lastUsedCard = card;
    showCard(card);
    
    const v = ensureVideo(card);
    if (!v) return;

    currentCard = card;
    waitingForNextCard = false;
    
    const onEnd = () => {
      v.removeEventListener('ended', onEnd);
      
      if (isFirstAnimation) {
        isFirstAnimation = false;
        currentAnimation = getRandomAnimation();
      }
      
      animationStep++;
      if (animationStep >= cfg.videos[currentAnimation].length) {
        animationStep = 0;
        currentAnimation = getRandomAnimation();
      }
      
      currentCard = null;
      waitingForNextCard = true;
      hideCard(card);
      
      setTimeout(() => {
        const actuallyVisibleCards = [...visible].filter(candidateCard => 
          isCardActuallyVisible(candidateCard) && 
          candidateCard !== lastUsedCard
        );
        
        if (actuallyVisibleCards.length > 0) {
          const next = actuallyVisibleCards[Math.floor(Math.random() * actuallyVisibleCards.length)];
          playOn(next);
        } else {
          const fallbackCards = [...visible].filter(candidateCard => 
            isCardActuallyVisible(candidateCard)
          );
          if (fallbackCards.length > 0) {
            const next = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
            playOn(next);
          }
        }
      }, 100);
    };
    
    v.addEventListener('ended', onEnd, { once: true });

    if (!visible.has(card)) {
      v.removeEventListener('ended', onEnd);
      currentCard = null;
      return;
    }

    try { v.currentTime = 0; } catch {}
    if (v.readyState < 2) {
      try { await v.load(); } catch {}
    }

    try {
      await v.play();
    } catch (error) {
      onEnd();
    }
  }

  function recalcAndPlay() {
    if (visible.size === 0) {
      if (currentCard) {
        stopCard(currentCard);
        hideCard(currentCard);
        currentCard = null;
      }
      waitingForNextCard = false;
      return;
    }
    
    const actuallyVisibleCards = [...visible].filter(card => 
      isCardActuallyVisible(card)
    );
    
    if (waitingForNextCard && actuallyVisibleCards.length > 0 && !currentCard) {
      const availableCards = actuallyVisibleCards.filter(card => card !== lastUsedCard);
      let nextCard;
      if (availableCards.length > 0) {
        nextCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      } else {
        nextCard = actuallyVisibleCards[Math.floor(Math.random() * actuallyVisibleCards.length)];
      }
      playOn(nextCard);
      return;
    }
    
    if (!currentCard && actuallyVisibleCards.length > 0) {
      if (isFirstAnimation) {
        currentAnimation = "january";
        animationStep = 0;
      }
      const nextCard = actuallyVisibleCards[Math.floor(Math.random() * actuallyVisibleCards.length)];
      playOn(nextCard);
    }
  }

  function onIntersect(entries) {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= cfg.threshold) {
        if (!visible.has(e.target)) visible.add(e.target);
      } else {
        if (visible.has(e.target)) {
          if (currentCard === e.target) {
            stopCard(e.target);
            hideCard(e.target);
            currentCard = null;
          }
          visible.delete(e.target);
        }
      }
    });
    setTimeout(() => recalcAndPlay(), 50);
  }

  function initObserver() {
    if (io) io.disconnect();
    io = new IntersectionObserver(onIntersect, { 
      threshold: cfg.threshold,
      rootMargin: '10px'
    });
    const cards = document.querySelectorAll(cfg.selector);
    cards.forEach(c => io.observe(c));
  }

  function initMutations() {
    if (mo) mo.disconnect();
    mo = new MutationObserver(() => initObserver());
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  function fixCardZIndex() {
    const cards = document.querySelectorAll(cfg.selector);
    cards.forEach(card => {
      const selectors = [
        '.pi-title',
        '.pi-prices', 
        '.pi-firm',
        '.pi-image',
        '.add-favorite-product',
        '.actual-rate',
        '.favorite-product-container'
      ];
      selectors.forEach(selector => {
        const elements = card.querySelectorAll(selector);
        elements.forEach(el => {
          const style = getComputedStyle(el);
          if (style.position === 'static') el.style.position = 'relative';
          el.style.zIndex = (cfg.zIndex + 1).toString();
        });
      });
      const link = card.querySelector('a[href]');
      if (link) {
        const style = getComputedStyle(link);
        if (style.position === 'static') link.style.position = 'relative';
        link.style.zIndex = (cfg.zIndex + 1).toString();
      }
    });
  }

  function start() {
    initObserver();
    initMutations();
    fixCardZIndex();
    
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => recalcAndPlay(), 100);
    });
    
    window.addEventListener('resize', () => {
      setTimeout(() => recalcAndPlay(), 100);
    });
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (currentCard) stopCard(currentCard);
      } else {
        setTimeout(() => recalcAndPlay(), 100);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();