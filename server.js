const express = require("express");

const app = express();
app.use(express.json());

// @route   GET /test
// @desc    test api started
// @access  public
app.get("/test", (req, res) => res.json("api started"));

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`api running on port ${PORT}`));