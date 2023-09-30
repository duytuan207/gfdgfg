const express = require('express');
const moment = require('moment');
const { isActive } = require('../middlewares/system.middleware');
const { regexPhone } = require('../helpers/momo.helper');
const musterModel = require('../models/muster.model');
const historyModel = require('../models/history.model');
const musterService = require('../services/muster.service');
const router = express.Router();

router.get('/session', isActive, async (req, res, next) => {
    try {
        let data = await musterService.info();

        res.json({
            success: true,
            message: 'Lấy thành công!',
            data
        })
    } catch (err) {
        next(err);
    }
})

router.post('/add', isActive, async (req, res, next) => {
    try {
        let phone = req.body.phone;

        if (res.locals.settings.muster.status != 'active') {
            return res.json({
                success: false,
                message: 'Điểm danh không hoạt động!'
            })
        }

        if (moment().format('H') < res.locals.settings.muster.startTime || moment().format('H') > res.locals.settings.muster.endTime) {
            return res.json({
                success: false,
                message: `Điểm danh chỉ hoạt động từ ${res.locals.settings.muster.startTime} - ${res.locals.settings.muster.endTime}`
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

        let muster = await musterModel.findOne({ status: 'active' }).sort({ createdAt: 'desc' });

        if (!muster) {
            return res.json({
                success: false,
                message: 'Vui lòng đợi phiên mới!'
            })
        }

        if (muster.players.includes(phone)) {
            return res.json({
                success: false,
                message: 'Bạn đã tham gia điểm danh trước đó!'
            })
        }

        if (!(await historyModel.aggregate([{ $match: { partnerId: phone, timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: null, amount: { $sum: '$amount' } } }])).length) {
            return res.json({
                success: false,
                message: 'Hôm nay bạn chưa chơi mini game trên hệ thống!'
            })
        }

        muster.players.push(phone), await muster.save();
        socket.emit('musterData', await musterService.info());

        res.json({
            success: true,
            message: 'Điểm danh thành công!'
        })
    } catch (err) {
        next(err);
    }

})

router.get('/history', isActive, async (req, res, next) => {
    try {
        let data = await musterService.getHistory(5);

        res.json({
            success: true,
            message: 'Lấy thành công!',
            data
        })
    } catch (err) {
        next(err);
    }
})


module.exports = router;