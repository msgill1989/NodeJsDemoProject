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

         console.log("The response code is "+statuscode+" and payload is ",payload);
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
    console.log("Server is listening on "+config.httpPort+ "port in "+config.envName+" mode!");
    });
    //Start the HHTPS server
    server.httpsServer.listen(config.httpsPort,()=>{
    console.log("Server is listening on"+config.httpsPort+" port in"+config.envName+" mode!");
});
};

//Export the module
module.exports=server;