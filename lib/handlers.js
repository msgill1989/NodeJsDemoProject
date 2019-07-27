/*This file contains all the handlers
/*
/*
/*
*/

//Dependencies
const _data= require ('./data')
const helpers=require('./helpers')
const config =require('./config')
;
//define the handlers object
let handlers={};

/*
*
* HTML handlers
*/

//Index handler
handlers.index=(data,callback)=>{
    //Reject any call that isn't GET
    if(data.method=='get'){

        //Prepare data for interpolation
        const templateData={
            'head.title': 'Uptime Monitoring - Made simple',
            'head.description':'We offer free and simple uptime monitoring for HTTP and HTTPS sites of all kinds. When your site goes down we\'ll send you a text to let you know.',
            'body.class':'index'
        };

        //Read the index template
        helpers.getTemplate('index',templateData,(err,str)=>{
            if(!err && str){
                //Add the universal header and Footer
                helpers.adduniversalTemplates(str,templateData,(err,str)=>{
                    if(!err && str){
                        //Return that page as HTML
                        callback(200,str,'html');
                    }
                    else{
                        callback(500,undefined,'html');
                    }
                });
            }
            else{
                callback(500,undefined,'html');
            }
        });
    }
    else{
        callback(405,undefined,'html');
    }
};

//Favicon handler
handlers.favicon=(data,callback)=>{
    //Reject any method that is not get
    if(data.method=='get'){
        //Read in favicon data
        helpers.getStaticAsset('favicon.ico',(err,data)=>{
            if(!err && data){
                callback(200,data,'favicon');
            }
            else{
                callback(500);
            }
        });
    }
    else{
        callback(405);
    }
};

//Public assest
handlers.public=(data,callback)=>{
    //Reject any method that is not get
    if(data.method=='get'){
        //get the file name being requested
        const trimmedAssetName=data.path.replace('public/','').trim();
        if(trimmedAssetName.length>0){
            //Read in asset's data
            helpers.getStaticAsset(trimmedAssetName,(err,data)=>{
                if(!err && data){
                    //Determine the content time and default to text
                    let contentType='plain';
                    if(trimmedAssetName.indexOf('.css')>-1){
                        contentType='css';
                    }
                    if(trimmedAssetName.indexOf('.png')>-1){
                        contentType='png';
                    }
                    if(trimmedAssetName.indexOf('.jpg')>-1){
                        contentType='jpg';
                    }
                    if(trimmedAssetName.indexOf('.ico')>-1){
                        contentType='favicon';
                    }
                    //callback the data
                    callback(200,data,contentType)
                }
                else{
                    callback(404);
                }
            });
        }
        else{
            callback(404);
        }
    }
    else{
        callback(405);
    }
}


/*
*
*JSON API handlers
*/

//Users handler
handlers.users=(data,callback)=>{

    //Accept the acceptable method
    const acceptableMethods=['get','post','put','delete'];
    if(acceptableMethods.indexOf(data.method)>-1)
    {
        handlers._users[data.method](data,callback);
    }
    else{
        callback(405);
    }
};

//Container of the users method
handlers._users={};

//users get method
//Require fields: phone numder
//Optional fieds: None
handlers._users.get=(data,callback)=>{

    //Validate the phone number
    const phoneNum= typeof(data.queryString.phone)=='string' && data.queryString.phone.trim().length == 10 ? data.queryString.phone.trim() :false;
    
    if(phoneNum)
    {
        //get the token id from the requests's header
        const tokenId= typeof(data.header.tokenid)=='string' ?data.header.tokenid.trim():false;

        //Validate it with the phoneNum
        handlers._tokens.verifyToken(tokenId,phoneNum,(tokenIsValid)=>{
            if(tokenIsValid)
            {
                if(tokenId)
                //Lookup the user
                _data.read('users',phoneNum,(err,data)=>{
                    if(!err && data)
                    {
                        delete data.hashedPassword;
                        callback(200,data);
                    }
                    else{
                        callback(404,{'Error':'There is no data present for this request'});
                    }
                });
            }
            else{
                callback(403,{'Error':'Missing required token in the header or it is invalid!'})
            }

        });   
    }
    else{
        callback(400, {'Error':'Required fields are mssing!'});
    }
};


