const mongoose = require("mongoose");
const config = require("config");

const connectDB = async () => {
    try {
        await mongoose.connect(config.get("mongoURI"), {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("mongoDB connected");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("server error");
    }
};

module.exports = connectDB; 