const express = require("express");

const router = express.Router(); 

// @route   GET /test
// @desc    test users route
// @access  public
router.get("/test", (req, res) => res.json("users route")); 

module.exports = router; 