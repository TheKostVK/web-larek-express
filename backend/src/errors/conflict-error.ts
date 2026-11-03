export default class ConflictError extends Error {
  statusCode = 409;
}