//users post method
//required data in this method: firstName, lastName, phone, password, tosAgreement
//optional data:None
handlers._users.post=(data,callback)=>{

    //Validate that all the required fields are filled out
    const firstName =typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length >0 ? data.payload.firstName.trim() : false;
    const lastName =typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length >0 ? data.payload.lastName.trim() : false;
    const phone= typeof(data.payload.phone)=='string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() :false;
    const password=typeof(data.payload.password)=='string' && data.payload.password.trim().length>0 ?data.payload.password.trim() :false;
    const tosAgreement=typeof(data.payload.tosAgreement)=='boolean' && data.payload.tosAgreement == true ? true :false;

    //if any of the above required fields are false, terminate the program
    if(firstName && lastName && phone && password && tosAgreement)
    {
        _data.read('users',phone,(err,data)=>{
            if(err)
            {
                //Hash the password field
                const hashedPassword= helpers.hash(password);

                //If password is hashed proceed further else terminate
                if(hashedPassword)
                {

                //Create the user object
                userObject={
                    'firstName':firstName,
                    'lastName':lastName,
                    'phone':phone,
                    'hashedPassword':hashedPassword,
                    'tosAgreement':true
                };

                //Store this user object in json file in users's directory
                _data.write('users',phone,userObject,(err)=>{
                    if(!err)
                    {
                        callback(200);
                    }
                    else{
                        console.log(err);
                        callback(500,{'Error':'Could not create a new user.'});
                    }
                });
                }
                else{
                    callback(500,{'Error':'Could not hash the user\'s password'});
                }

          
            }
            else
            {
                callback(400,{'Error': 'The user with that phone number already exists!'});
            }
        })
    }
    else{
        callback(400,{'Error':'Reuired fields are missing'});
    }
};


//users put method
//mandory data: user's phone number
//optional fields: firstName, lastName, tosAggrement, password
handlers._users.put=(data,callback)=>{

    //Validate the phonenumber
    const phoneNum= typeof(data.payload.phone)=='string' && data.payload.phone.trim().length == 10 ?data.payload.phone.trim() : false;

    //validate the other optional fields
    const firstName =typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length >0 ? data.payload.firstName.trim() : false;
    const lastName =typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length >0 ? data.payload.lastName.trim() : false;
    const password=typeof(data.payload.password)=='string' && data.payload.password.trim().length>0 ?data.payload.password.trim() :false;

    if(phoneNum)
    {
        
        if(firstName || lastName || password)
        {
            //get the tokenId from request header.
        const tokenId= typeof(data.header.tokenid) =='string'? data.header.tokenid.trim():false

        handlers._tokens.verifyToken(tokenId,phoneNum,(isTokenValid)=>{
            if(isTokenValid)
            {
                _data.read('users',phoneNum,(err,userData)=>{
                    if(!err && userData)
                    {
                        //update the fields
                        if(firstName)
                        {
                            userData.firstName=firstName;
                        }
                        if(lastName)
                        {
                            userData.lastName=lastName;
                        }
                        if(password)
                        {
                            userData.hashedPassword=helpers.hash(password);
                        }
    
                        //update the data
                        _data.update('users',phoneNum,userData,(err)=>{
                            if(!err)
                            {
                                callback(200);
                            }
                            else{
                                console.log(err);
                                callback(500,{'Error':'Error in updating the user object'});
                            }
                        });
                    }
                    else
                    {
                        callback(400,{'Error':'The user with this phone number is not found.'})
                    }
                });
            }
            else{
                callback(403,{'Error':'Missing required token in request header or token is not valid!'})
            }
        });

            //lookup the user
      
        }
        else{
            callback(400,{'Error':'Missing fields to updtae'});
        }
    }
    else{
        callback(400,{'Error': 'Required filed is missing i.e. phone number'});
    }

};


