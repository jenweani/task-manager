const mongoose = require('mongoose')
const validator = require('validator')
const { Schema } = mongoose

// task schema 
const taskSchema = Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
}
)

const Task = mongoose.model('Task', taskSchema)
module.exports = Task