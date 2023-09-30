const moment = require('moment');
const momoService = require('../services/momo.service');
const historyService = require('../services/history.service');
const gameService = require('../services/game.service');
const momoHelper = require('../helpers/momo.helper');
const giftHelper = require('../helpers/gift.helper');
const historyHelper = require('../helpers/history.helper');
const historyModel = require('../models/history.model');
const rewardModel = require('../models/reward.model');
const gameModel = require('../models/game.model');
const momoModel = require('../models/momo.model');
const giftModel = require('../models/gift.model');
const blockModel = require('../models/block.model');

const apiController = {
    getGame: async (req, res, next) => {
        try {
            let data = await gameService.getGame();
            res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })
        } catch (err) {
            console.log(err), next(err);
        }
    },
    getPhone: async (req, res, next) => {
        try {
            let data = await momoService.getPhone({ status: 'active', loginStatus: 'active' }, res.locals.settings.limitPhone);
            res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })
        } catch (err) {
            console.log(err), next(err);
        }
    },
    getReward: async (req, res, next) => {
        try {
            if (!req.body.gameType) {
                return res.json({
                    success: false,
                    message: 'Trường gameType không được bỏ trống!'
                })
            }

            let data = await rewardModel.find({ gameType: req.body.gameType }, { _id: 0, __v: 0, resultType: 0 });

            !await gameModel.findOne({
                gameType: req.body.gameType, display: 'show'
            }) ? res.json({
                success: false,
                message: 'Game này không tồn tại hoặc không hợp lệ!'
            }) : res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })

        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    getHistory: async (req, res, next) => {
        try {
            let data = await historyService.getHistory();

            res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })
        } catch (err) {
            next(err);
        }
    },
    checkMission: async (req, res, next) => {
        try {
            if (!req.body.phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!',
                })
            }

            if (res.locals.settings.missionData.status != 'active') {
                return res.json({
                    success: false,
                    message: 'Nhiệm vụ ngày đang bảo trì!',
                })
            }

            let phone = req.body.phone;
            let dataDay = await historyModel.aggregate([{ $match: { partnerId: phone, timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, $and: [{ $or: [{ status: 'win' }, { status: 'won' }] }] } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);

            if (!dataDay.length) {
                return res.json({
                    success: false,
                    message: 'Hôm nay bạn chưa chơi mini game trên hệ thống!'
                })
            }

            let getName = await momoHelper.checkName(await momoService.phoneActive('limit', 0), phone);
            let bonus = 0, j = 0;
            let missionData = res.locals.settings.missionData.data;

            for (let i = 0; i < missionData.length; i++) {
                if (dataDay[0].amount < missionData[i].amount) continue;
                bonus = missionData[i].bonus;
                j = i;
            }

            missionData.length > j + 1 && (bonus = missionData[!bonus ? j : j + 1].bonus);

            return res.json({
                success: true,
                message: 'Lấy thành công!',
                data: {
                    name: getName.success ? getName.name : phone,
                    count: dataDay[0].amount,
                    bonus
                }
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    checkGift: async (req, res, next) => {
        try {
            let { phone, code } = req.body;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!',
                })
            }

            if (!code) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã quà tặng!',
                })
            }

            if (res.locals.settings.giftCode.status != 'active') {
                return res.json({
                    success: false,
                    message: 'Mã quà tặng tạm bảo trì!',
                })
            }

            if (!await historyModel.findOne({ partnerId: phone, timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, $and: [{ $or: [{ status: 'win' }, { status: 'won' }] }] })) {
                return res.json({
                    success: false,
                    message: 'Vui lòng chơi ít nhất 1 game để sử dụng!'
                })
            }

            let checkCode = await giftModel.findOne({ code, status: 'active' });

            if (!checkCode) {
                return res.json({
                    success: false,
                    message: 'Mã code đã hết hạn hoặc không hợp lệ!'
                })
            }

            if (checkCode.players.length >= checkCode.limit) {
                await giftModel.findOneAndUpdate({ code }, { $set: { status: 'limit' } });
                return res.json({
                    success: false,
                    message: 'Mã code đã hết lượt sử dụng!'
                })
            }

            let countPlay = await historyModel.aggregate([{ $match: { io: 1, partnerId: phone, gameType: { $exists: true, $ne: null } } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);
            countPlay = countPlay[0].amount || 0;

            if (checkCode.playCount && checkCode.playCount > countPlay) {
                return res.json({
                    success: false,
                    message: `Bạn phải chơi đủ ${Intl.NumberFormat('en-US').format(checkCode.playCount)}đ thì mới đủ điều kiện sử dụng!`
                })
            }

            let timeExpired = Math.abs((moment(checkCode.expiredAt).valueOf() - moment().valueOf()) / 1000).toFixed(0) - Math.abs((moment(checkCode.createdAt).valueOf() - moment().valueOf()) / 1000).toFixed(0);

            if (timeExpired < 1) {
                await giftModel.findOneAndUpdate({ code: code }, { $set: { status: "expired" } });
                return res.json({
                    success: false,
                    message: "Mã code đã hết hạn sử dụng!"
                });
            }

            if (checkCode.players.find(e => e.phone = phone)) {
                return res.json({
                    success: false,
                    message: "Mã code đã được sử dụng!"
                })
            }

            if (await blockModel.findOne({ phone })) {
                return res.json({
                    success: false,
                    message: 'Bạn không có quyền sử dụng!'
                })
            }

            if (req.session.giftCode == code) {
                return res.json({
                    success: false,
                    message: "Hệ thống đang xử lý, vui lòng thử lại sau ít phút!"
                })
            }

            req.session.giftCode = code;
            giftHelper.rewardGift(phone, code);
            setTimeout(() => req.session.destroy(), 120 * 1000);

            return res.json({
                success: true,
                message: "Nhận quà thành công!"
            })
        } catch (err) {
            req.session.giftCode = null, next(err);
        }
    },
    checkTransId: async (req, res, next) => {
        try {
            let { phone, transId } = req.body;

            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã giao dịch!'
                })
            }

            if (transId.length < 8) {
                return res.json({
                    success: false,
                    message: 'Mã giao dịch không hợp lệ!'
                })
            }

            let find = await historyHelper.checkTransId(transId);

            if (!find.success && phone) {
                let check = await momoModel.findOne({ phone });

                if (!check) return res.json({
                    success: false,
                    message: 'Số này không tồn tại trên hệ thống!',
                })

                if (check.loginStatus != 'active') return res.json({
                    success: false,
                    message: 'Số này đang lỗi, hãy đợi admin xử lý!',
                })

                if (res.locals.settings.checkTransId.status != 'active') return res.json({
                    success: false,
                    message: 'Hệ thống tạm đóng tìm mã giao dịch qua số điện thoại!',
                })

                find = await historyHelper.checkTransId(transId, phone);
            }

            return res.json(find);

        } catch (err) {
            next(err);
        }
    },
    refundTransId: async (req, res, next) => {
        try {
            let transId = req.body.transId;
            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã giao dịch!'
                })
            }

            if (transId.length < 8) {
                return res.json({
                    success: false,
                    message: 'Mã giao dịch không hợp lệ!'
                })
            }

            let find = await historyHelper.checkTransId(transId);

            if (!find) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy mã giao dịch này!'
                })
            }

            if (find.status == 'error' || find.status == 'wait' || find.status == 'done') {
                return res.json({
                    success: false,
                    message: find.status == 'error' ? 'Mã giao dịch này xử lý lỗi, vui lòng báo admin!' : (find.status == 'done' ? 'Mã giao dịch đã xử lý!' : 'Mã giao dịch này đang xử lý!')
                })
            }

            if (req.session.transId == transId) {
                return res.json({
                    success: false,
                    message: 'Mã giao dịch này đang xử lý, thử lại sau ít phút!!'
                })
            }

            req.session.transId = transId;
            historyHelper.rewardTransId(null, transId);
            setTimeout(() => req.session.destroy(), 120 * 1000);

            return res.json({
                success: true,
                message: 'Gửi yêu cầu hoàn tiền thành công!'
            })
        } catch (err) {
            req.session.transId = null;
            next(err);
        }
    }
}

module.exports = apiController;