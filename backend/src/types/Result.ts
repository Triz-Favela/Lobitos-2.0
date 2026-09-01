type Result<T = void> = 
  | { ok: true; data?: T }
  | { ok: false; error: string };

type AsyncResult<T = void> = Promise<Result<T>>;

export { 
    Result, 
    AsyncResult 
}