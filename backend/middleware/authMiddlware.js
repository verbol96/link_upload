const jwt = require('jsonwebtoken') 

module.exports  = (req,res,next) =>{
    const authorizationHeader = req.headers.authorization;
    
    const token = authorizationHeader.split(' ')[1]
    
    try {
        const data = jwt.verify(token, process.env.ACCESS_KEY)
        req.user = data
    } catch (error) {
        console.log('error token in middleware')
        return res.status(401).json('error')
    }
    
    return next()
}