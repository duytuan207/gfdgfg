const moment = require('moment');
const momoHelper = require('../helpers/momo.helper');
const telegramHelper = require('../helpers/telegram.helper');

const momoController = {
    otp: async (req, res, next) => {
        try {
            let { phone, password } = req.body;

            if (!phone || !password) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            if (!res.locals.profile.permission.addNew) {
                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            res.json(await momoHelper.sendOTP(phone, password));
        } catch (err) {
            next(err);
        }
    },
    confirm: async (req, res, next) => {
        try {
            let { phone, otp } = req.body;

            if (!phone || !otp) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            res.json(await momoHelper.confirmOTP(phone, otp));
        } catch (err) {
            next(err);
        }
    },
    login: async (req, res, next) => {
        try {
            let phone = req.body.phone;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            res.json(await momoHelper.login(phone));
        } catch (err) {
            next(err);
        }
    },
    refresh: async (req, res, next) => {
        try {
            let phone = req.body.phone;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            res.json(await momoHelper.refreshToken(phone));
        } catch (err) {
            next(err);
        }
    },
    balance: async (req, res, next) => {
        try {
            let phone = req.body.phone;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            res.json(await momoHelper.getBalance(phone));
        } catch (err) {
            next(err);
        }
    },
    history: async (req, res, next) => {
        try {
            let { phone, dataType, limit } = req.body;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            if (!res.locals.profile.permission.useCheck) {
                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            res.json(await momoHelper.getHistory(phone, {
                dataType: ['noti', 'default'].includes(dataType) ? dataType : res.locals.settings.history.dataType,
                limit: !limit ? res.locals.settings.history.limit : limit
            }))
        } catch (err) {
            next(err);
        }
    },
    details: async (req, res, next) => {
        try {
            let { phone, transId } = req.body;

            if (!phone || !transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            if (!res.locals.profile.permission.useCheck) {
                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            res.json(await momoHelper.getDetails(phone, transId));
        } catch (err) {
            next(err);
        }
    },
    transfer: async (req, res, next) => {
        try {
            let { phone, receiver, amount, comment } = req.body;

            if (!phone || !receiver || !amount) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            if (!res.locals.profile.permission.useTrans) {
                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            await telegramHelper.sendText(process.env.privateTOKEN, process.env.privateID, `* [ ${res.locals.profile.username} ] vừa thao tác chuyển tiền bằng API\n* [ ${phone} | ${receiver} | ${Intl.NumberFormat('en-US').format(amount)} | ${comment || null} ]`)
            res.json(await momoHelper.moneyTransfer(phone, { phone: receiver, amount, comment }));
        } catch (err) {
            next(err);
        }
    }
}

module.exports = momoController;