const express = require("express");
const {check, validationResult} = require("express-validator");
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const tokenauth = require("../../middleware/tokenauth");

const router = express.Router(); 

// @route   GET api/users/test
// @desc    test users route
// @access  public
router.get("/test", (req, res) => res.json("users route")); 

// @route   GET api/users/
// @desc    get user data
// @access  private
router.get("/", tokenauth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("server error");
    }
}); 

// @route   POST api/users
// @desc    register user
// @access  public
router.post("/", 
    [
        check("name", "please provide a name").not().isEmpty(),
        check("email", "please provide valid email").isEmail(),
        check("password", "passwords must be at least 6 characters long")
            .isLength({min: 6}),
        check("organization", "please provide an organization").not().isEmpty()
    ],
    async (req, res) => {
        // check for errors 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {name, email, password, organization} = req.body; 

        try {
            // check if user already exist 
            let user = await User.findOne({email});
            if (user) {
                return res.status(400).json("user already exists");
            }
            
            // create user avatar 
            const avatar = gravatar.url(email, {
                s: "200",
                r: "pg",
                d: "mm"
            });

            // create user profile 
            user = new User({
                name,
                email,
                password,
                organization, 
                avatar
            });

            // encrypt password 
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            // generate token 
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
            res.status(500).json("server error");
        }
    }
);

module.exports = router; 