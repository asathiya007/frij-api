const express = require("express");

const router = express.Router();

// @route   GET /test
// @desc    test auth route
// @access  public
router.get("/test", (req, res) => res.json("auth route"));

module.exports = router; 