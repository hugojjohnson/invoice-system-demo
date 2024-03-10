// Requires
const path = require("path");
const cors = require('cors');
const express = require('express')

// User requires
const adminAPI = require("./scripts/adminAPI");

const app = express();
const CURRENT_URL = "https://hugojjohnson.github.io/"

// ========== Set-up middleware (You can move this into a different file if you want to) ==========
// If you want to send JSON, you need this middleware, which sents the Content-Type header.
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});
// Accept JSON from a post request.
app.use(express.urlencoded({ extended: true })); // turn url parameters (e.g. ?name=alan) into req.body.
app.use(express.json()); // parse incoming data into json.
var allowCrossDomain = function (req, res, next) {
    // Something called CORS; I'm not sure what it is but we need this code here.
    res.header('Access-Control-Allow-Origin', CURRENT_URL);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    next();
}
app.use(allowCrossDomain);
app.use(cors({ credentials: true, origin: CURRENT_URL }));
app.use('/public', express.static('public')) // serve static files

// Get student info
app.post("/get-student-info", (req, res, next) => {
    return adminAPI.getStudentInfo(req, res, next);
    // note the RETURN here - otherwise it will also serve page 404.
});

// Log tutoring
app.post("/log-tutoring", (req, res, next) => {
    return adminAPI.logTutoring(req, res, next);
    // note the RETURN here - otherwise it will also serve page 404.
});

// Get logs
app.post("/get-logs", (req, res, next) => {
    return adminAPI.getLogs(req, res, next);
    // note the RETURN here - otherwise it will also serve page 404.
});

// Get unpaid lessons
app.post("/get-unpaid-lessons", (req, res, next) => {
    return adminAPI.getUnpaidLessons(req, res, next);
    // note the RETURN here - otherwise it will also serve page 404.
});


// Generate invoice
app.post("/generate-invoice", (req, res, next) => {
    return adminAPI.generateInvoice(req, res, next);
    // note the RETURN here - otherwise it will also serve page 404.
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Path Not Found');
    err.status = 404;
    next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
    console.error("ERROR:")
    console.error(err.message)
    res.status(err.status || 500);
    res.send(err.message);
});

const port = process.env.PORT || 3001;
app.listen(port);
