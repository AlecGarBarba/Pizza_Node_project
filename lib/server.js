
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers= require('./handlers');
const fs = require('fs')
const helpers = require('./helpers');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

const server = {};

server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'../https/cert.pem'))
};
 
server.httpServer = http.createServer((req,res)=>{
    server.unifiedServer(req,res);
})

server.httpsServer = https.createServer( server.httpsServerOptions,(req,res)=>{
    server.unifiedServer(req,res);
})
 
server.unifiedServer = (req,res)=>{
    let parsedUrl = url.parse(req.url, true); //this true  is to get querystring.
    let path = parsedUrl.pathname; //key set on parsedUrl, it is the untrimmed path the user requested
    let trimmedPath = path.replace(/^\/+|\/+$/g,''); //Trimms slashes at the beggining and the end
    let queryStringObject = parsedUrl.query;
    let method = req.method.toLowerCase();
    let headers = req.headers;
    const decoder = new StringDecoder('utf-8'); 
    let buffer = ''; //as new data comes, we append it.
    req.on('data',(data)=>{
        buffer += decoder.write(data); //as the data is streaming in, the req emits the data of undecoded data to the server. We append it once we decode it :)
    });
    req.on('end',()=>{
        buffer += decoder.end();
        let chosenHandler = typeof(server.router[trimmedPath]) != 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method' :method,
            'headers' :headers,
            'payload': helpers.parseJsonToObject(buffer)
        }
        chosenHandler(data,function(statusCode,payload){
            statusCode = typeof(statusCode) == 'number' ? statusCode :200;
            payload = typeof(payload) == 'object' ? payload : {};
            const payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode);
            res.end(payloadString);
            if(statusCode==200){
                debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+ ' /'+trimmedPath+statusCode);
            }else{
                debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+ ' /'+trimmedPath+statusCode);
            }
            
        });
    });
}

server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens' : handlers.tokens,
    'menu' : handlers.menu,
    'shop' : handlers.shop,
    'orders': handlers.orders,
}

server.init = ()=>{
    server.httpServer.listen(config.httpPort,()=>{
        console.log('\x1b[36m%s\x1b[0m',"Listening http on port: "+config.httpPort);
    });
    server.httpsServer.listen(config.httpsPort,()=>{
    console.log('\x1b[35m%s\x1b[0m',"Listening https on port: "+config.httpsPort);
    });
}

module.exports = server;