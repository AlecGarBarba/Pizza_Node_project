/**
 * Library for storing and editing data
*/

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers')

const lib ={};
//base directory
lib.baseDirectory = path.join(__dirname, '/../.data/');

lib.create = function(dir,file,data,callback){
    // Open the file for writing
    fs.open(lib.baseDirectory+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
      if(!err && fileDescriptor){
        // Convert data to string
        var stringData = JSON.stringify(data);
  
        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData,function(err){
          if(!err){
            fs.close(fileDescriptor,function(err){
              if(!err){
                callback(false);
              } else {
                callback('Error closing new file');
              }
            });
          } else {
            callback('Error writing to new file');
          }
        });
      } else {
        callback('Could not create new file, it may already exist');
      }
    });
};




lib.read = (dir, filename, callback)=>{
    fs.readFile(lib.baseDirectory+dir+'/'+filename+'.json', 'utf-8', (error,data)=>{
        if(!error && data){
            const parsedData = helpers.parseJsonToObject(data);
            callback(false,parsedData);
        }else{
            callback(error,data);
        }
        
    });

}

lib.update = (directory,filename, data, callback )=>{
    fs.open(lib.baseDirectory+directory+'/'+filename+'.json', 'r+', (err, fileDescriptor)=>{
        if(!err && fileDescriptor){
            const stringData = JSON.stringify(data);
            //truncate contents of file before writing on top
            fs.ftruncate(fileDescriptor,(err)=>{
                if(!err){
                    //write to file and close :);
                    fs.writeFile(fileDescriptor, stringData, (err)=>{
                        if(!err){
                            fs.close(fileDescriptor,(err)=>{
                                if(!err){
                                    callback(false);
                                }else{
                                    callback('Error closing the file.')
                                }
                            })
                        }else{
                            callback('Error updating the file.')
                        }
                    })
                }else{
                    callback('Error truncating the file.')
                }
            });
        }else{
            callback('Could not open the file for updating. It may not exist yet', err);
        }
    });
}

lib.delete = (dir, filename, callback)=>{
    //Unlinking the file (delete)
    fs.unlink(lib.baseDirectory+dir+'/'+filename+'.json', (err)=>{
        if(!err){
            callback(false);
        }else{
            callback('Error deleting the file.')
        }
    })
}

//List all the items in a directory
lib.list = (dir, callback)=>{
    fs.readdir(lib.baseDirectory+dir+'/',(err,data)=>{
        if(!err && data && data.length>0){
            let trimmedFileNames = [];
            data.forEach((fileName)=>{
                trimmedFileNames.push(fileName.replace('.json',''));
            });
            callback(false,trimmedFileNames);
        }else{
            callback(err,data);
        }
    })
}

module.exports = lib