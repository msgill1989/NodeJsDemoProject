/* This file contains the helper functions
*
*
*/

/* Dependencies */
const crypto= require('crypto');
const config=require('./config');



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


//export the helper container
module.exports =helpers