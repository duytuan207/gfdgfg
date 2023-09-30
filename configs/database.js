const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);
        let conn = await mongoose.connect(process.env.MONGODB_URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        })
        console.log(`Kết nối database thành công, host: ${conn.connection.host}`)
    } catch (err) {
        console.log(err);
    }
}

module.exports = { connectDB };