//users delete method
//Required field: Phone number
//TODO: Cleanup(delete) Delete any other datafiles that are associated to this user
handlers._users.delete=(data,callback)=>{

    //Validate the phone number
    const phoneNum = typeof(data.queryString.phone) =='string' && data.queryString.phone.trim().length == 10 ? data.queryString.phone.trim() :false

    if(phoneNum)
    {
        //Get token id from request's header
        const tokenId= typeof(data.header.tokenid)=='string' ?data.header.tokenid.trim():false;

        handlers._tokens.verifyToken(tokenId,phoneNum,(isTokenValid)=>{
            if(isTokenValid){
                
        //If the file with this phone number exist
        _data.read('users',phoneNum,(err,userdata)=>{
            if(!err && userdata)
            {
                _data.delete('users',phoneNum,(err)=>{
                    if(!err)
                    {
                        //Delete all the checks associated to this user!
                        const userChecks= typeof(userdata.userChecks)=='object' && userdata.userChecks instanceof Array? userdata.userChecks:[];
                        const checksToDelete =userChecks.length;

                        if(checksToDelete>0){
                            let checksDeleted=0;
                            let deletionErrors=false;

                            //Loop thorough the checks
                            userChecks.forEach(checkId => {
                                //delete the check
                                _data.delete('checks',checkId,(err)=>{
                                    if(err){
                                        deletionErrors=true;
                                    }
                                    checksDeleted++;
                                    if(checksDeleted==checksToDelete){
                                        if(!deletionErrors){
                                            callback(200);
                                        }
                                        else
                                        {
                                            callback(500,{'Error':'Error occured while deleting the associated checks'});
                                        }
                                    }
                                });
                            });
                        }
                        else{
                            callback(200,{'Success':'There are not any associated checks to dekete. Deletion process completed'});
                        }
                    }
                    else{
                        callback(500,{'Error':'Could not delete this specified user!'})
                    }
                });
            }
            else{
                callback(400,{'Error':'The file with this phone number does not exist.'})
            }
        });
            }
            else{
                callback(403,{'Error':'Missing required token in the request header or token is invalid!'})
            }
        });

    }
    else{
        callback(404,{'Error': 'The given phone number is not in correct format'})
    }
};

//token handlers
handlers.tokens=(data,callback)=>{
    const acceptableTokens=['get','post','put','delete'];
    if(acceptableTokens.indexOf(data.method)>-1)
    {
        handlers._tokens[data.method](data,callback);
    }
    else{
        callback(405);
    }
};

//Container for all the sub methods
handlers._tokens={};

//Token's post method
//Required data for this method: Phone and password
//Optional fields None
handlers._tokens.post=(data,callback)=>{

    //Validate the phone number
    const phone= typeof(data.payload.phone)=='string' && data.payload.phone.trim().length==10 ?data.payload.phone.trim(): false;
    const password =typeof(data.payload.password)=='string' && data.payload.password.trim().length >0 ?data.payload.password.trim() :false;

    if(phone && password)
    {
        //Lookup the user who matched that phone number
        _data.read('users',phone,(err,userData)=>{
            if(!err && userData)
            {
                //Hash the sent password via request
                const hashedPassword= helpers.hash(password);

                //Verify if this password is same as that in userData
                if(hashedPassword == userData.hashedPassword)
                {
                    //Create a random string of length 20 to make a token id and expire time 1 hour from now
                    const tokenId= helpers.createRandomString(20);
                    const expires= Date.now() + 1000*60*60;

                    //Make a token object
                    const tokenObj={
                        'phone': phone,
                        'tokenId': tokenId,
                        'expires': expires
                    };

                    //Store the token
                    _data.write('tokens',tokenId,tokenObj,(err)=>{
                        if(!err){
                            callback(200,tokenObj);
                        }
                        else{
                            callback(500,{'Error':'Error occured while making the token.'});
                        }
                    });
                }
                else{
                    callback(404,{'Error':'Password did not match with the specified user\'s stored password'})
                }
            }
            else{
                callback(400,{'Error':'Could not find the specified user!'})
            }
        });
    }
    else{
        callback(400,{'Error':'The mandatory fields are missing!'})
    }

};

//Token's get method
//Mandatory fields :Token id
//Optional fields: None
handlers._tokens.get=(data,callback)=>{

    //Token ID will come in queryString, needs to be valudated first
    const tokenId= typeof(data.queryString.tokenId)=='string' && data.queryString.tokenId.trim().length ==20 ? data.queryString.tokenId.trim() :false;

    if(tokenId){
        
        //read the token file from token directory
        _data.read('tokens',tokenId,(err,tokenData)=>{
            if(!err && tokenData){
                callback(200,tokenData);
            }
            else{
                callback(404,{'Error':'The tokenId is not existing in the database!'});
            }
        });
    }
    else{
        callback(400,{'Error':'Mandatory field token ID is missing in query String!'})
    }
};

