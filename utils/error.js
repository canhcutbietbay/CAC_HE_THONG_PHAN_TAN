class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const asyncHandlerError = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(err => next(err));
    }
}

const ErrInternalServer = new CustomError('Something went wrong, please try again later.', 500);
const ErrInvalidRequest = new CustomError('Invalid request', 400);
const ErrUnauthorized = new CustomError('Unauthorized', 401);
const ErrForbidden = new CustomError('Forbidden', 403);
const ErrNotFound = new CustomError('Not found', 404);
const ErrMethodNotAllowed = new CustomError('Method not allowed', 405);
const ErrTokenInvalid = new CustomError('Token is invalid', 401);

export {
    asyncHandlerError,
    CustomError, ErrInternalServer, ErrInvalidRequest, ErrUnauthorized, ErrForbidden, ErrNotFound, ErrMethodNotAllowed, ErrTokenInvalid
}