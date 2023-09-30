const moment = require('moment');
const settingModel = require('../models/setting.model');
const giftModel = require('../models/gift.model');
const transferModel = require('../models/transfer.model');
const momoService = require('../services/momo.service');
const logHelper = require('../helpers/log.helper');
const momoHelper = require('../helpers/momo.helper');
const commentHelper = require('../helpers/comment.helper');

exports.rewardGift = async (phone, code) => {
    try {
        let dataSetting = await settingModel.findOne();
        let data = await giftModel.findOne({ code, status: 'active' });

        if (!data) {
            logHelper.create('rewardGift', `Trả thưởng thất bại!\n* [ ${phone} | ${code} | ${Intl.NumberFormat('en-US').format(amount)} ]\n* [ Mã code này đã hết hạn sử dụng hoặc không tồn tại! ]`);
            return;
        }

        if (data.players.find(e => e.phone = phone)) {
            console.log(`[ ${phone} | ${code} | ${Intl.NumberFormat('en-US').format(amount)} ], đã nhận thưởng mã code này rồi!`);
            return;
        }

        if (data.players.length >= data.limit) {
            logHelper.create('rewardGift', `Trả thưởng thất bại!\n* [ ${phone} | ${code} | ${Intl.NumberFormat('en-US').format(amount)} ]\n* [ Mã code này đã hết lượt sử dụng! ]`);
            return;
        }

        data.players.push({ phone, time: moment().toDate() }), await data.save();

        let amount = data.amount;
        let commentData = [
            {
                name: 'code',
                value: code,
            },
            {
                name: 'amount',
                value: Intl.NumberFormat('en-US').format(data.amount),
            }
        ];
        let comment = await commentHelper.dataComment(dataSetting.commentSite.rewardGift, commentData);
        let phoneActive = await momoService.phoneActive('all', amount);

        if (!phoneActive) {
            logHelper.create('rewardGift', `Trả thưởng thất bại!\n* [ ${phone} | ${code} | ${Intl.NumberFormat('en-US').format(amount)} ]\n* [ Không tìm thấy số nào đủ điều kiện để trả thưởng, vui lòng trả tay! ]`);
            return;
        }

        if (await transferModel.findOne({ receiver: phone, amount, comment }) || amount < 100) {
            console.log(`[ ${phone} | ${code} | ${amount} ], đã nhận thưởng mã code này từ trước rồi!`)
            logHelper.create('rewardGift', `Trả thưởng thất bại!\n* [ ${phone} | ${code} | ${Intl.NumberFormat('en-US').format(amount)} ]\n* [ Đã nhận thưởng mã code này từ trước rồi! ]`);
            return;
        }

        let transfer = await momoHelper.moneyTransfer(phoneActive, { phone, amount, comment });

        if (!transfer || !transfer.success) {
            logHelper.create('rewardGift', `Trả thưởng thất bại!\n* [ ${phone} | ${code} | ${Intl.NumberFormat('en-US').format(amount)} ]\n* [ ${transfer.message} ]`)
            return await this.rewardGift(phone, code);
        }

        logHelper.create('rewardGift', `Trả thưởng thành công!\n* [ ${phone} | ${code} | ${Intl.NumberFormat('en-US').format(amount)} ]\n* [ Mã giao dịch: ${transfer.data.transId} ]`)
    } catch (err) {
        console.log(err);
        logHelper.create('rewardGift', `Trả thưởng thất bại!\n* [ ${phone} | ${code} ]\n* [ ${err.message || err}, vui lòng trả tay! ]`);
        return;
    }
}