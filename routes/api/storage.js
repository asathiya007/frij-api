const express = require("express");
const tokenauth = require("../../middleware/tokenauth");
const Storage = require("../../models/Storage");
const {check, validationResult} = require("express-validator");

const router = express.Router();

// @route   GET api/storage/test
// @desc    test storage route
// @access  public
router.get("/test", (req, res) => res.json({errors: [{msg: "storage route"}]}));

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
            return res.json({errors: [{msg: "no storage exists for this user's organization"}]});
        }

        res.json(storage);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({errors: [{msg: "server error"}]});
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
        // check for errors 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()}); 
        }

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
            res.status(500).json({errors: [{msg: "server error"}]});
        }
    }
);

// @route   DELETE api/storage/items/:id
// @desc    delete an item from storage
// @access  private
router.delete("/items/:id", tokenauth, async (req, res) => {
    // get the id of the food to be removed
    const {id} = req.params;

    if (!id) {
        return res.status(400).json({errors: [{msg: "no food id provided"}]});
    }

    try {
        // obtain organization of user 
        const user = await User.findById(req.user.id);
        const organization = user.organization;

        // get the storage associated with that organization 
        let storage = await Storage.findOne({ organization });

        // check if no storage 
        if (!storage) {
            return res.json({errors: [{msg: "no storage exists for this user's organization"}]});
        }

        // remove item from storage 
        const inventory = [];
        for (item of storage.inventory) {
            if (item.id !== id) {
                inventory.push(item);
            }
        }
        storage.inventory = inventory;

        await storage.save();
        res.json(storage);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({errors: [{msg: "server error"}]});
    }
});

// @route   DELETE api/storage/items/all
// @desc    delete all items from storage
// @access  private
router.delete("/allitems",
    [
        tokenauth,
        check("name", "please provide a name").not().isEmpty(),
        check("expDate", "please provide an expiration date").isISO8601(),
        check("price", "please provide a valid price").isCurrency()
    ],
    async (req, res) => {
        // check for errors 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { name, expDate, price } = req.body;
        expDate = new Date(expDate);

        try {
            // obtain organization of user 
            const user = await User.findById(req.user.id);
            const organization = user.organization;

            // get the storage associated with that organization 
            let storage = await Storage.findOne({ organization });

            // check if the storage does not exist
            if (!storage) {
                return res.json({errors: [{msg: "no storage exists for this user's organization"}]});
            }

            // remove the specified foods from inventory 
            const inventory = [];
            for (item of storage.inventory) {
                if (item.name === name && item.expDate === expDate
                    && item.price === price) {
                    inventory.push(item);
                }
            }
            storage.inventory = inventory;

            await storage.save();
            res.json(storage);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({errors: [{msg: "server error"}]});
        }
    }
);

// @route   DELETE api/storage/storage
// @desc    delete the storage itself 
// @access  private
router.delete("/storage", tokenauth, async (req, res) => {
    try {
        // obtain organization of user 
        const user = await User.findById(req.user.id);
        const organization = user.organization;

        // delete the storage associated with that organization
        await Storage.findOneAndDelete({ organization });

        res.json({errors: [{msg: "deleted storage"}]});
    } catch (err) {
        console.error(err.message);
        res.status(500).json({errors: [{msg: "server error"}]});
    }
});

// to get today's date
const curdate = () => {
    const today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return (yyyy + "-" + mm + "-" + dd);
};

// @route   PUT api/storage/remove_expired
// @desc    obtain the monetary value of the foods that expired today 
// @access  private
router.put("/remove_expired", tokenauth, async (req, res) => {
    try {
        // get today's date
        const today = new Date(curdate());

        // obtain organization of user 
        const user = await User.findById(req.user.id);
        const organization = user.organization;

        // get the storage associated with that organization 
        let storage = await Storage.findOne({ organization });

        // check if the storage does not exist
        if (!storage) {
            return res.json({errors: [{msg: "no storage exists for this user's organization"}]});
        }

        // remove the specified foods from inventory 
        const expired = [];
        const inventory = [];
        for (item of storage.inventory) {
            if (new Date(item.expDate.toString().slice(0, 10)) <= new Date(today.toString().slice(0, 10))) {
                expired.push(item);
            } else {
                inventory.push(item);
            }
        }
        storage.inventory = inventory; 

        await storage.save();
    
        // calculate cost of expired items
        let expiredCost = 0; 
        for (item of expired) {
            expiredCost += item.price; 
        }

        res.json({ expired, expiredCost });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({errors: [{msg: "server error"}]});
    }
});

// to add days to a date
const addDays = (date, days) => {
    const ms = new Date(date).getTime() + 86400000 * days;
    return new Date(ms);
}

// @route   GET api/storage/predict_expired/:days
// @desc    obtain the monetary value of the foods that will expire
// @access  private
router.get("/predict_expired/:days", tokenauth, async (req, res) => {
    // get today's date, the number of days to add, and future day
    const today = new Date(curdate());
    const days = req.params.days; 

    // calculate future date
    const futureDate = addDays(today, days);
    
    // obtain organization of user 
    const user = await User.findById(req.user.id);
    const organization = user.organization;

    // get the storage associated with that organization 
    let storage = await Storage.findOne({ organization });

    // check if the storage does not exist
    if (!storage) {
        return res.json({errors: [{msg: "no storage exists for this user's organization"}]});
    }

    // remove the specified foods from inventory 
    const willExpire = [];
    for (item of storage.inventory) {
        if (new Date(item.expDate.toString().slice(0, 10)) 
            <= new Date(futureDate.toString().slice(0, 10))) {
            willExpire.push(item);
        }
    }

    await storage.save();

    // calculate cost of expired items
    let expiredCost = 0;
    for (item of willExpire) {
        expiredCost += item.price;
    }

    res.json({willExpire, expiredCost});
});

module.exports = router; 

