// ============================
// КОНФИГУРАЦИЯ
// ============================
const config = {
  wrapperSelector: ".wrapper",
  // Разные пути для разных устройств
  animationPaths: {
    desktop: "./animations/lottie/skateDesk.json",
    mobile: "./animations/lottie/skateMob.json" // Укажи здесь путь к мобильному лотти
  },

  animationStyles: {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "100vw",
    // height: "100vh",
    zIndex: "1001",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    aspectRatio: 16/9,
  },
  
  delays: {
    containerAppearance: 500,
    animationStart: 500
  }
};

// ============================
// ОСНОВНОЙ СКРИПТ
// ============================

document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.querySelector(config.wrapperSelector);
  if (!wrapper) return;

  // Функция определения пути в зависимости от ширины экрана
  function getPath() {
    const isMobile = window.innerWidth <= 768;
    return isMobile ? config.animationPaths.mobile : config.animationPaths.desktop;
  }

  const lottieContainer = document.createElement("div");
  lottieContainer.className = "lottie-mascot-fullscreen";
  
  Object.assign(lottieContainer.style, {
    opacity: "0",
    transition: "opacity 0.3s ease-in",
    ...config.animationStyles,
  });

  setTimeout(() => {
    wrapper.appendChild(lottieContainer);

    setTimeout(() => {
      // Передаем правильный путь при инициализации
      initLottie(lottieContainer, getPath());
    }, config.delays.animationStart);
  }, config.delays.containerAppearance);

  function initLottie(container, path) {
    if (!container) return;
    
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
      loop: true,
      autoplay: true,
      path: path,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice" 
      }
    });

    animation.addEventListener("DOMLoaded", () => {
      container.style.opacity = "1";
    });
    
    return animation;
  }
});