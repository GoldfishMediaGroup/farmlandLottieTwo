// ============================
// КОНФИГУРАЦИЯ
// ============================
const config = {
  wrapperSelector: ".wrapper",
  animationPaths: {
    desktop: "./animations/lottie/skateDesk.json",
    mobile: "./animations/lottie/skateMob.json",
  },
  dimensions: {
    desktop: { width: "100vw", height: "100vh", bottom: "0" },
    mobile: { width: "100vw", height: "auto", bottom: "15%" },
  },
  animationStyles: {
    position: "fixed",
    left: "0",
    zIndex: "1001",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Настройки пауз
  pauseBetweenLoops: 5000, // 5 секунд между повторами
};

// ============================
// ОСНОВНОЙ СКРИПТ
// ============================

document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.querySelector(config.wrapperSelector);
  if (!wrapper) return;

  const isMobile = window.innerWidth <= 768;
  const animationPath = isMobile ? config.animationPaths.mobile : config.animationPaths.desktop;
  const currentDimensions = isMobile ? config.dimensions.mobile : config.dimensions.desktop;

  const lottieContainer = document.createElement("div");
  lottieContainer.className = "lottie-mascot-fullscreen";

  Object.assign(lottieContainer.style, {
    opacity: "0",
    transition: "opacity 0.3s ease-in",
    ...config.animationStyles,
    ...currentDimensions,
  });

  wrapper.appendChild(lottieContainer);
  initLottie(lottieContainer, animationPath);

  function initLottie(container, path) {
    if (typeof lottie === "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
      script.onload = () => loadAnimation(container, path);
      document.head.appendChild(script);
    } else {
      loadAnimation(container, path);
    }
  }

  function loadAnimation(container, path) {
    const animation = lottie.loadAnimation({
      container: container,
      renderer: "svg",
      loop: false, // Отключаем стандартный цикл, будем запускать вручную
      autoplay: false, // Отключаем автостарт
      path: path,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    });

    animation.addEventListener("DOMLoaded", () => {
      container.style.opacity = "1";
      
      // Рассчитываем длительность анимации в мс
      const duration = (animation.totalFrames / animation.frameRate) * 1000;
      
      // ПЕРВАЯ ПАУЗА: длиной в саму анимацию перед первым стартом
      setTimeout(() => {
        animation.goToAndPlay(0, true);
      }, 1000);
    });

    // СОБЫТИЕ ЗАВЕРШЕНИЯ: пауза 5 сек перед следующим кругом
    animation.addEventListener("complete", () => {
      setTimeout(() => {
        animation.goToAndPlay(0, true);
      }, config.pauseBetweenLoops);
    });

    return animation;
  }
});