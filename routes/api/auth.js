const express = require("express");
const {check, validationResult} = require("express-validator");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const router = express.Router();

// @route   GET api/auth/test
// @desc    test auth route
// @access  public
router.get("/test", (req, res) => res.json({msg: "auth route"}));

// @route   POST api/auth
// @desc    user login route
// @access  public
router.post("/", 
    [
        check("email", "please provide valid email").isEmail(),
        check("password", "please provide password").not().isEmpty()
    ],
    async (req, res) => {
        // check for errors 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {email, password} = req.body; 

        // authenticate user, get token
        try {
            let user = await User.findOne({email});

            // check if user does not exist 
            if (!user) {
                return res.status(400).json({errors: [{msg: "invalid credentials"}]});
            }

            // verify credentials 
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({errors: [{msg: "invalid credentials"}]});
            }

            // create token 
            const payload = {
                user: {
                    id: user.id
                }
            }
            jwt.sign(
                payload, 
                config.get("tokenSecret"),
                {expiresIn: 3600},
                (err, token) => {
                    if (err) throw err;
                    res.json({token});
                }
            ); 
        } catch (err) {
            console.error(err.message);
            res.status(500).json({errors: [{msg: "server error"}]});
        }
    }
);

module.exports = router; 