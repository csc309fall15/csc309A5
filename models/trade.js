var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Trade = new Schema({
    title: String,
    desc: String,
    itemReq: String,
    itemGive: String,
    userID: String,
    date: String,
    beenReq: Boolean
});

module.exports = mongoose.model('Trade', Trade);