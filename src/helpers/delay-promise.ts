export function delayPromise<T>(promise: () => Promise<T>, timeout: number) {
  return new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const data = await promise();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    }, timeout);
  });
}
