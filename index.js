/* Primary file for the APi
/
/
/
*/

//Dependencies
const server=require('./lib/server');
const workers=require('./lib/workers');


//Declare the App
const app={};


//init fundtions
app.init=()=>{

    //Start the server
    server.init();

    //Start the worker
      workers.init();
};

//Execute the init function
app.init();

//Export the app
module.exports=app;