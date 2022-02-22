const User = require('../models/users')
const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
    try{
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token})
        if(!user){
            throw Error()
        }
        req.token = token
        req.user = user
        next()
    }catch(e){
        res.status(400).send('Authentication is required...')
    }
    
}

module.exports = auth