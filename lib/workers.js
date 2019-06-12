/* Worker related tasks
 *
 *
 */

 //Dependencies

 const path=require('path');
 const fs=require('fs');
 const _data=require('./data');
 const https=require('https');
 const http=require('http');
 const helpers =require('./helpers');
 const url=require('url');

 //instantiate the worker object
 const workers={};

//Lookup all the checks, get their data, send to aa validator
workers.gatherAllChecks=()=>{
    //get all the checks
    _data.list('checks',(err,checks)=>{
        if(!err && checks && checks.length>0){
            checks.forEach(check => {
                //Read the check data
                _data.read('checks',check,(err,originalCheckData)=>{
                    if(!err && originalCheckData){
                        //Pass it to check validator and let that function continue or log error
                        workers.validateCheckData(originalCheckData);
                    }
                    else{
                        console.log('Error reading one of the check data.');
                    }
                });
            });
        }
        else{
            console.log('Could not find any checks to process!');
        }
    });
};

//Validate the check data
workers.validateCheckData=(originalCheckData)=>{
    originalCheckData=typeof(originalCheckData)=='object' && originalCheckData !=null ? originalCheckData : {};
    originalCheckData.id=typeof(originalCheckData.id)=='string' && originalCheckData.id.trim().length ==20 ?originalCheckData.id : false;
    originalCheckData.userPhone=typeof(originalCheckData.userPhone)=='string' && originalCheckData.userPhone.trim().length ==10 ?originalCheckData.userPhone : false;
    originalCheckData.protocol=typeof(originalCheckData.protocol)=='string' && ['http','https'].indexOf(originalCheckData.protocol)>-1 ?originalCheckData.protocol : false;
    originalCheckData.url=typeof(originalCheckData.url)=='string' && originalCheckData.url.trim().length>0 ?originalCheckData.url.trim() : false;
    originalCheckData.method=typeof(originalCheckData.method)=='string' && ['get','post','put','delete'].indexOf(originalCheckData.method)>-1 ?originalCheckData.method : false;
    originalCheckData.successCodes=typeof(originalCheckData.successCodes)=='object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length>0 ?originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds=typeof(originalCheckData.timeoutSeconds)=='number' && originalCheckData.timeoutSeconds % 1===0 && originalCheckData.timeoutSeconds>=1 && originalCheckData.timeoutSeconds<=5?originalCheckData.timeoutSeconds : false;

    //Set the keys that may not be set(if the worker has never been seen this before)
    originalCheckData.state= typeof(originalCheckData.state)=='string' && ['up','down'].indexOf(originalCheckData.state)>-1 ? originalCheckData.state :'down';
    originalCheckData.lastChecked=typeof(originalCheckData.lastChecked)== 'number' && originalCheckData.lastChecked>0 ?originalCheckData.lastChecked :false;

    //If all the checks pass, pass the data to the next step
    if(originalCheckData.id &&
       originalCheckData.userPhone &&
       originalCheckData.protocol &&
       originalCheckData.url &&
       originalCheckData.method &&
       originalCheckData.successCodes &&
       originalCheckData.timeoutSeconds ){
        workers.peformCheck(originalCheckData);
    }
       else{
           console.log('Error: One of the checks is not properly formatted! Hence, skipping it.');
       }
};

//Perform the check, send the original data and the outcome of the check process to the next step in the process.
workers.peformCheck=(originalCheckData)=>{
    //prepare the initial check ooutcome
    let checkOutCome={
        'error':false,
        'responseCode':false
    };

    //Mark that the outcome has not been sent yet
     let outcomeSent=false;

     //Parse the hostname and the path out of the original check data
     const parsedUrl=url.parse(originalCheckData.protocol+'://'+originalCheckData.url,true);
     const hostName=parsedUrl.hostname;
     const path=parsedUrl.path; // using path and not pathname because we want the query string

     //build the request details
     const requestDetails={
         'protocol':originalCheckData.protocol+':',
         'hostname': hostName,
         'method':originalCheckData.method.toUpperCase(),
         'path':path,
         'timeout': originalCheckData.timeoutSeconds*1000
     };

     //Instantiate the request object using HTTP or HTTPS module
     const _moduleToUse=originalCheckData.protocol=='http'? http :https;
     const req =_moduleToUse.request(requestDetails,(res)=>{
         //grab the status of the sent request
         const status=res.statusCode;

         //Update the checkOutcome
         checkOutCome.responseCode=status;
         if(!outcomeSent){
             workers.processCheckOutcome(originalCheckData,checkOutCome);
             outcomeSent=true;
         }
     });

     //Bind the error event so that it does not get thrown
     req.on('error',(e)=>{
         //update the checkoutcome and pass the data along
         checkOutCome.error={
             'error':true,
             'value':e
         };

         if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData,checkOutCome);
            outcomeSent=true;
         }
     });

     //Bind the timeout event
     req.on('timeout',(e)=>{
        //update the checkoutcome and pass the data along
        checkOutCome.error={
            'error':true,
            'value':'timeout'
        };

        if(!outcomeSent){
           workers.processCheckOutcome(originalCheckData,checkOutCome);
           outcomeSent=true;
        }
    });

    //End the request
    req.end();
};

//Process the check outcome, update the check data as needed, trigger an alert to the user if needed
//Special logic for accomudating a check that has never been tested before(no alerts on that one)
workers.processCheckOutcome=(originalCheckData,checkOutCome)=>{
    const state= !checkOutCome.error && checkOutCome.responseCode && originalCheckData.successCodes.indexOf(checkOutCome.responseCode)>-1 ? 'up':'down';
    console.log(checkOutCome);
    //Decide if alert is warranted
    const alertWarranted= originalCheckData.lastChecked && originalCheckData.state != state ? true: false;

    //update the check date
    const newCheckData=originalCheckData;
    newCheckData.state=state;
    newCheckData.lastChecked=Date.now();

    //Save the updates
    _data.update('checks',newCheckData.id,newCheckData,(err)=>{
        if(!err){
            //send the new check data to next phase if needed
            if(alertWarranted){
                workers.alertUserTostatusChange(newCheckData);  
            }
            else{
                console.log('Check outcome has not been changed, hence no alert is needed!');
            }
        }
        else{
            console.log('Error trying to save one of the checks!')
        }
    });
};

//Alert to user as there is a change in check status
workers.alertUserTostatusChange=(newCheckData)=>{
    const msg='Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone,msg,(err)=>{
        if(!err){
            console.log('Success: User was alerted to a status change in their check via SMS',msg);
        }
        else{
            console.log('Could not send SMS alert to the user who had a state change in their check!');
        }
    });
};


//Timer to execute the worker process once per minute
workers.loop=()=>{
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000*5);
};

//init script
workers.init=()=>{

    //Execute all the checks immediately
    workers.gatherAllChecks();

    //Call the loop so the checks will be executed later
    workers.loop();
};


//export the worker module
module.exports=workers;