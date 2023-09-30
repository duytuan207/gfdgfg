const express = require('express');
const moment = require('moment');
const { isAdmin, loggedIn } = require('../middlewares/auth.middleware');
const authRoute = require('../routers/auth.route');
const logModel = require('../models/log.model');
const historyModel = require('../models/history.model');
const revenueService = require('../services/revenue.service');
const systemController = require('../controllers/admin/system.controller');
const gameController = require('../controllers/admin/game.controller');
const rewardController = require('../controllers/admin/reward.controller');
const blockController = require('../controllers/admin/block.controller');
const WinrateController = require('../controllers/admin/winrate.controller');
const jackpotController = require('../controllers/admin/jackpot.controller');
const musterController = require('../controllers/admin/muster.controller');
const giftController = require('../controllers/admin/gift.controller');
const missionController = require('../controllers/admin/mission.controller');
const refundController = require('../controllers/admin/refund-bill.controller');
const momoController = require('../controllers/admin/momo.controller');
const historyController = require('../controllers/admin/history.controller');
const transferController = require('../controllers/admin/transfer.controller');
const memberController = require('../controllers/admin/member.controller');
const vpsController = require('../controllers/admin/vps.controller');
const checkController = require('../controllers/admin/check.controller');
const tableSort = require('../middlewares/sort.middleware');
const utils = require('../helpers/utils.helper');
const router = express.Router();

router.use(authRoute);

router.get(['/', '/home', '/dashboard'], loggedIn, async (req, res, next) => {
    try {
        let _phone, gameType;
        let _revenueTime = moment().format('YYYY-MM-DD');
        let typeDate = 'day';

        req.query?._phone && /(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/.test(req.query._phone) && (_phone = req.query._phone);
        req.query?.gameType && (gameType = req.query.gameType);

        if (req.query?.typeDate) {
            let vaild = ['day', 'month', 'all'];
            vaild.includes(req.query.typeDate) && (typeDate = req.query.typeDate);
        }

        if (req.query?._revenueTime) {
            let regexTime = [
                {
                    type: 'day',
                    regex: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                    format: 'YYYY-MM-DD'
                }, {
                    type: 'month',
                    regex: /^\d{4}-(0[1-9]|1[0-2])$/,
                    format: 'YYYY-MM'
                },
                {
                    type: 'all',
                    regex: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                    format: 'YYYY-MM-DD'
                }
            ];

            let dataTime = regexTime.find(e => e.type == typeDate);
            req.query._revenueTime.match(dataTime.regex) && (_revenueTime = moment(req.query._revenueTime).format(dataTime.format))
        }

        let logs = await logModel.find().sort({ time: 'desc' }).limit(30).lean();
        let revenueData = {
            ...await revenueService.revenueBet(_revenueTime, typeDate, _phone, gameType),
            ...await revenueService.revenueMoney(_revenueTime, typeDate, _phone, gameType)
        }

        res.render('admin/dashboard', { title: 'Quản Trị Hệ Thống', revenueData, _revenueTime, typeDate, logs })
    } catch (err) {
        next(err);
    }
});

router.delete('/logSystem/:id', isAdmin, async (req, res, next) => {
    try {
        let id = req.params.id;
        id == 'all' ? await logModel.deleteMany() : await logModel.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa thành công!'
        })

    } catch (err) {
        next(err);
    }
})

router.route('/system')
    .get(loggedIn, systemController.index)
    .put(isAdmin, systemController.update);

router.route('/game')
    .get(loggedIn, tableSort, gameController.index)
    .post(isAdmin, gameController.add);

router.route('/game/:id')
    .put(isAdmin, gameController.update)
    .delete(isAdmin, gameController.remove);

router.route('/reward')
    .get(loggedIn, tableSort, rewardController.index)
    .post(isAdmin, rewardController.checkPer, rewardController.add);

router.route('/reward/:id')
    .put(isAdmin, rewardController.checkPer, rewardController.update)
    .delete(isAdmin, rewardController.checkPer, rewardController.remove);

