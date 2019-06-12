/* This is library for storing, read, updating and deleting
the JSON data*/

//Dependencies
const fs= require('fs');
const path= require('path');
const helpers= require('./helpers');


//Container of the module to be exported
const lib ={};

//Base directory
lib.baseDir=path.join(__dirname,'/../.data/');

//write data to a file
lib.write=(dir,file,data,callback)=>{

    //Open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json','wx',(err,fileDescriptor)=>{
        if(!err && fileDescriptor)
        {
            //convert the data to string
            const strdata=JSON.stringify(data);

            //Write to the file a close it
            fs.writeFile(fileDescriptor,strdata,(err)=>{
                if(!err)
                {
                     fs.close(fileDescriptor,(err)=>{
                         if(!err)
                         {callback(false)}
                         else{
                             callback('Error in closing the file')
                         }   
                     });   
                }
                else{
                    callback('Error in writing the data to file')
                }
            });

        }
        else
        callback('Could not create a new file, It may already exist');
    })
};


//Read data from file
lib.read =(dir,file,callback)=>{
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf-8',(err,data)=>{
        if(!err && data)
        {
            const parsedData= helpers.parseJsonToObj(data);
            callback(false,parsedData);
        }
        else{
            callback(err,data);
        }
        
    });
};


//Update the existing file with new data
lib.update= (dir,file,data,callback)=>{
    
    //Open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
         
            //Convert the data to string
            const strData=JSON.stringify(data);

            //Truncate the file
            fs.ftruncate(fileDescriptor,(err)=>{
                if(!err){

                    //Write to the file
                    fs.writeFile(fileDescriptor,strData,(err)=>{
                        if(!err){
                            //Close the file
                            fs.close(fileDescriptor,(err)=>{
                                if(!err){
                                    callback(false);
                                }
                                else{
                                    callback('Error in closing the File');
                                }
                            });
                        }
                        else{
                            callback('Error in writing the file');
                        }
                    });
                }
                else{
                    callback('Error truncating the file');
                }
        });

        }
        else{
            callback('Could not open the file for updating');
        }
    });
}


//delete the file
lib.delete= (dir,file,callback)=>{
    fs.unlink(lib.baseDir+dir+'/'+file+'.json',(err)=>{
        if(!err){
            callback(false);
        }
        else{
            callback('Error in deleting the file');
        }
    });
}

//List all the names in directory
lib.list=(dir,callback)=>{
    fs.readdir(lib.baseDir+dir+'/',(err,data)=>{
        if(!err && data && data.length>0){
            let trimmedFileNames=[];
            data.forEach(fileName=>{
                trimmedFileNames.push(fileName.replace('.json',''));
            });
            callback(false,trimmedFileNames);
        }
        else{
            callback(err,data);
        }
    });
};

//export the module
module.exports=lib;

