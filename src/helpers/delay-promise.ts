export function delayPromise<T>(promise: Promise<T>, timeout: number) {
  return new Promise(resolve => {
    setTimeout(async () => {
      const data = await promise;

      resolve(data);
    }, timeout);
  });
}
