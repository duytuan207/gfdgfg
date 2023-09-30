const express = require('express');
const jackpotService = require('../services/jackpot.service');
const { isActive } = require('../middlewares/system.middleware');
const { regexPhone } = require('../helpers/momo.helper');
const router = express.Router();

router.post('/join', isActive, async (req, res, next) => {
    try {
        let phone = req.body.phone;

        if (res.locals.settings.jackpot.status != 'active') {
            return res.json({
                success: false,
                message: 'Nổ hũ không hoạt động!'
            })
        }

        if (!phone) {
            return res.json({
                success: false,
                message: 'Vui lòng nhập số điện thoại!'
            })
        }

        if (!regexPhone(phone)) {
            return res.json({
                success: false,
                message: 'Số điện thoại không hợp lệ!'
            })
        }

        let join = await jackpotService.joinJackpot(phone, req.ip);
        res.json(join);
    } catch (err) {
        next(err);
    }
})

router.post('/out', isActive, async (req, res, next) => {
    try {
        let phone = req.body.phone;

        if (res.locals.settings.jackpot.status != 'active') {
            return res.json({
                success: false,
                message: 'Nổ hũ đang tạm đóng!'
            })
        }

        if (!phone) {
            return res.json({
                success: false,
                message: 'Vui lòng nhập số điện thoại!'
            })
        }

        if (!regexPhone(phone)) {
            return res.json({
                success: false,
                message: 'Số điện thoại không hợp lệ!'
            })
        }

        let out = await jackpotService.outJackpot(phone);
        res.json(out);
    } catch (err) {
        next(err);
    }
})

router.get('/history', isActive, async (req, res, next) => {
    try {
        let data = await jackpotService.getHistory(5);

        res.json({
            success: true,
            message: 'Lấy thành công!',
            data
        })
    } catch (err) {
        next(err);
    }
})

router.post('/checkJoin', isActive, async (req, res, next) => {
    try {
        let phone = req.body.phone;

        if (res.locals.settings.jackpot.status != 'active') {
            return res.json({
                success: false,
                message: 'Nổ hũ không hoạt động!'
            })
        }

        if (!phone) {
            return res.json({
                success: false,
                message: 'Vui lòng nhập số điện thoại!'
            })
        }

        if (!regexPhone(phone)) {
            return res.json({
                success: false,
                message: 'Số điện thoại không hợp lệ!'
            })
        }

        let data = await jackpotService.checkJoin(phone);

        res.json({
            success: true,
            message: 'Thành công!',
            data
        })
    } catch (err) {
        next(err);
    }
})

module.exports = router;