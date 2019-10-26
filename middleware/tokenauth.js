const jwt = require("jsonwebtoken");
const config = require("config");

const tokenauth = (req, res, next) => {
    // get token from req header 
    const token = req.header("x-auth-token");

    // check if no token
    if (!token) {
        return res.status(401).json("no token, authorization denied");
    } 

    // verify token 
    try {
        // extract user id, attach to request  
        const payload = jwt.verify(token, config.get("tokenSecret"));
        req.user = payload.user; 
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).json("server error");
    }
}; 

module.exports = tokenauth; 