const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const path = require("path")
const fs = require("fs")
const ajv = new Ajv()
const util = require('util');
const exec = util.promisify(require('child_process').exec);
require("dotenv").config();

addFormats(ajv)


const { readJson, writeJson } = require("./dataAPI")

const studentInfo = {
    Robert: {
        fullName: "Robert Frase",
        parentName: "Eddie Jacobs",
        email: "robertrf@gmail.com",
        rate: 50
    },
    Charles: {
        fullName: "Charles Murphy",
        parentName: "Sarah Rollo",
        email: "charlesm@gmail.com",
        rate: 60
    }, 
    Beverly: {
        fullName: "Beverly Todd",
        parentName: "Ann Rivera",
        email: "beverly@gmail.com",
        rate: 60
    },
    Dolores: {
        fullName: "Dolores Umbridge",
        parentName: "Maria Williams",
        email: "dolores@pottermail.com",
        rate: 60
    },
    Lori: {
        fullName: "Lori Walters",
        parentName: "Alfredo L. Fleener",
        email: "lorilwalters@gmail.com",
        rate: 70
    }
}

async function getStudentInfo(req, res, next) {
    try {
        return res.json(studentInfo);
    } catch (err) {
        return next(err);
    }
}

async function logTutoring(req, res, next) {
    console.log(req.body.log)

    const logSchema = {
        type: "object",
        properties: {
            date: { type: "string", format: "date"},
            student: {type: "string"},
            hours: {type: "number"},
            cost: {type: "number"},
            description: {type: "string"},
            paid: {type: "boolean"}
        },
        required: ["date", "student", "hours", "cost", "description", "paid"]
    }
    const validate = ajv.compile(logSchema)
    console.log("valid: " + validate(req.body.log))

    if (validate.errors) {
        for (const myError of validate.errors) {
            console.error(myError)
        }
        let err = new Error("Invalid log type")
        err.status = 400
        return next(err)
    }

    try {
        const logPath = path.join(__dirname + "/../databases/log.json")
        const log = await readJson(logPath)
        log.push(req.body.log)
        await writeJson(logPath, log)
        return res.sendFile(logPath);
    } catch (err) {
        return next(err);
    }
}

async function getLogs(req, res, next) {
    try {
        res.sendFile(path.join(__dirname + '/../databases/log.json'));
    } catch (err) {
        return next(err);
    }
}

async function getUnpaidLessons(req, res, next) {
    if (req.body.student === undefined) {
        let err = new Error("Details not entered correctly.")
        err.status = 400
        return next(err)
    }
    // Read in files and set up variables
    // Logs
    let logs = await readJson(path.join(__dirname + '/../databases/log.json'))
    logs = logs.filter(log => log.student === req.body.student && !log.paid)

    return res.json(logs)
}

async function generateInvoice(req, res, next) {
    if (req.body.student === undefined || req.body.paymentRecieved === undefined) {
        let err = new Error("Details not entered correctly.")
        err.status = 400
        return next(err)
    }
    // Read in files and set up variables
    // Logs
    let logs = await readJson(path.join(__dirname + '/../databases/log.json'))
    logs = logs.filter(log => log.student === req.body.student && !log.paid)
    // Tex template
    let myTex = fs.readFileSync(path.join(__dirname + "/../invoices/invoice_template.tex"), "utf8")
    // Index
    const logIndex = fs.readFileSync(path.join(__dirname + "/../databases/index.txt"), "utf8")
    // Parent name
    const { parentName } = studentInfo[req.body.student]
    // Generate session info
    const table_outputs = logs.map(log => `\\ ${log.date} & \\centering\\$${0.00} & \\centering ${log.hours} & \\centering  & \\$${log.cost}\\\\[2.5ex]\\hline\n& & & &\\\\`)
    const total_payment = logs.map(log => log.cost).reduce((accumulator, currentValue) => {
        return accumulator + currentValue
    }, 0);

    // The date is done automatically :)
    myTex = myTex.replace("TABLE_OUTPUTS", table_outputs.join("\n"))
    myTex = myTex.replace("INVOICE_NUMBER", logIndex.padStart(5, "0"))
    myTex = myTex.replace("PARENT_NAME", parentName)
    myTex = myTex.replace("TOTAL_PAYMENT", total_payment)
    myTex = myTex.replace("PAYMENT_RECIEVED", req.body.paymentRecieved)

    balance_due = parseFloat(total_payment) - parseFloat(req.body.paymentRecieved)
    if (balance_due >= 0) {
        myTex = myTex.replace("BALANCE_DUE", balance_due)
    } else {
        myTex = myTex.replace("BALANCE_DUE", Math.abs(balance_due))
        myTex = myTex.replace("Balance due", "Credit")
    }

    fs.writeFileSync(path.join(__dirname + "./../invoices/out.tex"), myTex)

    try {
        command = "cd " + path.join(__dirname + "./../invoices/").replace(" ", "\ ") + "; xelatex --interaction=batchmode out.tex"
        const { stdout, stderr } = await exec(command);
        // console.log('stdout:', stdout);
        // console.log('stderr:', stderr);
    } catch (err) {
        return next(err)
    }


    try {
        const pdfData = fs.readFileSync(path.join(__dirname + "./../invoices/out.pdf"));
        res.setHeader('content-type', 'application/pdf');
        return res.send(pdfData);
        // next(); is not needed here because you've just responded to the request.
        // res.sendFile(path.join(__dirname + '/../views/clientPage.html'));
    } catch (err) {
        return next(err);
    }
}

module.exports = { getStudentInfo, logTutoring, getLogs, getUnpaidLessons, generateInvoice }