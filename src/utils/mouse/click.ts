let timer: any = null;
let times: number = 0;

export const click = async (callbacks: Record<number, () => void>) => {
  times++;

  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    callbacks[times] && callbacks[times]();
    times = 0;
  }, 250);
};