router.get('/player', loggedIn, tableSort, async (req, res, next) => {
    try {
        let phone, startTime, endTime;
        let filters = [
            {
                $match: {
                    io: 1,
                    gameType: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$partnerId",
                    total: { $sum: 1 },
                    amount: { $sum: '$amount' },
                    bonus: { $sum: '$bonus' },
                }
            },
            {
                $addFields: {
                    earning: { $subtract: ["$bonus", "$amount"] }
                }
            },
            {
                $sort: {
                    amount: -1
                }
            }
        ];
        let perPage = 10;
        let page = req.query.page || 1;
        res.locals._sort.column = 'amount';

        if (req.query?.perPage) {
            perPage = req.query.perPage;
            res.locals.perPage = perPage;
        }

        if (req.query.hasOwnProperty('_sort')) {
            filters[3].$sort = {
                [req.query.column]: req.query._sort == 'asc' ? 1 : -1
            }

            res.locals._sort.type = req.query._sort;
        }

        if (req.query?.startTime) {
            startTime = moment(req.query.startTime).startOf('day').toDate();
            res.locals.startTime = moment(startTime).format('YYYY-MM-DD');
        }

        if (req.query?.endTime) {
            endTime = moment(req.query.endTime).endOf('day').toDate();
            res.locals.endTime = moment(endTime).format('YYYY-MM-DD');
        }

        if (req.query?.dateTime) {
            startTime = moment(req.query.dateTime).startOf('day').toDate();
            endTime = moment(req.query.dateTime).endOf('day').toDate();
            res.locals.dateTime = moment(req.query.dateTime).format('YYYY-MM-DD');
        }

        if (req.query?.phone) {
            if (/(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/.test(req.query.phone)) {
                phone = req.query.phone;
                filters[0].$match.partnerId = phone;
                filters[1].$group._id = null;
                res.locals.phone = phone;
            }
        }

        if (startTime && endTime) {
            filters[0].$match.timeTLS = { $gte: startTime, $lt: endTime };
        }

        let pageCount = (await historyModel.aggregate(filters)).length;
        let pages = Math.ceil(pageCount / perPage);

        if (req.query?.page) {
            req.query.page > pages ? page = pages : page = req.query.page;
        }

        filters.push({ $skip: (perPage * page) - perPage }, { $limit: Number(perPage) });

        let players = await historyModel.aggregate(filters);
        let earningCount = players.map((item) => item.amount - item.bonus);

        earningCount.length && (earningCount = earningCount.reduce((a, b) => a + b))
        phone && players.map((item) => item._id = phone);

        res.render('admin/player', {
            title: 'Quản Lý Người Chơi', players, earningCount, pagination: {
                page,
                pageCount,
                limit: pages > 5 ? 5 : pages,
                query: utils.checkQuery(res.locals.originalUrl.search, ['page']),
                baseURL: res.locals.originalUrl.pathname
            }
        })
    } catch (err) {
        next(err);
    }
});

router.route('/block')
    .get(loggedIn, tableSort, blockController.index)
    .post(isAdmin, blockController.add);

router.route('/block/:id')
    .put(isAdmin, blockController.update)
    .delete(isAdmin, blockController.remove);

router.route('/winrate')
    .get(loggedIn, tableSort, WinrateController.index)
    .post(isAdmin, WinrateController.add);

router.route('/winrate/:id')
    .put(isAdmin, WinrateController.update)
    .delete(isAdmin, WinrateController.remove);

router.get('/jackpot', loggedIn, tableSort, jackpotController.index)

router.route('/jackpot/:id')
    .put(isAdmin, jackpotController.update)
    .delete(isAdmin, jackpotController.remove);

router.route('/history-jackpot')
    .get(loggedIn, tableSort, jackpotController.history)
    .post(isAdmin, jackpotController.rework)

router.route('/history-jackpot/:id')
    .put(isAdmin, jackpotController.updateHistory)
    .delete(isAdmin, jackpotController.removeHistory);

router.get('/muster', tableSort, loggedIn, musterController.index);

router.route('/muster/:id')
    .put(isAdmin, musterController.update)
    .delete(isAdmin, musterController.remove);

router.route('/gift')
    .get(loggedIn, giftController.checkPer, tableSort, giftController.index)
    .post(isAdmin, giftController.checkPer, giftController.add);

router.route('/gift/:id')
    .put(isAdmin, giftController.checkPer, giftController.update)
    .delete(isAdmin, giftController.checkPer, giftController.remove);

router.route('/history-gift/:id')
    .get(loggedIn, giftController.checkPer, tableSort, giftController.history)
    .post(isAdmin, giftController.checkPer, giftController.delHistory);

router.post('/sendOTP', isAdmin, async (req, res, next) => {
    try {
        let { action } = req.body;

        if (!action) {
            return res.json({
                success: false,
                message: 'Thiếu dữ liệu đường truyền!'
            })
        }

        let vaild = ['addGift', 'useTrans'];

        if (!vaild.includes(action)) {
            return res.json({
                success: false,
                message: 'Thao tác không hợp lệ!'
            })
        }

        let send = await utils.OTP('generate', {
            username: res.locals.profile.username,
            action
        });

        return res.json(send);
    } catch (err) {
        console.log(err);
        next(err);
    }
})

router.get('/mission', loggedIn, tableSort, missionController.index);
router.delete('/mission/:id', isAdmin, missionController.remove);

router.get('/refund-bill', loggedIn, tableSort, refundController.index);
router.delete('/refund-bill/:id', isAdmin, refundController.remove);

router.get('/momo-list', loggedIn, tableSort, momoController.index);
router.get('/momo-lite', loggedIn, tableSort, momoController.lite);
router.get('/momo-data/:phone', isAdmin, momoController.data);

router.route(['/momo-list/:id', '/momo-lite/:id'])
    .put(isAdmin, momoController.update)
    .delete(isAdmin, momoController.remove);

router.route('/transfer')
    .get(loggedIn, transferController.index)
    .post(isAdmin, transferController.transfer)

router.get('/history-transfer', loggedIn, tableSort, transferController.showTrans)
router.delete('/history-transfer/:id', isAdmin, transferController.delTrans)

router.route('/history')
    .get(loggedIn, tableSort, historyController.index)
    .post(isAdmin, historyController.rework);

router.route('/history/:id')
    .put(isAdmin, historyController.update)
    .delete(isAdmin, historyController.remove);

router.post('/history/reCheck', isAdmin, historyController.reCheck);
router.post('/history/checkAction', isAdmin, historyController.checkAction);

router.route('/members')
    .get(loggedIn, tableSort, memberController.index)
    .post(isAdmin, memberController.add);

router.route('/members/:id')
    .get(isAdmin, memberController.info)
    .put(isAdmin, memberController.update)
    .delete(isAdmin, memberController.remove);

router.post('/members/action', isAdmin, memberController.action);

router.route('/vps')
    .get(loggedIn, tableSort, vpsController.index)
    .post(isAdmin, vpsController.run);

router.get('/checkTrans', loggedIn, tableSort, checkController.index);
router.post('/checkTrans', isAdmin, checkController.check);

module.exports = router;