/* This file contains the helper functions
*
*
*/

/* Dependencies */
const crypto= require('crypto');
const config=require('./config');
const https= require('https');
const querystring= require('querystring');


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


//export the helper container
module.exports =helpers