// src/utils/promiseAny.ts
(global as any).promiseAny = async function <T>(promises: Promise<T>[]): Promise<T> {
  const errors = await Promise.allSettled(promises);
  const rejected = errors.filter(e => e.status === "rejected");
  if (rejected.length === promises.length) {
    throw rejected[0].reason;
  }
  for (const result of errors) {
    if (result.status === "fulfilled") return result.value;
  }
  throw new Error("Unhandled error in promiseAny");
};
