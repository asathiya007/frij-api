const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

connectDB(); 

// @route   GET /test
// @desc    test api started
// @access  public
app.get("/test", (req, res) => res.json({msg: "api started"}));

// external routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/storage", require("./routes/api/storage"));

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`api running on port ${PORT}`));