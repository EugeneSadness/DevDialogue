const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
    if (req.method === "OPTIONS"){
        next()
    }
    try{
        const token = req.headers.authorization.split(' ')[1] 
        if(!token){
            res.status(401).json({message: "User is not authorized!"});
        }
        // Используем тот же секрет, что и в tokenService.js
        const decoded = jwt.verify(token, process.env.SECRETJWT || "random_secret");
        req.user = decoded;
        next();
    } catch (e){
        res.status(401).json({message: "User is not authorized!"});
    }
}