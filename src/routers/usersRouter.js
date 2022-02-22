const express = require('express')
const User = require('../models/users')
const auth = require('../middleware/auth')
const sharp = require('sharp')

// configuring multer for file upload
const multer = require('multer')
const upload = multer({ 
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(Error('Please upload an image with png, jpg or jpeg extensions.'))
        }
        cb(undefined, true)
    }
})

const usersRouter = express.Router()

// create a new user
usersRouter.post('/users', async (req, res) => {
    const user = await User(req.body)
    try{
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send('Invalid user object '+e)
    }
})

// get user profile
usersRouter.get('/users/me', auth, (req, res) =>  {
    if(!req.user){
        return res.status(400).send('Login to access user profile')
    }
    res.send(req.user)
})

// update user
usersRouter.patch('/users/me', auth, async (req, res) => {
    const user = req.user
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const updates = Object.keys(req.body)
    var isAllowed = updates.every(attr => allowedUpdates.includes(attr))
    try{
        if(!isAllowed){
            throw Error('Invalid request. User object does not have such values')
        }
        
        updates.forEach(attr => {user[attr] = req.body[attr]})
        await user.save()
        res.send(user)
    }catch(e){
        res.status(500).send('Invalid request params ' + e)
    }
})

// upload user profile avatar
usersRouter.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, 
(error, req, res, next) => {
    res.status(400).send({ error: error.message})
})

// get user avatar by id
usersRouter.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw Error('ko0')
        }
        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    }catch(e){
        res.status(400).send({e})
    }
})

// delete user profile avatar
usersRouter.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send('Profile avatar delete successfully.')
}, 
(error, req, res, next) => {
    res.status(400).send({ error: error.message})
})

// logout a single user
usersRouter.post('/users/logout', auth, (req, res) => {
    const user = req.user
    if(!user){
        return res.status(401).send('Unauthorized access...')
    }
    user.tokens = user.tokens.filter(token => token.token !== req.token)
    user.save()
    res.send('User logged out successfully')
})

// logout all signed in users
usersRouter.post('/users/logoutAll', auth, (req,res) => {
    const user = req.user
    if(!user){
        return res.status(401).send('Unauthorized access...')
    }
    user.tokens = []
    user.save()
    res.send('Successfully booted all the MFs out')
})

// login user 
usersRouter.post('/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        if(!user){
            return res.send(404).send()
        }
        res.send({user, token})
    }catch(e){
        res.status(400).send(''+e)
    }
})

// delete user
usersRouter.delete('/users/me', auth, async(req, res) => {
    try{
        await req.user.remove()
        res.send('deleted user successfully ')
    }catch(e){
        res.send(''+e)
    }
})

module.exports = usersRouter