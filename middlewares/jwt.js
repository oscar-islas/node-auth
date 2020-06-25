const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  let token = req.headers.token;
  jwt.verify(token, "AcademloSecret", (error, decoded) => {
    if (!error) {
      req.user = decoded;
      next();
    } else {
      res.redirect('/login');
    }
  });
};

module.exports = verifyJWT;
