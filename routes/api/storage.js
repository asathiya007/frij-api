const express = require("express");
const tokenauth = require("../../middleware/tokenauth");
const Storage = require("../../models/Storage");
const {check, validationResult} = require("express-validator");

const router = express.Router();

// @route   GET api/storage/test
// @desc    test storage route
// @access  public
router.get("/test", (req, res) => res.json("storage route"));

// @route   GET api/storage
// @desc    get current storage of items
// @access  private
router.get("/", tokenauth, async (req, res) => {
    try {
        // obtain organization of user 
        const user = await User.findById(req.user.id);
        const organization = user.organization;

        // get the storage associated with that organization 
        const storage = await Storage.findOne({ organization });

        // check if storage exists 
        if (!storage) {
            return res.json("no storage exists for this organization");
        }

        res.json(storage);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("server error");
    }
});

// @route   POST api/storage
// @desc    add items to storage, create storage if one does not exist
// @access  private
router.post("/", 
    [
        tokenauth,
        check("name", "please provide a name").not().isEmpty(),
        check("expDate", "please provide an expiration date").isISO8601(),
        check("price", "please provide a valid price").isCurrency()
    ], 
    async (req, res) => { 
        try {
            // obtain organization of user 
            const user = await User.findById(req.user.id);
            const organization = user.organization;

            // get the storage associated with that organization 
            let storage = await Storage.findOne({ organization });
            
            // check no storage exists, create storage 
            if (!storage) {
                storage = new Storage({
                    organization,
                    inventory: []
                });
            }

            // add the item into storage 
            storage.inventory.push(req.body); 

            await storage.save(); 
            res.json(storage);
        } catch (err) {
            console.error(err.message);
            res.status(500).json("server error");
        }
    }
);

module.exports = router; 