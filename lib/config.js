//import { type } from "os";

/* cinfig file to set the environments
staging or production
*/


const environments={};

//configurations for staging environment
environments.staging={
    'httpPort':3000,
    'httpsPort':3001,
    'envName': 'staging',
    'hashingSecrete': 'hashingSecrete1',
    'maxChecks': 5,
    'twilio':{
        'accountSid':'ACd68afa2d188fc32c17187f851b4d6fe7',
        'authToken':'c5826419afe81f355be1a0bbfbeabbe4',
        'fromPhone': '+15005550006'
    },
    'templateGlobals':{
        'appName':'uptimeChecker',
        'companyName':'NotARealCompany, Inc',
        'yearCreated': '2019',
        'baseUrl':'http://localhost:3000/'
    }
};

//configurations for production environment
environments.production={
    'httpPort':7000,
    'httpsPort':7001,
    'envName': 'production',
    'hashingSecrete': 'hashingSecrete2',
    'maxChecks': 5,
    'twilio':{
        'accountSid':'ACd68afa2d188fc32c17187f851b4d6fe7',
        'authToken': 'c5826419afe81f355be1a0bbfbeabbe4',
        'fromPhone': '919780068097'
    },
    'templateGlobals':{
        'appName':'uptimeChecker',
        'companyName':'NotARealCompany, Inc',
        'yearCreated': '2019',
        'baseUrl':'http://localhost:5000/'
    }
};

let choosenEnv= typeof(process.env.NODE_ENV)=='string'? process.env.NODE_ENV.toLowerCase() :'';

let envToExport= typeof(environments[choosenEnv])!== 'undefined'? environments[choosenEnv] : environments.staging;

module.exports = envToExport;