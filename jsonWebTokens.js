require('dotenv/config')

const { sign, verify, decode } = require('jsonwebtoken');

const createToken = (user) => {
  const accessToken = sign(
    { username: user.username, id: user.id },
    process.env.JSON_WEB_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return accessToken;
};

const validateToken = (req, res, next) => {
  const accessToken = req.cookies["access-token"]

  if(!accessToken)
    return res.status(400).json({ error: "User not logged in." })
    
  try {
    const validToken = verify(accessToken, process.env.JSON_WEB_TOKEN_SECRET,);

    if(validToken)
    {
      req.authenticated = true;

      const decodedToken = decode(accessToken);
      req.username = decodedToken.username;
      return next();
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
}

module.exports = { createToken, validateToken };