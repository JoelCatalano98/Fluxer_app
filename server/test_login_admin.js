const { login } = require('./src/controllers/auth.controller.js');
const req = { body: { loginInput: 'admin', password: '123456' } };
const res = { 
    status: (code) => ({ json: (data) => console.log('Response:', code, data) }),
    json: (data) => console.log('Response:', 200, data)
};
login(req, res).then(() => console.log('Done')).catch(console.error);
