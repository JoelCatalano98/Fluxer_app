const http = require('http'); 
const jwt = require('jsonwebtoken'); 
const token = jwt.sign({id: 1, email:'admin@admin.com', rol:'ADMIN', permisos: {permisoFinanzas: true}}, 'cc6bbfca6ce13d83a3c5abe432577d06690cb7f443cbb06a861d7d6a0bcfee7a0114ce2f74f83ca5299177302d22d3ad1e2c9a9f89aefcf224aca3046ff4464a', {expiresIn:'1h'}); 
http.get('http://localhost:5000/api/dashboard?rango=semanal', { headers: { 'Authorization': 'Bearer ' + token } }, res => { 
  let data = ''; 
  res.on('data', chunk => data += chunk); 
  res.on('end', () => console.log(data)); 
}).on('error', console.error);
