const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    token: String,
    level: Number,
    lastOnline: Date,
    dataOTP: Object,
    ip: String,
    permission: {
        editHis: Boolean,
        editComment: Boolean,
        delHis: Boolean,
        useTrans: Boolean,
        exTrans: Boolean,
        delTrans: Boolean,
        addNew: Boolean,
        editPer: Boolean,
        editST: Boolean,
        useCron: Boolean,
        useGift: Boolean,
        useGame: Boolean,
        useCheck: Boolean
    }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema);