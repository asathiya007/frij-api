const mongoose = require("mongoose");

const StorageSchema = new mongoose.Schema({
    organization: {
        type: String, 
        required: true
    }, 
    inventory: [
        {
            name: {
                type: String, 
                required: true
            }, 
            expDate: {
                type: Date,
                required: true 
            }, 
            price: {
                type: Number, 
                required: true
            }
        }
    ]
}); 

module.exports = Storage = mongoose.model("storage", StorageSchema);