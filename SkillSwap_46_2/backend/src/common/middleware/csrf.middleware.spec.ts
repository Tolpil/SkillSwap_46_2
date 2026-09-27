import { Request, Response } from 'express';
import {
  createCsrfMiddleware,
  generateCsrfToken,
  tokensMatch,
  CSRF_COOKIE,
  CSRF_HEADER,
} from './csrf.middleware';

function createMockReqRes() {
  const headers: Record<string, string | undefined> = {};
  const cookies: Record<string, string | undefined> = {};

  const req = {
    method: 'POST',
    cookies,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;

  const res = {
    statusCode: 0,
    body: null,
    cookie(name: string, value: string) {
      cookies[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  } as unknown as Response & { statusCode: number; body: unknown };

  return { req, res, headers, cookies };
}

describe('tokensMatch', () => {
  it('returns true for equal tokens', () => {
    const token = generateCsrfToken();
    expect(tokensMatch(token, token)).toBe(true);
  });

  it('returns false when one of tokens is missing', () => {
    const token = generateCsrfToken();
    expect(tokensMatch(undefined, token)).toBe(false);
    expect(tokensMatch(token, undefined)).toBe(false);
  });

  it('returns false for different tokens', () => {
    expect(tokensMatch(generateCsrfToken(), generateCsrfToken())).toBe(false);
  });
});

describe('createCsrfMiddleware', () => {
  it('skips validation when disabled', () => {
    const { req, res } = createMockReqRes();
    const next = jest.fn();
    const middleware = createCsrfMiddleware(false);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows safe methods without a token', () => {
    const { req, res } = createMockReqRes();
    req.method = 'GET';
    const next = jest.fn();
    const middleware = createCsrfMiddleware(true);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects unsafe request without matching header', () => {
    const { req, res } = createMockReqRes();
    req.cookies[CSRF_COOKIE] = generateCsrfToken();
    const next = jest.fn();
    const middleware = createCsrfMiddleware(true);

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts unsafe request with matching header', () => {
    const { req, res, headers } = createMockReqRes();
    const token = generateCsrfToken();
    req.cookies[CSRF_COOKIE] = token;
    headers[CSRF_HEADER] = token;
    const next = jest.fn();
    const middleware = createCsrfMiddleware(true);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});