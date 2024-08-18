const LocalStrategy = require('passport-local').Strategy
const { isMatch } = require('picomatch')
const db = require('/Code/Web/IPDataStream/src/config/db/connectDB')
const bcrypt = require('bcrypt')

function initialize(passport) {
    const autheticateUser = async (email, password, done) => {
        try {
            let result = await db.one(`select * from "user" where email = $1`, [email])

            if (result) {
                const user = result

                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) {
                        throw err
                    }
                    if(isMatch) {
                        return done(null, user)
                    } else {
                        return done(null, false, {passErr: '*Sai mật khẩu'})
                    }
                })
            } else {
                return done(null, false, {emailErr: '*Email chưa được đăng ký'})
            }
        } catch (err) {
            console.error('Error runing database query: ', err)
            return done(null, false, {emailErr: '*Email chưa được đăng ký'})
        }
    }
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password'
            },
            autheticateUser
        )
    )

    passport.serializeUser((user, done) => done(null, user.email))

    passport.deserializeUser((email, done) => {
        try {
            db.oneOrNone('select * from "user" where email = $1', [email])
                .then(user => {
                    done(null, user)
                })
                .catch(err => {
                    done(err)
                })
        } catch (err) {
            done(err)
        }
    })
}

module.exports = initialize