const express = require("express");

const router = express.Router();

// @route   GET api/storage/test
// @desc    test storage route
// @access  public
router.get("/test", (req, res) => res.json("storage route"));

module.exports = router; 