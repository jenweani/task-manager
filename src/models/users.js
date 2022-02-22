// import libs
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/tasks')
const { Schema } = mongoose

// user schema
const userSchema = Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        validate(address){
            if(!validator.isEmail(address)){
                throw Error('Wrong email format')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true,
        validate(pass){
            if(pass.toLowerCase().includes('password')){
                throw Error("Password shouldn't contain the word 'password'.")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
    },
    tokens: [
        {
            token:{
                type: String,
                required: true
            }
        }
    ], 
    avatar: {
        type: Buffer
    }
},
{
    timestamps: true
})

// create relationship with the Task object model
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner',
})

// get public profile
userSchema.methods.toJSON = function(){
    let user = this
    let userObj = user.toObject()
    delete userObj.password
    delete userObj.tokens
    delete userObj.avatar
    return userObj
}

// generate auth token for a session
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET_KEY, {expiresIn: "7d"})
    user.tokens = user.tokens.concat([{ token }])
    await user.save()

    return token
}

// find user using email and password
userSchema.statics.findByCredentials = async (email, password) =>{
    const user = await User.findOne({ email })
    if(!user){
        throw Error('User not found')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw Error('User not found')
    }
    return user
}


// Hash the plain text password before saving using the middleware pre hook for userSchema
try{
    userSchema.pre('save', async function (next) {
        const user = this
        if(user.isModified('password')){
            user.password = await bcrypt.hash(user.password, 8)
        }
        next()
    })
}catch(e){
        console.log('err '+ e)
}

// delete all task for user that has been removed
userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({ owner: user._id})
    next()
})

// Create User Model
const User = mongoose.model('User', userSchema)

module.exports = User