/*
 *
 *Library for storing and rotating log files
 */


 //Dependencies
 const fs=require('fs');
 const path=require('path');
 const zlib=require('zlib');

 //Container of the module
 const lib={};

//Base directory of the logs folder
lib.baseDir=path.join(__dirname,'/../.logs/')

//Append a string to the file, Create the file if does not exist.
lib.append=(file,str,callback)=>{
    //Open the file for appending
    fs.open(lib.baseDir+file+'.log','a',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            //Apend the file and close it
            fs.appendFile(fileDescriptor,str+'\n',(err)=>{
                if(!err){
                    fs.close(fileDescriptor,(err)=>{
                        if(!err){
                            callback(false);
                        }
                        else{
                            callback('Error closing the file that was being appended!');
                        }
                    });
                }
                else{
                    callback('Error appending the file.');
                }
            });
        }
        else{
            callback('Could not open the file for appending!');
        }
    });
};

//List all the logs, and include optionally compressed logs
lib.list=(includeCompressedLogs,callback)=>{
    fs.readdir(lib.baseDir,(err,data)=>{
        if(!err && data && data.length>0){
            let trimmedFileNames=[];
            data.forEach(fileName => {
                //Add the .log files
                if(fileName.indexOf('.log')>-1){
                    trimmedFileNames.push(fileName.replace('.log',''));
                }

                //Add the .gz files
                if(fileName.indexOf('.gz.b64')>-1&& includeCompressedLogs){
                    trimmedFileNames.push(fileName.replace('.gz.b64',''));
                }
            });
            callback(false,trimmedFileNames);
        }
        else{
            callback(err,data);
        }
    });
};

//Compress the contents of one .log file into a .gz.b64 within the same idrectory
lib.compress=(logId, newFileId, callback)=>{
    const sourceFile= logId+'.log';
    const destFile= newFileId+'.gz.b64';

    //Read the source file
    fs.readFile(lib.baseDir+sourceFile,'utf-8',(err,inputString)=>{
        if(!err && inputString){
            //compress the data using gzip
            zlib.gzip(inputString,(err,buffer)=>{
                if(!err && buffer){
                    fs.open(lib.baseDir+destFile,'wx',(err, fileDescriptor)=>{
                        if(!err && fileDescriptor){
                            //Write to the destinatio file
                                fs.writeFile(fileDescriptor,buffer.toString('base64'),(err)=>{
                                    if(!err){
                                        //Close the destination file
                                        fs.close(fileDescriptor,(err)=>{
                                            if(!err){
                                                callback(false);
                                            }
                                            else{
                                                callback(err);
                                            }
                                        });
                                    }
                                    else{
                                        callback(err);
                                    }
                                });
                        }
                        else{
                            callback(err);
                        }
                    });
                }
                else{
                    callback(err);
                }
            });
        }
        else{
            callback(err);
        }
    });
}; 

//Decompress the contents of a .gz.b64 file into a string variable
lib.decompress=(fileId,callback)=>{
    const fileName=fileId+'.gz.b64';
    fs.readFile(lib.baseDir+fileName,'utf8',(err,str)=>{
        if(!err && str){
            //decompress the data
            const inputBuffer=Buffer.from(str,'base64');
            zlib.unzip(inputBuffer,(err,outputBuffer)=>{
                if(!err && outputBuffer){
                    //callback the output buffer
                    const str=outputBuffer.toString();
                    callback(false,str); 
                }
                else{
                    callback(err)
                }
            });
        }
        else{
            callback(err);
        }
    });
};

//Truncate the log file
lib.truncate=(logId,callback)=>{
    fs.truncate(lib.baseDir+logId,0,(err)=>{
        if(!err){
            callback(false);
        }
        else{
            callback(err);
        }
    });
};

 //Export the module
 module.exports=lib;