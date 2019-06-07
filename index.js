//import http from 'http';

const http=require('http');
const https=require('https');
const url=require('url');
const StringDecoder=require('string_decoder').StringDecoder;
const fs=require("fs");
const config= require('./lib/config');
const _data= require('./lib/data');
const handlers=require('./lib/handlers');
const helpers=require('./lib/helpers');


//Instantiate HTTP server
const httpServer=http.createServer((req, res)=>{
    unifiedServer(req,res);
});

//Start HTTP server
httpServer.listen(config.httpPort,()=>{
console.log("Server is listening on "+config.httpPort+ "port in "+config.envName+" mode!");
});

//Instantiate HTTPS server
httpsOptions={
    'key': fs.readFileSync('./https/key.pem'),
    'cert':fs.readFileSync('./https/cert.pem')
};
const httpsServer=https.createServer(httpsOptions,(req,res)=>{
    unifiedServer(req,res);
}); 

//Start HTTPS server
httpsServer.listen(config.httpsPort,()=>{
    console.log("Server is listening on"+config.httpsPort+" port in"+config.envName+" mode!");
});

//Make a unified server
let unifiedServer =(req,res)=>{

 //parsed URL
 let parsedUrl=url.parse(req.url,true);
 //console.log(req.url);
 //console.log(parsedUrl);

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
     const choosenHandler= typeof(routers[trimmedPath]) !== 'undefined'? routers[trimmedPath] : handlers.notFound;
     
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
let routers= {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens':handlers.tokens,
    'checks':handlers.checks
};