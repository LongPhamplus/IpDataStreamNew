const express = require('express')
const { engine } = require('express-handlebars')
const session = require('express-session');
const morgan = require('morgan')
const route = require('./routers') 
const initializePassport = require('./config/passportConfig')
const path = require('path')
const passport = require('passport')

const app = express()
const port = 3000



// Cấu hình session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))

// Cấu hình passport
initializePassport(passport)
app.use(passport.initialize());
app.use(passport.session());

function checkLoginStatus(req, res, next) {
    res.locals.login = req.isAuthenticated(); // Kiểm tra xem người dùng có đăng nhập hay không
    if (req.isAuthenticated()) {
        res.locals.role = req.user.role
        res.locals.name = req.user.name; // Lưu tên người dùng vào res.locals
    }
    next();
}
app.use(checkLoginStatus)

app.use(express.urlencoded({
    extended: true
}))
app.use(express.json())

app.use(morgan('combined'))
app.engine('hbs', engine({
    extname: '.hbs'
}))
// Template engine
app.set('view engine', 'hbs')
// saving static file
app.use(express.static(path.join(__dirname, '/public')))

app.set('views', path.join(__dirname, 'resources/views'))

route(app)

app.listen(port, function() {
    console.log(`http://localhost:${port}`)
})