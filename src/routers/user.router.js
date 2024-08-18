const express = require('express')
const router = express.Router()
const passport = require('passport');
const userController = require('/Code/Web/IPDataStream/src/app/controllers/userController');
const { func } = require('/Code/Web/IPDataStream/src/config/db/connectDB');

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('dashboard')
    }
    next()
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/user/login')
}

function checkRole(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.redirect('/')
        }
        next()
    }
}


router.get('/login', checkAuthenticated, userController.login)
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            // console.error('Authentication error:', err);
            return next(err);
        }
        if (!user) {
            // console.log('Authentication failed:', info);
            return res.render('login', {
                errorMessage: info,
                email: req.body.email
            });
        }
        req.logIn(user, (err) => {
            
            if (user.role === 'admin') {
                return res.redirect('/user/dashboard/admin');
            }
            if (user.role === 'leader') {
                return res.redirect('/user/dashboard/leader');
            }
            if (user.role === 'editor') {
                return res.redirect('/user/dashboard/editor');
            }
            if (user.role === 'viewer') {
                return res.redirect('/user/dashboard/viewer');
            }
            if (err) {
                console.error('Login error:', err);
                return next(err);
            }
        });
    })(req, res, next);
});

router.use('/register', checkAuthenticated, userController.register)
router.get('/fogotPass', userController.fogotpass)
router.post('/dashboard/admin', checkNotAuthenticated, checkRole(['admin']), userController.admin);
router.post('/dashboard/leader', checkNotAuthenticated, checkRole(['leader']), userController.leader);
router.post('/dashboard/editor', checkNotAuthenticated, checkRole(['editor']), userController.editor);
router.post('/dashboard/viewer', checkNotAuthenticated, checkRole(['viewer']), userController.viewer);
router.get('/dashboard/admin', checkNotAuthenticated, checkRole(['admin']), userController.admin);
router.get('/dashboard/leader', checkNotAuthenticated, checkRole(['leader']), userController.leader);
router.get('/dashboard/editor', checkNotAuthenticated, checkRole(['editor']), userController.editor);
router.get('/dashboard/viewer', checkNotAuthenticated, checkRole(['viewer']), userController.viewer);
router.get('/logout', userController.logout)
module.exports = router
