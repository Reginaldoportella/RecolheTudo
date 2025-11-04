const validationOptions = {
  abortEarly: false,
  convert: true,
  stripUnknown: true,
};

function buildError(joiError) {
  const error = new Error('Dados inválidos.');
  error.statusCode = 400;
  error.details = joiError.details.map((detail) => detail.message);
  return error;
}

export default function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        const { value, error } = schemas.body.validate(req.body, validationOptions);
        if (error) {
          throw buildError(error);
        }
        req.body = value;
      }

      if (schemas.params) {
        const { value, error } = schemas.params.validate(req.params, validationOptions);
        if (error) {
          throw buildError(error);
        }
        req.params = value;
      }

      if (schemas.query) {
        const { value, error } = schemas.query.validate(req.query, validationOptions);
        if (error) {
          throw buildError(error);
        }
        req.query = value;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
