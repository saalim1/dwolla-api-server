const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const indexController = require('../controllers/index');
const dwolla = require('dwolla-v2');
const appKey = process.env.DWOLLA_KEY;
const appSecret = process.env.DWOLLA_SECRET;
const client = new dwolla.Client({
    key: appKey,
    secret: appSecret
    // environment: 'sandbox' // optional - defaults to production
});
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: '',
        pass: ''
    }
});

router.get('/', (req, res, next) => {
    var authId = req.params.id;
    const renderObject = {};
    db.any("SELECT hotels.*, COUNT(workers.*) FROM hotels LEFT JOIN workers ON workers.hotel_id=hotels.id AND (workers.status = 1 OR workers.status = 0) WHERE hotels.status != 2 GROUP BY hotels.id ORDER BY hotels.name")
        .then((results) => {
            res.json(results).status(200);
        })
        .catch((error) => {
            next(error);
        });
});

router.get('/count_workers/:hotel_id', (req, res, next) => {
    const hotel = {
        id: req.params.hotel_id
    };
    db.any(`SELECT COUNT(*) FROM workers WHERE hotel_id=${hotel.id} AND status!="2"`, hotel.id)
        .then((results) => {
            res.json(results).status(200);
        })
        .catch((error) => {
            next(error);
        });
});

router.post('/', (req, res, next) => {
    const hotel = {
        name: req.body.name,
        city: req.body.city,
        address: req.body.address,
        zip_code: req.body.zip_code,
        email: req.body.contact_email,
        emp_name: req.body.emp_name,
        slug: req.body.slug,
        departments: ['Housekeeping']
    };

    //res.json("Success").status(200);
    async.waterfall([
            /*function(done) {
                client.auth.client()
                    .then((results) => {
                        var accountToken = new client.Token({ access_token: results.access_token });
                        var requestBody = {
                            limit: 1,
                            search:hotel.email
                        };

                        accountToken
                            .get('customers', requestBody)
                            .then((result) => {
                                // console.log(result);
                                if (result.body._embedded.customers && result.body._embedded.customers[0]) {
                                    done("Account with email " + hotel.email + " already exist in dwolla");
                                    // done(result);
                                } else {
                                    done(null, 'ok');
                                }
                            }).catch((error) => {
                                done(error);
                            });
                    }).catch((error) => {
                        done(error);
                    });
            },*/
            function( /*ok,*/ done) {
                db.any(`SELECT email FROM workers WHERE email = '${hotel.email}'`)
                    .then((result) => {
                        if (result && result[0]) {
                            done("Account with email " + hotel.email + " already exist");
                        } else {
                            done(null, 'ok');
                        }
                    });
            },
            function(ok, done) {
                db.any(`SELECT email FROM hotels WHERE email = '${hotel.email}'`)
                    .then((result) => {
                        if (result && result[0]) {
                            done("Account with email " + hotel.email + " already exist");
                        } else {
                            done(null, 'ok');
                        }
                    });
            },
            function(ok, done) {
                db.any(`SELECT slug FROM hotels WHERE slug = '${hotel.slug}'`)
                    .then((result) => {
                        if (result && result[0]) {
                            done("Hotel with slug '" + hotel.slug + "' is already exist! Please use different name.");
                        } else {
                            done(null, 'ok');
                        }
                    });
            },
             function(ok, done) {
                client.auth.client()
                    .then((results) => {
                        var accountToken = new client.Token({ access_token: results.access_token });
                        var requestBody = {
                            firstName: hotel.emp_name,
                            lastName: "worker",
                            email: hotel.email,
                            type: 'receive-only'
                        };

                        accountToken
                            .post('customers', requestBody)
                            .then((result) => {
                                var href = result.headers.get('location');
                                var cust_id = href.substring(href.lastIndexOf("/") + 1, href.length);
                                done(null, cust_id);
                            }).catch((error) => {
                                done(error);
                            });
                    }).catch((error) => {
                        done(error);
                    });
            },
            function(cust_id, done) {
                if (!hotel.slug) {
                    hotel.slug = "hotel";
                }
                db.any(`INSERT INTO hotels (name, city, address, zip_code, email, status, departments, slug) VALUES ('${hotel.name}', '${hotel.city}', '${hotel.address}', '${hotel.zip_code}', '${hotel.email}', 1, '{${hotel.departments}}', '${hotel.slug}')`)
                    .then((result) => {
                        done(null, cust_id);
                    })
                    .catch((error) => {
                        done(error);
                    });
            },
            function(cust_id, done) {
                db.any(`SELECT * FROM hotels WHERE email = '${hotel.email}'`)
                    .then((result) => {
                        console.log(result);
                        done(null, cust_id,result[0]);
                    })
                    .catch((error) => {
                        done(error);
                    });
            },
            function(cust_id,hotelData, done) {
                db.any(`INSERT INTO user_roles (dashboard, admin_employees, tip_comparison, tip_employee, reviews, setting, location, tip_center, worker_employees, user_type, login_type, hotel_id) VALUES (true, true, true, true, true, true, true, true, true, 'worker', '0', ${hotelData.id})`, hotelData.id)
                    .then((result) => {
                        done(null,cust_id, hotelData);
                    })
                    .catch((error) => {
                        done(error);
                    });
            },
            function(cust_id,hotelData, done) {
                db.any(`INSERT INTO user_roles (dashboard, admin_employees, tip_comparison, tip_employee, reviews, setting, location, tip_center, worker_employees, user_type, login_type, hotel_id) VALUES (true, true, true, true, true, true, true, true, true, 'worker', '1', ${hotelData.id})`, hotelData.id)
                    .then((result) => {
                        done(null,cust_id, hotelData);
                    })
                    .catch((error) => {
                        done(error);
                    });
            },

            function(cust_id,hotelData, done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err,cust_id, token, hotelData);
                });
            },
            function(cust_id,token, hotelData, done) {

                const newWorker = {
                    email: hotelData.email,
                    name: hotel.emp_name,
                    hotel_id: hotelData.id,
                    login_type: 0,
                    department: "Housekeeping",
                    token: token

                };
                done(null, token, newWorker,cust_id);
            },
            function(token, newWorker, cust_id, done) {
                db.any(`INSERT INTO workers (name, email, hotel_id, login_type, department, status, password_reset_token, cust_id, activity) SELECT '${newWorker.name}', '${newWorker.email}', ${newWorker.hotel_id}, '${newWorker.login_type}','${newWorker.department}', 1, '${newWorker.token}', '${cust_id}', 'Account verification needed' WHERE NOT EXISTS (SELECT email FROM workers WHERE email=$1)`, newWorker.email)
                    .then((result_insert) => {
                        // console.log(result);
                        //res.send('You added a user!');
                        done(null, token, newWorker);
                        //res.json(result.auth_id).status(200);
                    })
                    .catch((error) => {
                        done(error);
                    });
            },

            function(token, user, done) {
                // console.log('user',user);
                let mailOptions = {};
                if (user.login_type == '1') {
                    mailOptions = {
                        from: '', // sender address
                        to: user.email, // list of receivers
                        subject: 'Welcome', // Subject line
                        text: ''

                    };
                } else if (user.login_type == '0') {
                    mailOptions = {
                        from: '', // sender address
                        to: user.email, // list of receivers
                        subject: 'Welcome to your Dashboard', // Subject line
                        text: ''

                    };
                }
                // console.log(mailOptions);
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        // console.log('err', err);
                        done(error);
                    } else {
                        // console.log('response', response);
                        done(null, { message: "success" });
                    }
                });
            }
        ],
        function(err) {
            if (err) {
                console.log('err', err);
                next(err);
            } else {
                res.json({ message: "success" }).status(200);
            }
        });


});

