const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  let token = req.headers.token;
  jwt.verify(token, "AcademloSecret", (error, decoded) => {
    if (!error) {
      next();
    } else {
      res.json({
        message: "El token es invalido"
      });
    }
  });
};

module.exports = verifyJWT;
