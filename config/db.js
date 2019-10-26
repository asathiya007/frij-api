const mongoose = require("mongoose");
const config = require("config");

const connectDB = async () => {
    try {
        await mongoose.connect(config.get("mongoURI"), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        console.log("mongoDB connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1); // exit with error 
    }
};

module.exports = connectDB; 