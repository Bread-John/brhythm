class ApplicationError extends Error {
    constructor(message) {
        super(message);

        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}

class UserFacingError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.name = this.constructor.name;
        this.status = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    ApplicationError,
    UserFacingError
};
