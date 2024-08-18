const homeRouter = require('./home.router')
const searchPageRouter = require('./searchPage.router')
const searchResultRouter = require('./searchResult.router')
const userRouter = require('./user.router')

function route(app) {
    
    app.use('/user', userRouter)
    app.use('/trademark', searchResultRouter)
    app.use('/searchPage', searchPageRouter)
    app.use('/', homeRouter)
}

module.exports = route