const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');
const Dishes = require('../models/dishes');
//const fs = require('session-file-store');
//const User = require('../models/user');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({ user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    //console.log(item._id)
    item = req.body;
    //console.log(req.user._id.toString());
    Favorites.findOne({ user: req.user._id}, (err, favorite) => {
        if (err) {
            return next(err);
        }
        // If favorite folder under this user does not exist, then we need to initialize the folder
        if (!favorite) {
            Favorites.create({user: req.user._id})
            .then((favorite) => {
                for (var i = 0; i < item.length; i++) {
                    favorite.dishes.push(item[i]);
                }
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    //.populate('user')
                    //.populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                })
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        // If favorite folder under this user already exists, then update directly
        else {
            for (var i = 0; i < item.length; i++) {
                // Ensure no duplicated entries of dish_id.
                if (favorite.dishes.indexOf(item[i]._id) === -1) {
                    favorite.dishes.push(item[i]);
                }
            }
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                //.populate('user')
                //.populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
            .catch((err) => next(err));
        }
    }) 
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOneAndRemove({ 'user': req.user._id}, (err, resp) => {
        if (err) {
            return next(err);
        }
        else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }
    });
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/ ' + req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Dishes.findById(req.params.dishId)
    //.populate('user')
    //.populate('dishes')
    .then((dish) => {
        if (dish != null) {
            Favorites.findOne({ user: req.user._id}, (err, favorite) => {
                if (err) {
                    return next(err);
                }
                // If favorite folder under this user does not exist, then we need to initialize the folder
                if (!favorite) {
                    Favorites.create({user: req.user._id})
                    .then((favorite) => {
                        favorite.dishes.push({ "_id": dish._id });
                        favorite.save()
                        .then((favorite) => {
                            Favorites.findById(favorite._id)
                            //.populate('user')
                            //.populate('dishes')
                            .then((favorite) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                        })
                    }, (err) => next(err))
                    .catch((err) => next(err));
                }
                // If favorite folder under this user already exists, then update directly
                else {
                    // Ensure no duplicated entries of dish_id.
                    if (favorite.dishes.indexOf(dish._id) === -1) {
                        favorite.dishes.push({ "_id": dish._id });
                        favorite.save()
                        .then((favorite) => {
                            Favorites.findById(favorite._id)
                            //.populate('user')
                            //.populate('dishes')
                            .then((favorite) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                        })
                    }
                    else {
                        err = new Error('Dish ' + req.params.dishId + ' was already added');
                        res.statusCode = 403;
                        return next(err);
                    }
                }
            }) 
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id}, (err, favorite) => {
        if (err) {
            return next(err);
        }
        else if (favorite.dishes.indexOf(req.params.dishId) >= 0) {
            // The second parameter of splice is the number of elements to remove. 
            favorite.dishes.splice(favorite.dishes.indexOf(req.params.dishId), 1);
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                //.populate('user')
                //.populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
            .catch((err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    })
});

module.exports = favoriteRouter;