//Token's put method
//mandatory fields: id and extend(boolean)
//Optional data: none
handlers._tokens.put=(data,callback)=>{

    //validate the tokenid from payload
    const tokenId= typeof(data.payload.tokenId) =='string' && data.payload.tokenId.trim().length ==20?data.payload.tokenId.trim() : false;

    //Validate extend parameter from payload
    const extend = typeof(data.payload.extend) =='boolean' && data.payload.extend ==true ? true :false;

    if(tokenId && extend){

        //Get the data from token directory if token exists
        _data.read('tokens',tokenId,(err,tokenData)=>{
            if(!err && tokenData){

                //Validate if token in not already expired
                if(tokenData.expires>Date.now()){

                    //Set the expiration one hour from now.
                    tokenData.expires= Date.now() + 1000*60*60;

                    //Store the updated expire time
                    _data.update('tokens',tokenId,tokenData,(err)=>{
                        if(!err){
                            callback(200)
                        }
                        else{
                            callback(500,{'Error':'Error occured while updating token data!'})
                        }
                    });
                }
                else{
                    callback(400,{'Error':'The token has already expired!'});
                }
            }
            else{
                callback(404,{'Error':'The given token does npot exist!'})
            }
        });
    }
    else{
        callback(400,{'Error':'Mandatory fields are missing!'})
    }
};

//Token's delete method
//Mandatory fields: token id
//optional fields: none
handlers._tokens.delete=(data,callback)=>{

    //Check the validity of id
    const tokenId= typeof(data.queryString.tokenId)=='string' && data.queryString.tokenId.trim().length ==20 ? data.queryString.tokenId.trim(): false;

    if(tokenId){

        //Look for this specific token
        _data.read('tokens',tokenId,(err,tokenData)=>{
            if(!err && tokenData){

                 //delete this specific token
        _data.delete('tokens',tokenId,(err)=>{
            if(!err){
                callback(200);
            }
            else{
                callback(500,{'Error':'Error occured in deleting the token!'})
            }
        });
            }
            else{
                callback(404,{'Error':'Requested token is not found!'})
            }
        }); 
    }
    else{
        callback(400,{'Error':'The mandatory field is missing!'})
    }
    
};

//Verify if the given tokenId is valid for the given user
handlers._tokens.verifyToken=(tokenId, phone, callback)=>{

    //Validate if this token exists
    _data.read('tokens',tokenId,(err,tokenData)=>{
        if(!err && tokenData){

            //Validate if the phone in tokenData is same that we get from user
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            }
            else{
                callback(false);
            }
        }
        else{
            callback(false)
        }
    });
};


//Checks handlers
handlers.checks=(data,callback)=>{
    const acceptableMethods=['get','post','put','delete'];
    if(acceptableMethods.indexOf(data.method)>-1)
    {
        handlers._checks[data.method](data,callback);
    }
    else{
        callback(405,{'Error':'The given methid is not accepted!'})
    }
};

//Container of all the checks methods
handlers._checks={};

