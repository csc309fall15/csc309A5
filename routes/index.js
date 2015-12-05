var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Trade = require('../models/trade');
var mongoose = require('mongoose');
var router = express.Router();

var app = express();

var multer  = require('multer');
var upload = multer({ dest: './public/images' });

/* GET home page. */
router.get('/', function(req, res) {
    res.render("index", {user : req.user});
});

/* GET registration page */
router.get('/register', function(req, res) {
    res.render('register', { });
});

/* Reister new User*/
router.post('/register', function(req, res) {
    // First user automatically super admin
    var first = false;
    Account.count({}, function(err, count) {
        if (count == 0){
            first = true;
        }
        Account.register(new Account({ displayname : req.body.displayname, username : req.body.username, sys : first, super : first}),
            req.body.password, function(err, account) {
            // Email address uniquely identifies a user
            if (err) {
                return res.render("register", {info: "Sorry. That email already exists. Try again."});
            }
            passport.authenticate('local')(req, res, function () {
                res.redirect('/');
            });
        });
    });
});

/* GET login page*/
router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

router.post('/login', function(req, res) {
    Account.findOne({username : req.body.username}, function(err, account) {
        if (account==null) {
            return res.render("login", {info: "Sorry, email address not found."});
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/profiles', function(req,res) {
    Account.find({ }, function (err, accounts) {
        var accountMap = {};

        accounts.forEach(function(account) {
            accountMap[account._id] = account;
        });
    res.render("profiles", {user : req.user, accounts: accountMap});
    });
});

router.post('/profiles', function(req, res) {
    console.log(req.body._id);
    Account.findById(req.body._id, function(err, account) {
        console.log(account._id);
        res.render("profile", {info: account});
    });
})

router.get('/profile', function(req, res) {
    res.render("profile", {user : req.user, info : account});
});

router.get('/admin', function(req, res) {
    Account.find({ }, function (err, accounts) {
        var accountMap = {};
        accounts.forEach(function(account) {
            accountMap[account._id] = account;
        });
        Trade.find({}, function (err, trades) {
            var tradeMap = {};
            trades.forEach(function(trade) {
                tradeMap[trade._id] = trade;
            });
            res.render('admin', {accounts: accountMap, trades: tradeMap});
        });
    });
});

router.post('/admin', function(req, res) {
    Account.findById(req.body._id, function(err, account) {
        console.log(account._id);
        res.render("account", {info: account, user : req.user});
    });
});

router.get('/account', function(req, res) {
    res.render("account", {info: account, user : req.user});
});

router.post('/account', function(req, res) {
    console.log(req.body);
    Account.findOne({username : req.body.username}, function(err, account) {
        account.username = req.body.username;
        account.displayname = req.body.displayname;
        account.description = req.body.description;
        if(req.body.super){
            account.super = true;
            account.sys = true;
        }
        else if(req.body.sys){
            account.super = false;
            account.sys = true;
        }
        else{
            account.super = false;
            account.sys = false;
        }
        if (req.body.delete){
            Account.find({_id : account._id}).remove().exec();
        }
        account.save();
    });
    res.redirect('/admin');
})

router.get('/edit', function(req, res) {
    res.render('edit', {user : req.user});
});

router.post('/edit', function(req, res) {
    Account.findById(req.user._id, function(err, account) {
        if (req.body.username != ""){
            account.username = req.body.username;}
        if (req.body.displayname != ""){
            account.displayname = req.body.displayname;}
        if (req.body.description != ""){
            account.description = req.body.description;}
        if (req.body.currentpassword != "" && req.body.currentpassword == account.password){
          account.password = req.body.newpassword;}
        account.save();

    });
    res.redirect('/');
});

router.get('/upload', function(req, res) {
    res.render('upload', {user : req.user});
});

router.post('/upload', upload.single('displayImage' || 'tradeImage'), function(req, res) {
    console.log(req.file);
    if(req.file != undefined) {
        if (req.file.fieldname == 'displayImage') {
            Account.findById(req.user._id, function(err, account) {
                account.avatar = req.file.filename;
                account.save();
            }); 
        }
        if (req.file.fieldName == 'tradeImage') {
        }         
    }
    res.redirect('/');     
})

router.get('/ping', function(req, res) {
    res.status(200).send("pong!");
});

router.get('/maketrade', function(req, res) {
    res.render('maketrade', {user: req.user});
});

router.post('/maketrade', function(req, res) {
    var trade = new Trade();
    trade.title = req.body.tradetitle;
    trade.desc = req.body.tradedesc;
    trade.itemReq = req.body.tradereq;
    trade.itemGive = req.body.tradeitems;
    trade.userID = req.user._id;
    trade.date = Date.now();
    trade.beenReq = false;
    trade.save(function (err) { if (err) return console.error(err); });
    res.redirect('/tradelist');
});

router.get('/tradelist', function(req,res) {
    Trade.find({}, function (err, trades) {
        var tradeMap = {};

        trades.forEach(function(trade) {
            tradeMap[trade._id] = trade;
        });
    res.render("tradelist", {user : req.user, trades: tradeMap});
    });
});

router.post('/tradelist', function(req, res) {
    console.log(req.body._id);
    Trade.findById(req.body._id, function(err, trade) {
        console.log(trade._id);
        res.render("trade", {info: trade});
    });
});

router.get('/trade', function(req, res) {
    res.render("trade", {user : req.user, info : trade});
});


module.exports = router;