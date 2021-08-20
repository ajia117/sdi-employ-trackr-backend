import db from './db/db.js';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json())
app.use(cors())

function handleError(res, e) {
    console.log('ERROR: ', e);
    res.statusCode = 404;
    console.log('handled an error')
    res.send();
};

function getLastSunday() {
    let today = new Date()
    let curMil = today.getMilliseconds()
    let curSec = today.getSeconds()
    let curMin = today.getMinutes()
    let curHour = today.getHours()
    let dayMilliSeconds = (((curHour * 60 * 60) + (curMin * 60) + curSec) * 1000) + curMil
    let lastSundayMidnight = new Date(today - ((86400000 * today.getDay()) + dayMilliSeconds))
    return lastSundayMidnight;
}

function subtractWeek(initVal) {
    let retVal = new Date(initVal - 604800000)
    return retVal;
}

app.get('/lastEmployee', (req, res) => {
    db.any('SELECT * FROM Users ORDER BY "employee_id" DESC LIMIT 1;')
        .then(data => res.send(data))
        .catch((e) => {
            handleError(res, e)
        })
})

app.post('/employee', (req, res) => {
    let input = req.body
    db.any(`INSERT INTO Users("first_name", "last_name", "auth_hash", "is_clocked_in", "rate", "is_manager") VALUES('${input.first_name}', '${input.last_name}', '${input.auth_hash}', false, ${input.rate}, ${input.is_manager});`)
        .then(() => {
            db.any(`SELECT * FROM Users ORDER BY "employee_id" DESC LIMIT 1;`)
                .then(data => res.send(data))
                .catch((e) => {
                    handleError(res, e)
                })
        })
        .catch((e) => {
            handleError(res, e)
        })
})

app.post('/timelog', (req, res) => {
    let empID = req.body.employee_id
    db.any(`INSERT INTO Time_Table("employee_id", "clock_in") VALUES(${empID}, NOW());`)
        .then(() => {
            db.any(`UPDATE Users SET "is_clocked_in"=true WHERE "employee_id"=${empID};`)
            db.any('SELECT * FROM Time_Table ORDER BY "sign_in_id" DESC LIMIT 1')
                .then(data => {
                    res.send(data)
                })
                .catch((e) => {
                    handleError(res, e)
                })
        })
        .catch((e) => {
            handleError(res, e)
        })
})

app.put('/timelog', (req, res) => {
    let empID = req.body.employee_id
    db.any(`SELECT "sign_in_id" FROM Time_Table WHERE "employee_id"=${empID} ORDER BY "sign_in_id" DESC LIMIT 1;`)
        .then((data) => {
            let id = data[0].sign_in_id
            db.any(`UPDATE Time_Table SET "clock_out"=NOW() WHERE "sign_in_id"=${id};`)
                .then(() => {
                    db.any(`UPDATE Users SET "is_clocked_in"=false WHERE "employee_id"=${empID};`)
                    db.any(`SELECT * FROM Time_Table WHERE "sign_in_id"=${id};`)
                        .then(data => {
                            res.send(data)
                        })
                        .catch((e) => {
                            handleError(res, e)
                        })
                })
                .catch((e) => {
                    handleError(res, e)
                })
        })
        .catch((e) => {
            handleError(res, e)
        })
})

app.delete('/employee', (req, res) => {
    let empID = req.body.employee_id
    db.any(`DELETE FROM Users WHERE "employee_id"=${empID};`)
        .then(() => {
            db.any(`SELECT * FROM Users WHERE "employee_id"=${empID};`)
                .then(data => {
                    if (data.length === 0) {
                        res.send({message: 'success'})
                    } else {
                        res.send({message: 'failure'})
                    }
                })
                .catch((e) => {
                    handleError(res, e)
                })
        })
})

app.get('/employee/:id', (req, res) => {
    let empID = req.params.id
    db.any(`SELECT * FROM Users WHERE "employee_id"=${empID};`)
        .then(data => {
            res.send(data)
        })
        .catch((e) => {
            handleError(res, e)
        })
})

app.get('/employees', (req, res) => {
    db.any(`SELECT * FROM Users;`)
        .then(data => {
            res.send(data)
        })
        .catch((e) => {
            handleError(res, e)
        })
})

app.get('/timelogs', (req, res) => {
    db.any(`SELECT * FROM Time_Table;`)
        .then(data => {
            res.send(data)
        })
        .catch((e) => {
            handleError(res, e)
        })
})

app.get('/timelog/:id', (req, res) => {
    let id = req.params.id
    db.any(`SELECT * FROM time_table WHERE "employee_id"=${id} ORDER BY "sign_in_id" DESC;`)
        .then(list => {
            var data = list;
            console.log(data);
            db.any(`SELECT * FROM users WHERE "employee_id"=${id};`)
                .then((empdata) => {
                    let emp = empdata[0]
                    let sendArr = [];
                    let buildObj = {};
                    let lastSunday = getLastSunday()
                    let buildArr = [];
                    for (let i=0;i<data.length;i++) {
                        let item = data[i];
                        buildArr.push(item)
                        const buildSend = () => {
                            let workWeekStart = `${lastSunday.getFullYear()}-${lastSunday.getMonth()}-${lastSunday.getDate()}`
                            let hoursWorked = 0.00;
                            for (let j=0;j<buildArr.length;j++) {
                                let curObj = buildArr[j]
                                if (curObj.clock_in !== null && curObj.clock_out !== null) {
                                    let dayHours = Math.round(((((curObj.clock_out - curObj.clock_in) / 1000) / 60) / 60) * 100) / 100;
                                    hoursWorked += dayHours;
                                }
                            }
                            let totalPay = Math.round((Number(emp.rate.substring(1,emp.rate.length)) * hoursWorked) * 100) / 100
                            let hoursArr = ((`${hoursWorked}`).split('.'))
                            if (hoursArr[1] && hoursArr[1].length < 2) {
                                while (hoursArr[1].length < 2) {
                                    hoursArr[1] += '0'
                                }
                            }
                            let hoursStr = hoursWorked //`${hoursArr[0]}.${hoursArr[1].substring(0,2)}`
                            let payArr = ((`${totalPay}`).split('.'))
                            if(!payArr[1]) {
                                payArr[1] = '00';
                            }
                            /*
                            if (payArr[1].length < 2) {
                                while (payArr[1].length < 2) {
                                    payArr[1] += '0'
                                }
                            }
                            */
                            let payStr = `$${payArr[0]}.${payArr[1].substring(0,2)}`
                            buildObj = {
                                employee_id: id,
                                work_week: workWeekStart,
                                pay_rate: emp.rate,
                                hours_worked: hoursStr,
                                weeks_pay: payStr
                            }
                            sendArr.push(buildObj);
                            buildArr = [];
                            lastSunday = subtractWeek(lastSunday)
                        }
                        if (data[i+1]) {
                            if (data[i+1].clock_in < lastSunday) {
                                buildSend()
                            }
                        } else {
                            buildSend()
                        }
                    }
                    res.send(sendArr);
                })
        })
        .catch((e) => {
            handleError(res, e)
        })
})

export default app;