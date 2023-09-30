const moment = require('moment');
const historyModel = require('../../models/history.model');
const gameModel = require('../../models/game.model');
const momoModel = require('../../models/momo.model');
const historyHelper = require('../../helpers/history.helper');
const momoHelper = require('../../helpers/momo.helper');
const utils = require('../../helpers/utils.helper');
const settingModel = require('../../models/setting.model');


const historyController = {
    index: async (req, res, next) => {
        try {
            const dataSetting = await settingModel.findOne();
            let filters = {};
            let perPage = 10;
            let page = req.query.page || 1;
            let _sort = { updatedAt: 'desc' };

            if (req.query?.perPage) {
                perPage = req.query.perPage;
            }

            if (req.query?.status) {
                let vaildStatus = ['wait', 'transfer', 'recharge', 'errorComment', 'limitRefund', 'limitBet', 'refund', 'waitReward', 'waitRefund', 'win', 'won', 'errorMoney', 'limitPhone', 'errorPhone', 'phoneBlock'];

                if (vaildStatus.includes(req.query.status)) {
                    filters.status = req.query.status;

                    res.locals.status = req.query.status;
                }

                if (req.query.status == 'error') {
                    let allError = ['errorComment', 'limitRefund', 'limitBet', 'errorMoney', 'limitPhone', 'errorPhone', 'phoneBlock'];

                    filters.$or = allError.map((item) => {
                        return { status: item }
                    });

                    res.locals.status = req.query.status;
                }
            }

            if (req.query?.io) {
                if (req.query.io == -1 || req.query.io == 1) {
                    filters.io = Number(req.query.io);

                    res.locals.io = req.query.io;
                }
            }

            if (req.query.gameType) {
                filters.gameType = req.query.gameType;

                res.locals.gameType = req.query.gameType;
            }

            if (req.query?.search) {
                let search = req.query.search;
                let arr = [
                    {
                        phone: { $regex: search }
                    },
                    {
                        comment: { $regex: search }
                    },
                    {
                        gameName: { $regex: search }
                    },
                    {
                        gameType: { $regex: search }
                    },
                    {
                        partnerId: { $regex: search }
                    },
                    {
                        targetId: { $regex: search }
                    },
                    {
                        targetName: { $regex: search }
                    }
                ];

                filters.$or ? filters.$or.push(...arr) : filters.$or = arr;

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { transId: search },
                        { amount: search },
                        { bonus: search },
                        { postBalance: search }
                    ])
                }

                res.locals.search = search;
            }

            if (req.query.hasOwnProperty('_sort')) {
                _sort = {
                    [req.query.column]: req.query._sort
                }
            }

            let pageCount = await historyModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let games = await gameModel.find().lean();
            let phones = await momoModel.find({ status: 'active', loginStatus: 'active' }).lean();
            let list = await historyModel.find(filters).skip((perPage * page) - perPage).sort(_sort).limit(perPage).lean();

            res.render('admin/history', {
                title: 'Lịch Sử Giao Dịch', list, games, phones, perPage,dataSetting, pagination: {
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
    },
    update: async (req, res, next) => {
        try {
            let id = req.params.id;

            if (!res.locals.profile.permission.editHis || (req.body.comment && !res.locals.profile.permission.editComment)) {
                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            let data = await historyModel.findById(id);

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            for (let key in req.body) {
                await historyModel.findByIdAndUpdate(id, {
                    $set: {
                        ...req.body,
                    }
                });

                await historyModel.findByIdAndUpdate(id, {
                    $push: {
                        action: {
                            username: res.locals.profile.username,
                            key,
                            value: req.body[key],
                            createdAt: moment().toDate()
                        }
                    }
                });
            }

            return res.json({
                success: true,
                message: 'Lưu thành công #' + id
            })
        } catch (err) {
            next(err);
        }
    },
    remove: async (req, res, next) => {
        try {
            let id = req.params.id;

            if (!res.locals.profile.permission.delHis) {
                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            if (id == 'all') {
                if (res.locals.profile.level == 1) {
                    await historyModel.deleteMany();
                    return res.json({
                        success: true,
                        message: 'Xóa tất cả thành công!'
                    })
                }

                return res.json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })

            }

            let data = await historyModel.findById(id);

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            if (data.action.length && res.locals.profile.level != 1) {
                return res.json({
                    success: false,
                    message: 'Không thể xóa giao dịch đã bị thao tác!'
                })
            }

            await data.remove();

            return res.json({
                success: true,
                message: 'Xóa thành công #' + id
            })
        } catch (err) {
            next(err);
        }
    },
    rework: async (req, res, next) => {
        try {
            let { phone, transId } = req.body;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng chọn số điện thoại!'
                })
            }

            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã giao dịch!'
                })
            }

            if (!await momoModel.findOne({ phone, status: 'active', loginStatus: 'active' })) {
                return res.json({
                    success: false,
                    message: 'Số điện thoại này không hoạt động!'
                })
            }

            let data = await historyModel.findOne({ transId });

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy dữ liệu!'
                })
            }

            let reward = await historyHelper.rewardTransId(phone, transId);

            return !reward ? res.json({
                success: false,
                message: 'Trả thưởng lại thất bại!'
            }) : res.json({
                success: true,
                message: `Trả thưởng lại thành công #${reward.transId}`
            })

        } catch (err) {
            next(err);
        }
    },
    reCheck: async (req, res, next) => {
        try {
            let { transId } = req.body;

            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Thiếu dữ liệu đường truyền!'
                })
            }

            let data = await historyModel.findOne({ transId }).lean();

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy mã giao dịch này!'
                })
            }

            let detail = await momoHelper.getDetails(data.phone, transId);

            if (!detail.success) {
                return res.json({
                    success: false,
                    message: detail.message
                })
            }

            return res.json({
                success: true,
                message: 'Lấy thành công!',
                data: [
                    {
                        transId: data.transId,
                        targetId: data.targetId,
                        partnerId: data.partnerId,
                        amount: data.amount,
                        comment: data.comment,
                        timeTLS: data.timeTLS
                    },
                    {
                        transId: detail.data.transId,
                        targetId: detail.data.targetId,
                        partnerId: detail.data.partnerId,
                        amount: detail.data.amount,
                        comment: detail.data.comment,
                        timeTLS: detail.data.time
                    }
                ]
            })

        } catch (err) {
            next(err);
        }
    },
    checkAction: async (req, res, next) => {
        try {
            let { transId } = req.body;

            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Thiếu dữ liệu đường truyền!'
                })
            }

            let data = await historyModel.findOne({ transId }).lean();

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy mã giao dịch này!'
                })
            }

            return res.json({
                success: true,
                message: 'Lấy thành công!',
                data: data.action
            })
        } catch (err) {
            next(err);
        }
    }

}

module.exports = historyController;