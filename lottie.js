// ============================
// КОНФИГУРАЦИЯ
// ============================
const config = {
  wrapperSelector: ".wrapper",
  // Разные пути для разных устройств
  animationPaths: {
    desktop: "./animations/lottie/skateDesk.json",
    mobile: "./animations/lottie/skateMob.json", // Укажи здесь путь к мобильному лотти
  },
  dimensions: {
    desktop: {
      width: "100vw",
      height: "100vh",
      bottom: "0",
    },
    mobile: {
      width: "100vw",
      height: "auto", // Например, половина экрана для мобилки
      bottom: "15%", // Можно приподнять
    },
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

  delays: {
    containerAppearance: 500,
    animationStart: 500,
  },
};

// ============================
// ОСНОВНОЙ СКРИПТ
// ============================

document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.querySelector(config.wrapperSelector);
  if (!wrapper) return;

  // 1. Определяем тип устройства один раз
  const isMobile = window.innerWidth <= 768;

  // 2. Выбираем путь и размеры
  const animationPath = isMobile
    ? config.animationPaths.mobile
    : config.animationPaths.desktop;
  const currentDimensions = isMobile
    ? config.dimensions.mobile
    : config.dimensions.desktop;

  const lottieContainer = document.createElement("div");
  lottieContainer.className = "lottie-mascot-fullscreen";

  // 3. Смешиваем общие стили и специфичные для устройства
  Object.assign(lottieContainer.style, {
    opacity: "0",
    transition: "opacity 0.3s ease-in",
    ...config.animationStyles,
    ...currentDimensions, // Применяем ширину/высоту здесь
  });

  setTimeout(() => {
    wrapper.appendChild(lottieContainer);

    setTimeout(() => {
      // Используем уже определенный путь
      initLottie(lottieContainer, animationPath);
    }, config.delays.animationStart);
  }, config.delays.containerAppearance);

  function initLottie(container, path) {
    if (!container) return;

    if (typeof lottie === "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
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
        preserveAspectRatio: "xMidYMid slice",
      },
    });

    animation.addEventListener("DOMLoaded", () => {
      container.style.opacity = "1";
    });

    return animation;
  }
});