router.post('/delete', (req, res, next) => {
    const hotel = {
        id: req.body.id
    };
    console.log(hotel.id);
    db.any(`SELECT * FROM workers WHERE hotel_id IN (${hotel.id})`)
        .then(result => {
            async.eachSeries(result, function(worker, cb) {
                    client.auth.client()
                        .then((results) => {
                            var accountToken = new client.Token({ access_token: results.access_token });
                            var customerUrl = `https://api-sandbox.dwolla.com/customers/${worker.cust_id}`;
                            var requestBody = {
                                status: 'deactivated'
                            };
                            accountToken
                                .post(`${customerUrl}`, requestBody)
                                .then(dwolla_result => {
                                    db.tx(t => {
                                            return t.batch([
                                                t.any(`DELETE FROM tips WHERE worker_id = ${worker.id}`),
                                                t.any(`DELETE FROM reviews WHERE worker_id = ${worker.id}`)
                                            ]);
                                        })
                                        .then(delete_result => {
                                            return cb(null, null);
                                        })
                                        .catch(delete_error => {
                                            return cb(delete_error);
                                        });
                                })
                                .catch(error => {
                                    return cb(error);
                                });
                        })
                        .catch(error => {
                            return cb(error);
                        });


                },
                function(err) {
                    if (err) {
                        return next(err);
                    }
                    db.tx(t => {
                            return t.batch([
                                t.any(`DELETE FROM hotels WHERE id IN (${hotel.id})`),
                                t.any(`DELETE FROM workers WHERE hotel_id IN (${hotel.id})`)
                            ]);
                        })
                        .then(delete_result => {
                            res.json({message:'Hotel and its related data has been deleted!'});
                        })
                        .catch(delete_error => {
                            next(delete_error);
                        });
                }
            );
        })
        .catch(error => {
            next(error);
        });
});

router.post('/status', (req, res, next) => {
    const hotel = {
        id: req.body.id,
        status: req.body.status
    };

    //this sql statement only inserts a new worker if their auth_id doesn't already exist
    db.any(`UPDATE hotels SET status=${hotel.status} WHERE id=${hotel.id}`, hotel.id)
        .then((result) => {
            console.log(result);
            //res.send('You added a user!');
            res.json(result).status(200);
            //res.json(result.auth_id).status(200);
        })
        .catch((error) => {
            next(error);
        });
});

router.post('/department', (req, res, next) => {
    const hotel = {
        id: req.body.id,
        departments: req.body.departments
    };

    //this sql statement only inserts a new worker if their auth_id doesn't already exist
    db.any(`UPDATE hotels SET departments='{${hotel.departments}}' WHERE id=${hotel.id}`, hotel.id)
        .then((result) => {
            console.log(result);
            //res.send('You added a user!');
            res.json(result).status(200);
            //res.json(result.auth_id).status(200);
        })
        .catch((error) => {
            next(error);
        });
});
// router.get('/:id', (req, res, next) => {
//   var authId = req.params.id;
//   const renderObject = {};
//   db.any("SELECT * FROM guests WHERE auth_id = $1", authId)
//   .then((results) => {
//     res.json(results).status(200);
//   })
//   .catch((error) => {
//     next(error);
//   });
// });


module.exports = router;
