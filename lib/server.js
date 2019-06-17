/* These are server related tasks.
 *
 *
 *
 */

/*Dependencies*/
const http=require('http');
const https=require('https');
const url=require('url');
const StringDecoder=require('string_decoder').StringDecoder;
const fs=require("fs");
const config= require('./config');
const _data= require('./data');
const handlers=require('./handlers');
const helpers=require('./helpers');
const path=require('path');
const util=require('util');
const debug=util.debuglog('server');

//Instantiate the server module
const server ={};

//Instantiate HTTP server
server.httpServer=http.createServer((req, res)=>{
    server.unifiedServer(req,res);
});

//Instantiate HTTPS server
server.httpsOptions={
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert':fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.httpsServer=https.createServer(server.httpsOptions,(req,res)=>{
    server.unifiedServer(req,res);
}); 

//Make a unified server
server.unifiedServer =(req,res)=>{

 //parsed URL
 let parsedUrl=url.parse(req.url,true);

 //Get the path
 let path=parsedUrl.pathname;
 //console.log(path);

 //trim the path
 let trimmedPath=path.replace(/^\/+|\/+$/g,'');

 //the queryString from parsed URl
 let querystrn=parsedUrl.query;

 //Get the method
 let method=req.method.toLowerCase();

 //get the Headers
 let heads=req.headers;
 
 //Get the payloads from the body
 let decoder=new StringDecoder('utf-8');
 let buffer='';
 req.on('data',(data)=>{
     buffer +=decoder.write(data);
 });

 req.on('end',()=>{
     buffer +=decoder.end();

     //check if the handler is there for the requested path, if yes: selet that else select 'not found'
     const choosenHandler= typeof(server.routers[trimmedPath]) !== 'undefined'? server.routers[trimmedPath] : handlers.notFound;
     
     //package the input data object
     let data ={
         'path': trimmedPath,
         'queryString': querystrn,
         'method':method,
         'header':heads,
         'payload':helpers.parseJsonToObj(buffer)   
     };

     choosenHandler(data, (statuscode, payload)=>{

         statuscode =typeof(statuscode)== 'number'? statuscode : 200;
         payload =typeof(payload)=='object'? payload : {};

         //convert the JSON object to string
         let strPayload=JSON.stringify(payload);

         res.setHeader('Content-Type','application/json');
         res.writeHead(statuscode);
         res.end(strPayload);

         //If response is 200, print in green otherwise print in red.
         if(statuscode==200)
         {
            debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statuscode);
         }
         else{
            debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statuscode);
         }
     });        
     //let jsonObj= JSON.parse(buffer);
    //console.log(jsonObj.username);
 });
};


//Define the routers
 server.routers= {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens':handlers.tokens,
    'checks':handlers.checks
};

//Init script
server.init=()=>{
    //Start HTTP server
    server.httpServer.listen(config.httpPort,()=>{
    console.log('\x1b[36m%s\x1b[0m','The server is listening on port '+config.httpPort);    
    });
    //Start the HHTPS server
    server.httpsServer.listen(config.httpsPort,()=>{
    console.log('\x1b[35m%s\x1b[0m','The server is listening on port '+config.httpPorts);
});
};

//Export the module
module.exports=server;