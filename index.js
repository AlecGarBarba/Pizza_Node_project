/**
 * Primary file for the API
 * Author: Alec García Barba
 * Date: 27-feb-2021
 */
/**
 * Debugging example command in powershell (windows)
 * $env:NODE_DEBUG='server'; node index.js
 */

const server = require('./lib/server');

const app = {};

app.init = ()=>{
    server.init();
};


//execute
app.init();


//Export the app;
module.exports = app;