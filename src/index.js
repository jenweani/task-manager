const express = require('express')

require('./db/mongoose.js')

//setting core variables
const port = process.env.PORT
const app = express()

app.use(express.json())

// Maintainance mode
// app.use((req, res, next) => {
//     res.status(503).send('We are currently maintaining our site.')
// })

//Setting up Endpoints
const usersRouter = require('./routers/usersRouter')
const tasksRouter = require('./routers/tasksRouter')

app.use(usersRouter)
app.use(tasksRouter)


//Firing up the express webserver
app.listen(port, ()=>{console.log('listening on port '+ port)})