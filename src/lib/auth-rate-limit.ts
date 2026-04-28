/**
 * @file auth-rate-limit.ts
 * @description Lightweight in-memory login throttling helpers for credentials sign-in.
 */

type LoginAttemptState = {
  failedAttempts: number;
  firstFailedAtMs: number;
  lockUntilMs: number;
};

type LoginRateLimitStatus = {
  isLocked: boolean;
  retryAfterMs: number;
};

/* Tracks failed login attempts for the current server process */
const loginAttemptStore = new Map<string, LoginAttemptState>();

/* Rate-limit settings keep brute-force attempts bounded without large UX impact */
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const LOGIN_BACKOFF_BASE_MS = 250;
const LOGIN_BACKOFF_MAX_MS = 2000;

/* Creates a stable rate-limit key from normalized email and caller IP */
export const createLoginAttemptKey = (email: string, ipAddress: string): string => {
  return `${email.trim().toLowerCase()}::${ipAddress}`;
};

/* Extracts best-effort client IP from forwarded headers for throttling context */
export const getRequestIpAddress = (request?: Request): string => {
  if (!request) {
    return "unknown";
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return "unknown";
};

/* Returns lock status and clears stale entries once failure windows expire */
export const getLoginRateLimitStatus = (attemptKey: string): LoginRateLimitStatus => {
  const state = loginAttemptStore.get(attemptKey);
  if (!state) {
    return { isLocked: false, retryAfterMs: 0 };
  }

  const now = Date.now();
  if (state.lockUntilMs > now) {
    return { isLocked: true, retryAfterMs: state.lockUntilMs - now };
  }

  if (now - state.firstFailedAtMs > LOGIN_FAILURE_WINDOW_MS) {
    loginAttemptStore.delete(attemptKey);
    return { isLocked: false, retryAfterMs: 0 };
  }

  return { isLocked: false, retryAfterMs: 0 };
};

/* Records one failed attempt and applies lockout after repeated failures */
export const registerLoginFailure = (attemptKey: string): void => {
  const now = Date.now();
  const currentState = loginAttemptStore.get(attemptKey);

  if (!currentState || now - currentState.firstFailedAtMs > LOGIN_FAILURE_WINDOW_MS) {
    loginAttemptStore.set(attemptKey, {
      failedAttempts: 1,
      firstFailedAtMs: now,
      lockUntilMs: 0,
    });
    return;
  }

  const nextFailedAttempts = currentState.failedAttempts + 1;
  const nextLockUntilMs =
    nextFailedAttempts >= LOGIN_MAX_FAILURES ? now + LOGIN_LOCKOUT_MS : 0;

  loginAttemptStore.set(attemptKey, {
    failedAttempts: nextFailedAttempts,
    firstFailedAtMs: currentState.firstFailedAtMs,
    lockUntilMs: nextLockUntilMs,
  });
};

/* Clears throttling state after a successful login for that key */
export const clearLoginFailures = (attemptKey: string): void => {
  loginAttemptStore.delete(attemptKey);
};

/* Adds a short progressive delay on failures to slow high-rate guessing */
export const applyLoginFailureBackoff = async (attemptKey: string): Promise<void> => {
  const state = loginAttemptStore.get(attemptKey);
  const failedAttempts = state?.failedAttempts ?? 0;
  const exponentialBackoffMs = LOGIN_BACKOFF_BASE_MS * 2 ** Math.max(0, failedAttempts - 1);
  const delayMs = Math.min(LOGIN_BACKOFF_MAX_MS, exponentialBackoffMs);

  await new Promise((resolve) => setTimeout(resolve, delayMs));
};
