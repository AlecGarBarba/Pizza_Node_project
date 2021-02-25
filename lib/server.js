
 //Dependencies
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
 //instantiate the server module obkect

 const server = {};
 

 
 //Instanciate http server
server.httpServer = http.createServer((req,res)=>{
    server.unifiedServer(req,res);
})


//https options
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'../https/cert.pem'))
};

//Instanciate https server
server.httpsServer = https.createServer( server.httpsServerOptions,(req,res)=>{
    server.unifiedServer(req,res);
})
 
server.unifiedServer = (req,res)=>{
    // Get the URL and parse it
    let parsedUrl = url.parse(req.url, true); //this true  is to get querystring.
    //Get the path from the url
    let path = parsedUrl.pathname; //key set on parsedUrl, it is the untrimmed path the user requested
    let trimmedPath = path.replace(/^\/+|\/+$/g,''); //Don't even try to understand fully this regex. It Trimms slashes at the beggining and the end
    //GET the query string as an object
    let queryStringObject = parsedUrl.query;
    //GET the http method.
    let method = req.method.toLowerCase();
    
    //Get the headers as an object
    let headers = req.headers;
    //Get the payload, if any
    const decoder = new StringDecoder('utf-8'); //pretty much any JSON
    //payloads come to the server as a stream. When the stream tells us it is the end, we manage the entire payload thingy
    let buffer = ''; //as new data comes, we append it.
    req.on('data',(data)=>{
        buffer += decoder.write(data); //as the data is streaming in, the req emits the data of undecoded data to the server. We append it once we decode it :)
    });
    req.on('end',()=>{
        buffer += decoder.end();
         
        //select handler that this request should go to. if not found, go to not found
        let chosenHandler = typeof(server.router[trimmedPath]) != 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        //Connstruct the data object to send to the handler
        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method' :method,
            'headers' :headers,
            'payload': helpers.parseJsonToObject(buffer)
        }
        //Route the request to the handler specified in the router
        chosenHandler(data,function(statusCode,payload){
            //Use the status code called back by handler, or default 200
            statusCode = typeof(statusCode) == 'number' ? statusCode :200;
            //Use the payload called, or default to empty
            payload = typeof(payload) == 'object' ? payload : {};
            //Convert the payload to a string
            const payloadString = JSON.stringify(payload);
            //Return the response
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode);
            res.end(payloadString);

            //if the response is 200 print green, otherwise print red
            if(statusCode==200){
                debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+ ' /'+trimmedPath+statusCode);
            }else{
                debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+ ' /'+trimmedPath+statusCode);
            }
            
        });
    }); //if there is no payload, this is still called;
}

server.router = {
     'ping': handlers.ping,
     'sample': handlers.sample,
     'users': handlers.users,
     'tokens' : handlers.tokens,
     'menu' : handlers.menu,
}

server.init = ()=>{
    //Start the http server
    server.httpServer.listen(config.httpPort,()=>{
        console.log('\x1b[36m%s\x1b[0m',"Listening http on port: "+config.httpPort);
    });
    //start the https server
     
    server.httpsServer.listen(config.httpsPort,()=>{
    
    console.log('\x1b[35m%s\x1b[0m',"Listening https on port: "+config.httpsPort);
})
}



 module.exports = server;