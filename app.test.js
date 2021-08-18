import app from './app.js';
import request from 'supertest';


describe('POST /employee', () => {
    test('should be able to post an employee to the database', async () => {
        let response = await request(app).post('/employee').send({
            first_name: "Mark",
            last_name: 'Doe',
            auth_hash: "9183yr8ohib3109fh9j3930jh901jh1f93",
            rate: 12.00,
            is_manager: false
        });
        let actual = response.body[0];
        expect(actual.first_name).toEqual('Mark')
        expect(actual.last_name).toEqual('Doe')
        expect(actual.auth_hash).toEqual("9183yr8ohib3109fh9j3930jh901jh1f93")
        expect(actual.rate).toEqual("$12.00")
        expect(actual.is_clocked_in).toEqual(false)
        expect(actual.is_manager).toEqual(false)
    })
});

describe('GET /lastEmployee', () => {
    test('should be able to get the last employee entry by highest employee id', async () => {
        let response = await request(app).get('/lastEmployee')
        let actual = response.body[0];
        expect(actual.employee_id).toBeTruthy()
        expect(actual.first_name).toBeTruthy()
        expect(actual.last_name).toBeTruthy()
    })
})
async function getLastEmp() {
    let lastEmp = await request(app).get('/lastEmployee')
    return lastEmp.body[0].employee_id
}

describe('POST /timelog', () => {
    test('it should create a time log', async () => {
        let empID = await getLastEmp()
        let response = await request(app).post('/timelog').send({
            employee_id: empID
        })
        let actual = response.body[0];
        expect(actual.sign_in_id).toBeTruthy()
        expect(actual.employee_id).toEqual(empID)
        expect(actual.clock_in).toBeTruthy()
        expect(actual.clock_Out).toBeFalsy()
        let responseTwo = await request(app).post('/timelog').send({
            employee_id: empID
        })
        let actualTwo = responseTwo.body[0];
        expect(actualTwo.sign_in_id).toBeTruthy()
        expect(actualTwo.employee_id).toEqual(empID)
        expect(actualTwo.clock_in).toBeTruthy()
        expect(actualTwo.clock_Out).toBeFalsy()
    })
})

describe('PUT /timelog', () => {
    test('should be able to add the clockout field to a specific timelog', async () => {
        let empID = await getLastEmp()
        let response = await request(app).put('/timelog').send({
            employee_id: empID
        })
        let actual = response.body[0];
        expect(actual.sign_in_id).toBeTruthy()
        expect(actual.employee_id).toEqual(empID)
        expect(actual.clock_in).toBeTruthy()
        expect(actual.clock_out).toBeTruthy()
    })
})

describe('GET /employee/:id', () => {
    test('should be able to get an employee by specific id', async () => {
        let empID = await getLastEmp()
        let response = await request(app).get(`/employee/${empID}`)
        let actual = response.body[0];
        expect(actual.first_name).toEqual('Mark')
        expect(actual.last_name).toEqual('Doe')
        expect(actual.auth_hash).toEqual("9183yr8ohib3109fh9j3930jh901jh1f93")
        expect(actual.rate).toEqual("$12.00")
        expect(actual.is_clocked_in).toEqual(false)
        expect(actual.is_manager).toEqual(false)
    })
})

describe('GET /employees', () => {
    test('should be able to get all the employees', async () => {
        let response = await request(app).get(`/employees`)
        let actual = response.body;
        expect(actual.length).toBeGreaterThan(0)
        expect(actual[0].employee_id).toBeTruthy()
    })
})

describe('GET /timelogs', () => {
    test('should be able to get all time logs', async () => {
        let response = await request(app).get(`/timelogs`)
        let actual = response.body;
        expect(actual.length).toBeGreaterThan(0)
    })
})

describe('GET /timelog/:id', () => {
    test('should be able to get all time logs for a specific employee and format it.', async () => {
        let empID = await getLastEmp()
        let response = await request(app).get(`/timelog/${empID}`)
        let actual = response.body;
        expect(actual.length).toBeGreaterThan(0)
    })
})

describe('DELETE /employee', () => {
    test('should delete an employee from the users table by employee id', async () => {
        let empID = await getLastEmp()
        let response = await request(app).delete('/employee').send({
            employee_id: empID
        })
        let actual = response.body.message;
        expect(actual).toEqual('success')
    })
})