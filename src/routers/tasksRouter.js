const express = require('express')
const Task = require('../models/tasks')
const User = require('../models/users')
const auth = require('../middleware/auth')

const tasksRouter = express.Router()
// add a new task
tasksRouter.post('/tasks', auth, async (req, res) => {
    const user = req.user
    const task = Task({
        ...req.body,
        owner: user._id
    })

    try{
        res.send(await task.save())
    }catch(e){
        res.status(400).send('Invalid task object '+e)
    }
})

// get all tasks
tasksRouter.get('/tasks', auth, async (req, res) => {
    // const completed = req.query.completed === 'true'
    const match = {}

    const parts = req.query.sort.split(':')
    match[parts[0]] = parts[1] === 'desc'? -1: 1
    try{
        const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1})
        // .limit(parseInt(req.query.limit)).skip(parseInt(req.query.skip))
        if(tasks.length === 0){
            return res.status(404).send('Wow such empty')
        }
        res.send(tasks)
    }catch(e){
        res.status(500).send(''+e)
    }
})

// get task by id
tasksRouter.get('/tasks/:id', auth, async (req, res) =>{
    const _id = req.params.id

    try{
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send('No task found')
        }
        res.send(task)
    }catch(error){
        res.status(500).send(''+ error)
    }
})


// Update task by id
tasksRouter.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    var isAllowed = updates.every(attr => allowedUpdates.includes(attr))
    try{
        if(!isAllowed){
            throw Error('Invalid request. Task object does not have such values')
        }
        const task = await Task.findOne({ _id, owner: req.user._id})

        if(!task){
            return res.status(404).send("No task found")
        }
        updates.forEach(update => task[update] = req.body[update])
        await task.save()

        res.send(task)
    }catch(e){
        res.status(500).send(''+e)
    }
})



// delete task by id
tasksRouter.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try{
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id})
        if(!task){
            return res.status(404).send('No task found with such id')
        }
        res.send('Successfully deleted '+task)
    }catch(e){
        res.status(500).send(''+e)
    }
})

module.exports = tasksRouter