import { Defer } from "./interfaces";

export class ResourceLoader<T> {
  static retryTimes = 0;
  count = 0;
  dataMap: Record<string, T> = {};
  deferMap: Record<string, Defer<T>> = {};

  constructor() {
    this.afterReady();
  }

  afterReady() {
    this.count > 0 && this.count--;
    if (!this.count) {
      // console.warn("All resources have been loaded.");
    }
  }

  load(
    id: string,
    genPromise: (retry: number) => Promise<T>,
    handleError?: (err: any) => any
  ) {
    let defer = this.deferMap[id];

    if (!defer || defer.status === "rejected") {
      let retry = 0;

      const loadOnce = async (): Promise<T> => {
        try {
          const res = await genPromise(retry);
          defer.status = "fulfilled";
          this.afterReady();
          this.dataMap[id] = res;
          return Promise.resolve(res);
        } catch (err) {
          retry++;
          if (retry <= ResourceLoader.retryTimes) {
            console.warn(`The ${retry}'th retry to get ${id}.`);
            return loadOnce();
          }
          defer.status = "rejected";
          this.afterReady();
          return handleError ? handleError(err) : Promise.reject(err);
        }
      };

      this.count++;

      defer = {
        status: "pending",
        promise: loadOnce(),
      };

      this.deferMap[id] = defer;
    }
    return defer.promise;
  }

  clear() {
    this.count = 0;
    this.dataMap = {};
    this.deferMap = {};
  }
}
