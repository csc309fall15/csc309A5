var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Trade = new Schema({
    title: String,
    desc: String,
    itemReq: String,
    itemGive: String,
    userID: String,
    date: String,
    beenReq: Boolean
});

Trade.plugin(passportLocalMongoose);

module.exports = mongoose.model('Trade', Trade);