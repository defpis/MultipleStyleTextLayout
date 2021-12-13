import { clamp } from "lodash";
import { Transform, translate, scale } from "./const";

document.body.addEventListener("wheel", (ev) => ev.preventDefault(), {
  passive: false,
});

export const zoom = (
  target: HTMLElement,
  onChange?: (translate: Transform, scale: Transform) => void
) => {
  const offset = { x: 0, y: 0 };

  const onWheel = (ev: WheelEvent) => {
    ev.preventDefault();

    if (ev.ctrlKey || ev.metaKey) {
      offset.x = (ev.x - translate.x) / scale.x;
      offset.y = (ev.y - translate.y) / scale.y;

      const changeRatio = clamp(1 - ev.deltaY / 20, 1 / 2, 2);

      scale.x *= changeRatio;
      scale.y *= changeRatio;

      translate.x = ev.x - offset.x * scale.x;
      translate.y = ev.y - offset.y * scale.y;
    } else {
      translate.x -= ev.deltaX;
      translate.y -= ev.deltaY;
    }

    onChange && onChange(translate, scale);
  };

  target.addEventListener("wheel", onWheel);

  return () => {
    target.removeEventListener("wheel", onWheel);
  };
};