//post method
//Required variables: method, protocol, url, successCodes, timeout seconds
//Optional data: null
handlers._checks.post=(data,callback)=>{
    
    //Validate all the input parameters
    const protocol= typeof(data.payload.protocol)=='string' && ['http', 'https'].indexOf(data.payload.protocol) >-1 ? data.payload.protocol: false;
    const url =typeof(data.payload.url)=='string' && data.payload.url.trim().length >0 ?data.payload.url.trim(): false;
    const method =typeof(data.payload.method)=='string' && ['get','post','put','delete'].indexOf(data.payload.method) >-1 ? data.payload.method :false;
    const successCodes = typeof(data.payload.successCodes)=='object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length >0? data.payload.successCodes :false;
    const timeoutSeconds= typeof(data.payload.timeoutSeconds) =='number' && data.payload.timeoutSeconds % 1 ===0 && data.payload.timeoutSeconds>=1 && data.payload.timeoutSeconds <=5? data.payload.timeoutSeconds :false;
    
    if(protocol && url && method && successCodes && timeoutSeconds)
    {
        //get tye token from header
        const token=typeof(data.header.token)=='string' ? data.header.token:false;

        //Lookup the user with token
        _data.read('tokens',token,(err,tokenData)=>{
            if(!err && tokenData){
                const userPhone =tokenData.phone;

                //Lookup the user
                _data.read('users',userPhone,(err, userData)=>{
                    if(!err, userData){

                        //Check if usr already has checks
                        const userChecks= typeof(userData.userChecks)=='object' && userData.userChecks instanceof Array? userData.userChecks: [];

                        //Veridalte if existing check(if any) are less than the max checks
                        if(userChecks.length < config.maxChecks){
                            
                            //Create the random id of the check
                            const checkId= helpers.createRandomString(20);

                            //Create the check object and include the user's phone
                            const checkObj={
                                'id':checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url':url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds':timeoutSeconds
                            };

                            //Save the object
                            _data.write('checks',checkId,checkObj,(err)=>{
                                if(!err){

                                    //Add the check id to thr existing object
                                    userData.userChecks=userChecks;
                                    userData.userChecks.push(checkId);

                                    //Save the new user data
                                    _data.update('users',userPhone,userData,(err)=>{
                                        if(!err){

                                            //Return statusCode 200 and data about the new check
                                            callback(200,checkObj);
                                        }
                                        else{
                                            callback(500,{'Error':'Could not update the user with new check!'})
                                        }
                                    });
                                }
                                else{
                                    callback(500,{'Error':'Error while saving the check Object!'})
                                }
                            });

                        }
                        else{
                            callback(400,{'Error':'The user already has the maximum number of checks('+config.maxChecks+')'})
                        }
                    }
                    else{
                        callback(403,{'Error':'User with this phone doesn\'t exist'})
                    }
                });
            }
            else{
                callback(404,{'Error':'The requested token does not exist'});
            }
        });
    }
    else{
        callback(400,{'Error':'Either required fields are missing or input are in invalid format!'})
    }
};

//Get method
//Required variables: check id
//optional data:null 
handlers._checks.get=(data,callback)=>{
    
    //Check that given id is valid
    const id= typeof(data.queryString.id)=='string' && data.queryString.id.trim().length==20? data.queryString.id.trim() : false;

    if(id){

        //Lookup the check
        _data.read("checks",id,(err,checkData)=>{
            if(!err && checkData){
                
                //get the token from the headers
                const token=typeof(data.header.token)=='string'? data.header.token: false;

                //verify the token is valid and belongs to the user who created this check!
                handlers._tokens.verifyToken(token,checkData.userPhone,(tokenIsValid)=>{
                    if(tokenIsValid){
                        //return the check data
                        callback(200,checkData);
                    }
                    else{
                        callback(403,{'Error':'Token is in valid'})
                    }
                });
            }
            else{
                callback(404,{'Error':'This user is not authorised!'})
            }
        });
    }
    else{
        callback(400,{'Error':'Missing the required fields!'});
    }
};

