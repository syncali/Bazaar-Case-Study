const basicAuth = require("basic-auth");

module.exports = (req, res, next) => {
  const user = basicAuth(req);

  const validUsername = process.env.BASIC_AUTH_USERNAME || "admin";
  const validPassword = process.env.BASIC_AUTH_PASSWORD || "password";

  if (!user || user.name !== validUsername || user.pass !== validPassword) {
    res.set("WWW-Authenticate", 'Basic realm="Bazaar API"');
    return res.status(401).send("Authentication required.");
  }

  next();
};
