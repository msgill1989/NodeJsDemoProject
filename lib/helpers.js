/* This file contains the helper functions
*
*
*/

/* Dependencies */
const crypto= require('crypto');
const config=require('./config');
const https= require('https');
const querystring= require('querystring');
const path=require('path');
const fs=require('fs');


//Make a container for helper functions
const helpers ={};

//Create a SH256 hash
helpers.hash=(str)=>{

    //Validate if the input parameter is string
    if(typeof(str)=='string' && str.length>0)
    {
        const hash=crypto.createHmac('sha256',config.hashingSecrete).update(str).digest('hex');
        return hash;
    } 
    else{
        return false;
    }

};

//Parse the JSON string to the object
helpers.parseJsonToObj=(str)=>{
    try{
        const jObj=JSON.parse(str);
        return jObj;
    }
    catch(e)
    {
        return {};
    }

};

//Create a string of random alphanumeric characters of given length
helpers.createRandomString=(Length)=>{

    //Validate the length
    const strLength=typeof(Length)=='number' && Length>0 ? Length :false;

    if(strLength){
        //Define all the possible characters
        const possibleCharacters ='abcdefghijklmnopqrstuvwxyz0123456789';

        //start the string
        let str='';
        
        for(i=1; i<=strLength; i++)
        {
            //Get the random number from possible string
            const randomCharacter= possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));

            //make the string
            str +=randomCharacter;
        }

        //Return the final string
        return str;
    }
    else{
        return false;
    }

};

//Send an SMS via twilio API
helpers.sendTwilioSms=(strPhone,strMsg,callback)=>{

    //Validate the input variables
    const phone= typeof(strPhone)=='string' && strPhone.trim().length==10? strPhone.trim(): false;
    const msg= typeof(strMsg)=='string' && strMsg.trim().length>0 && strMsg.trim.length <=1600 ? strMsg.trim() :false;
    if(phone && msg){
        
        //configure the twilio rquest payload
        const payload={
            'From': config.twilio.fromPhone,
            'To':'+1'+phone,
            'Body':msg
        };
       
        //Stringify te payload
        const stringPayload= querystring.stringify(payload);

        //configure the request details
        const requestDetails={
            'protocol':'https:',
            'hostname':'api.twilio.com',
            'method':'POST',
            'path':'/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth': config.twilio.accountSid+':'+config.twilio.authToken,
            'headers':{
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        //Instantiate the request object
        const req=https.request(requestDetails,(res)=>{
            //Grab the status of the sent request
            const status=res.statusCode;

            //callback if the request went through successfully
            if(status==200 || status ==201){
                callback(false);
            }
            else{
                callback('Statuscode returned was '+status);
            }
        });

        //Bind to the error event so it does not get thrown
        req.on('error',(e)=>{
            callback(e);
        });

        //Add the payload
        req.write(stringPayload);

        //end the request
        req.end();
    }
    else{
        callback('Given parameters are missing or invalid!');
    }
};

//Get the string content of the template
helpers.getTemplate=(templateName,data,callback)=>{
    templateName=typeof(templateName)=='string' && templateName.length>0 ? templateName: false;
    data= typeof(data)=='object' && data !==null ? data : {};
    if(templateName){
        const templateDir=path.join(__dirname,'/../templates/');
        fs.readFile(templateDir+templateName+'.html','utf8',(err,str)=>{
            if(!err && str && str.length>0){
                //Do interpolation on the string
                const finalString=helpers.interpolate(str,data);
                callback(false,finalString);
            }
            else{
                callback('No template could be found!');
            }
        });
    }
    else{
        callback('A valid template name was not specified!');
    }
};

//Add the universal header and footer to a string, and pass the provided data object to the header amd footer for interpolation
helpers.adduniversalTemplates=(str,data,callback)=>{
    str=typeof(str)== 'string' && str.length>0 ? str :'';
    data= typeof(data)=='object' && data !==null ? data : {};

    //Get the Header
    helpers.getTemplate('_header',data,(err,headerString)=>{
        if(!err && headerString){
            //Get the footer template
            helpers.getTemplate('_footer',data,(err,footerString)=>{
                if(!err && footerString){
                    //Add the complete string
                    const finalString=headerString+str+footerString;
                    callback(false,finalString);
                }
                else{
                    callback('Couldn\'t find the footer template.');
                }
            });
        }
        else{
            callback('Couldn\'t find the header template.');
        }
    });
};

//Take a given string and a data object and find/replace all the keys within it
helpers.interpolate=(str,data)=>{
    str=typeof(str)== 'string' && str.length>0 ? str :'';
    data= typeof(data)=='object' && data !==null ? data : {};

    //Add the templateGlobals to the data object, prepending their key name with 'global'
    for(let keyName in config.templateGlobals){
        if(config.templateGlobals.hasOwnProperty(keyName)){
            data['global.'+keyName]=config.templateGlobals[keyName];
        }
    }

    //For each key in the data object, insert its value into the string at the corresponding placeholder
    for(let key in data){
        if(data.hasOwnProperty(key) && typeof(data[key])=='string'){
            let replace=data[key];
            let find='{'+key+'}';
            str=str.replace(find,replace);
        }
    }
    return str;
};

//Get the contents of a static public asset
helpers.getStaticAsset=(fileName,callback)=>{
    fileName=typeof(fileName)=='string' && fileName.length>0 ?fileName:false;
    if(fileName){
        const publicDir=path.join(__dirname,'/../public/');
        fs.readFile(publicDir+fileName,(err,data)=>{
            if(!err && data){
                callback(false,data);
            }
            else{
                callback('No file could be found!');
            }
        });
    }
    else{
        callback('A valid filename was not specified!');
    }
};

//export the helper container
module.exports =helpers