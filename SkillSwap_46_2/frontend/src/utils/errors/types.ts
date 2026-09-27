export type Error = {
  code: string;
  path: string;
  statusCode: number;
  timestamp: Date;
  message?: string | string[];
};

export interface ErrorResponse {
  message: string;
  errorCode: string;
  originalError: Error;
}
