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
    'maxChecks': 5
};

//configurations for production environment
environments.production={
    'httpPort':7000,
    'httpsPort':7001,
    'envName': 'production',
    'hashingSecrete': 'hashingSecrete2',
    'maxChecks': 5
};

let choosenEnv= typeof(process.env.NODE_ENV)=='string'? process.env.NODE_ENV.toLowerCase() :'';

let envToExport= typeof(environments[choosenEnv])!== 'undefined'? environments[choosenEnv] : environments.staging;

module.exports = envToExport;