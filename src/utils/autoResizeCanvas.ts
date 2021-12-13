export const autoResizeCanvas = (canvas: HTMLCanvasElement) => {
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const { width, height } = entry.contentRect;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
    });
  });

  resizeObserver.observe(canvas);

  return () => {
    resizeObserver.unobserve(canvas);
  };
};