//put method
//Required fields: token id
//optional fields: protol, URl, method, success codes, timeout sconds (one must be sent) 
handlers._checks.put=(data,callback)=>{
    //Check the token id
    const id= typeof(data.payload.id)=='string' && data.payload.id.trim().length ==20 ? data.payload.id.trim() :false;

    //Validate the optional fields
    const protocol= typeof(data.payload.protocol)=='string' && ['http', 'https'].indexOf(data.payload.protocol) >-1 ? data.payload.protocol: false;
    const url =typeof(data.payload.url)=='string' && data.payload.url.trim().length >0 ?data.payload.url.trim(): false;
    const method =typeof(data.payload.method)=='string' && ['get','post','put','delete'].indexOf(data.payload.method) >-1 ? data.payload.method :false;
    const successCodes = typeof(data.payload.successCodes)=='object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length >0? data.payload.successCodes :false;
    const timeoutSeconds= typeof(data.payload.timeoutSeconds) =='number' && data.payload.timeoutSeconds % 1 ===0 && data.payload.timeoutSeconds>=1 && data.payload.timeoutSeconds <=5? data.payload.timeoutSeconds :false; 

    //Make sure id is valid
    if(id){
        //Make sure one optional field is applied
        if(protocol || url || method || successCodes || timeoutSeconds){
            //lookup the check
            _data.read('checks',id,(err, checkData)=>{
                if(!err && checkData){
                    //Get the token from the header
                    const token=typeof(data.header.token)=='string'? data.header.token: false;

                    //Validate the given token and verify that it belongs to the user who created it
                    handlers._tokens.verifyToken(token,checkData.userPhone,(tokenIsValid)=>{
                        if(tokenIsValid){
                            //Update the check where required
                            if(protocol){
                                checkData.protocol=protocol;
                            }
                            if(url){
                                checkData.url=url;
                            }
                            if(method){
                                checkData.method=method;
                            }
                            if(successCodes){
                                checkData.successCodes=successCodes;
                            }
                            if(timeoutSeconds){
                                checkData.timeoutSeconds=timeoutSeconds;
                            }

                            //Store the new check
                            _data.update("checks",id,checkData,(err)=>{
                                    if(!err){
                                        callback(200,{'Success':'Check has been updated successfully!'});
                                    }
                                    else{
                                        callback(500,{'Error':'There is some error while updating check.'});
                                    }
                            });
                        }
                        else{
                            callback(403,{'Error':'Token data is not valid!'})
                        }
                    });
                }
                else{
                    callback(400,{'Error':'Check id don\'t exist'})
                }
            });
        }
        else{
            callback(400,{'Error':'None of the optional field is provided!'});
        }
    }
    else{
        callback(400,{'Error':'Required fields(Checkid) are missing!'})
    }
};

//delete method
//required fields: check id
//optional fields: none
handlers._checks.delete=(data,callback)=>{
    //check the check id is valid
    const id=typeof(data.queryString.id)=='string' && data.queryString.id.trim().length==20 ? data.queryString.id.trim() :false;
    console.log(id);
    if(id){
        //Look up the check
        _data.read('checks',id,(err,checkdata)=>{
            if(!err && checkdata){
                //Get the token from headers
                const token=typeof(data.header.token)=='string' ? data.header.token: false;
                
                //Validate the token
                handlers._tokens.verifyToken(token, checkdata.userPhone,(tokenIsValid)=>{
                    if(tokenIsValid){
                        
                        //Delete the required Check
                        _data.delete('checks',id,(err)=>{
                            if(!err){
                                 //lookup the user
                                _data.read('users',checkdata.userPhone,(err,userData)=>{
                                    if(!err &&userData){

                                        //Get the list of user checks
                                        const userChecks= typeof(userData.userChecks)=='object' && userData.userChecks instanceof Array? userData.userChecks:[];
                                        console.log(userChecks);
                                        //remove the deleted check form this list
                                        const checkPosition= userChecks.indexOf(id);
                                        if(checkPosition>-1){
                                            userChecks.splice(checkPosition,1);

                                            //requested check has been deleted and re save the user data
                                            _data.update('users',checkdata.userPhone,userData,(err)=>{
                                                if(!err){
                                                    callback(200);
                                                }else{
                                                    callback(500,{'Error':'Error occured while saving updating the modified check in user Object!'})
                                                }
                                            });
                                        }
                                        else{
                                            callback(500,{'Error':'Error occured while checking the position of check to be deleted from array of checks on user object.'})
                                        }
                                    }
                                    else{
                                        callback(500,{'Error':'Could not find the user who create this check, so sould not remove the check from the list of checks on user\'s object!'})
                                    }
                        });
                            }
                            else{
                                callback(500,{'Error':'Error ocured while deleting the check!'})
                            }
                        });
                    }
                    else{
                        callback(403,{'Error':'Missing required token in the header or token is invalid!'})

                    }
                });

            }
            else{
                callback(400,{'Error':'The check with this check id does not exist'});
            }
        });
    }
    else{
        callback(400,{'Error':'Required filed that check id is missing!'})
    }
}

//Ping handler
handlers.ping=(data,callback)=>{
    callback(200,{})
   };

//notfound handler
handlers.notFound=(data,callback)=>{
    callback(404)
};


module.exports =handlers;