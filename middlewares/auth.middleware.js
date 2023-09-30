"use strict"
const userModel = require('../models/user.model');
const authService = require('../services/auth.service');

exports.loggedIn = async (req, res, next) => {
    try {
        if (!req.cookies?.['Authorization']) return res.redirect(`..${process.env.adminPath}/login`);

        let token = req.cookies['Authorization'];
        let user = await authService.checkAuth(token);

        if (!user) throw new Error('User not found!');

        res.locals.profile = user;
        next();
    } catch (err) {
        console.log(err);
        return res.clearCookie('Authorization').redirect(`..${process.env.adminPath}/login`);
    }
}

exports.isAuth = async (req, res, next) => {
    try {
        if (!req.cookies?.['Authorization']) return next();

        let token = req.cookies['Authorization'];
        let user = await authService.checkAuth(token);

        if (!user) throw new Error('User not found!');

        res.locals.profile = user;
        res.redirect(`..${process.env.adminPath}`);
    } catch (err) {
        console.log(err);
        res.clearCookie('Authorization');
        return next();
    }
}

exports.isAdmin = async (req, res, next) => {
    try {
        if (!req.cookies?.['Authorization'] && !req.headers.token) {
            return res.json({
                success: false,
                message: 'Không có quyền truy cập!'
            })
        }

        if (req.headers.token) {
            let user = await userModel.findOne({ token: req.headers.token });

            if (!user) {
                res.clearCookie('Authorization').json({ success: false, message: 'Không có quyền truy cập!' });
                return;
            }

            res.locals.profile = user;
            return next()
        }

        let token = req.cookies['Authorization'];
        let user = await authService.checkAuth(token);

        if (!user) throw new Error('User not found!');

        res.locals.profile = user;
        next();
    } catch (err) {
        console.log(err);
        return res.clearCookie('Authorization').json({ success: false, message: 'Không có quyền truy cập!' })
    }
}
exports.isAdm1n = async (req, res, next) => {
    try {
        let user = ' '
        if (!req.cookies?.['Authorization'] && !req.headers.token) {

            res.locals.profile = user;
            return next()
        }

        if (req.headers.token) {
            let user = await userModel.findOne({ token: req.headers.token });

            if (!user) {

                res.locals.profile = user;
                return next()
            }

            res.locals.profile = user;
            return next()
        }

        let token = ' ';


        res.locals.profile = user;
        next();
    } catch (err) {
        console.log(err);
        res.locals.profile = user;
        next();
    }
}