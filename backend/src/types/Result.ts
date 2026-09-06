type Result = 
  | { ok: true; data?: any }
  | { ok: false; error: string };

type AsyncResult = Promise<Result>;

export { 
    Result, 
    AsyncResult 
}