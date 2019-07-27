/*
*
* This is the front end logic of the application
*/

//container object for client side application
const app={};

//config
app.config={
    'sessionToken':false
};

//Ajax client for restful API

//container
app.client={};

//interface for making API call;
app.client.request=(headers,path,method,queryStringObject,payload,callback)=>{
    //set default
    headers=typeof(headers)=='object' && headers !== null ?headers :{};
    path=typeof(path)=='string' ? path : '/';
    method=typeof(method)=='string' && ['POST','GET','PUT','DELETE'].indexOf(method) >-1 ? method.toUpperCase() : 'GET';
    queryStringObject=typeof(queryStringObject)=='object' && queryStringObject !== null ?queryStringObject :{};
    payload=typeof(payload)=='object' && payload !== null ?payload :{};
    callback=typeof(callback) =='function' ? callback :false;

    //For each query string parameter sent add it to path
    let requestUrl=path+'?';
    let counter=0;
    for(let queryKey in queryStringObject){
        if(queryStringObject.hasOwnProperty(queryKey)){
            counter++;
            //if atleast one query string parameter has already been added, prepend new ones with &
            if(counter>1){
                requestUrl+='&';
            }
            //add the key and value
            requestUrl+=queryKey+'='+queryStringObject[queryKey];
        }
    }

    //Form the http request as a JSON type
    const xhr=new XMLHttpRequest();
    xhr.open(method,requestUrl,true);
    xhr.setRequestHeader("Content-Type","application/json");

    //For each headers sent add it to the request
    for(let headerKey in headers){
        if(headers.hasOwnProperty(headerKey)){
            xhr.setRequestHeader(headerKey,headers[headerKey])
        }
    }

    //If there is a current session token, add that in header as well
    if(app.config.sessionToken){
        xhr.setRequestHeader("token",app.config.sessionToken.id);
    }

    //When the request comes back handle the response
    xhr.onreadystatechange=()=>{
        if(xhr.readyState==XMLHttpRequest.DONE){
            const statusCode=xhr.status;
            const responseReturned= xhr.responseText;
            //callback if request
            if(callback){
                try{
                    const parsedResponse=JSON.parse(responseReturned);
                    callback(statusCode,parsedResponse);
                }
                catch(e){
                    callback(statusCode,false);
                }
            }
        }
    }

    //Send th payload as JSON
    const payloadString=JSON.stringify(payload);
    xhr.send(payloadString);
};
