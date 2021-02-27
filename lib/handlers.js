const config = require('./config')
const _data = require('./data');
const helpers = require('./helpers')


let handlers = {};

handlers.users = (data,callback)=>{
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) >-1){
        handlers._users[data.method](data,callback);
    }else{
        callback(405);
    }
}

//containers for users submethods

handlers._users = {}
//required data: fullName, email, street address, password,tosAgreement
//opt data: none!
handlers._users.post = (data,callback)=>{
    const regExEmail = /^([a-zA-Z0-9\.-]+)@([a-zA-Z0-9\-]+).([a-zA-Z]{2,8})(.[a-z]{2,8})?$/; //general-ish regex for mails. Could improve significantly.

    const fullName = typeof(data.payload.fullName) == 'string' && data.payload.fullName.trim().length >0 ? data.payload.fullName.trim() : false;
    const email = typeof(data.payload.email) == 'string' && regExEmail.test(data.payload.email.trim()) ? data.payload.email.trim() : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length >0 ? data.payload.streetAddress.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;
    
    if(fullName && email && streetAddress && password && tosAgreement){
        //Make sure that the user doesn't exist.
        _data.read('users',email, (err,data)=>{
            if(err){ //if no user has been created, do:
                const hashedPassword = helpers.hash(password);
                
                if(hashedPassword){
                    const userObject = {
                        'fullName' : fullName,
                        'email' : email,
                        'streetAddress' : streetAddress,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement': true
                    }
                    _data.create('users', email,userObject,(err)=>{
                        if(!err){
                            callback(200);
                        }else{
                            
                            callback(500,{'Error': 'Could not create a new user'})
                        }
                    })
                }else{
                    callback(500,{'Error': 'Could not hash the password'})
                }

                

            }else{
                callback(400,{'Error': 'A user with that email already exists'})
            }

        })
    }else{
        callback(400,{'Error' : 'Missing required fields'});
    }
};

/**
 * 
 * 
 * 
 */
//token required in header
// required: email
handlers._users.get = (data,callback)=>{
    
    const email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 4 ? data.queryStringObject.email.trim() : false;
    //get token from headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token,email,(tokenisValid)=>{
        if(tokenisValid){
            
            if(email){
                _data.read('users',email,(err,data)=>{
                    if(!err && data){
                        delete data.hashedPassword;
                        callback(200, data);
                    }else{
                        callback(404,{'Error': 'User does not exist'})
                    }
                })
            }else{
                callback(400,{'Error': 'Missing required field'})
            }
        }else{
            callback(403,{'Error': 'Missing required in header, or token is invalid'})
        }
    })
};

//Required Data: email
//optional data: fullName, password, streetAddress (at least one must be specified)
handlers._users.put = (data,callback)=>{
    const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 4 ? data.payload.email.trim() : false;
    const fullName = typeof(data.payload.fullName) == 'string' && data.payload.fullName.trim().length >0 ? data.payload.fullName.trim() : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length >0 ? data.payload.streetAddress.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
    if(email){
        if(fullName || streetAddress || password){

            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            handlers._tokens.verifyToken(token,email,(tokenisValid)=>{
                if(tokenisValid){
                    _data.read('users',email,(err,userData)=>{
                        if(!err && userData){
                            if(fullName){
                                userData.fullName= fullName;
                            }
                            if(streetAddress){
                                userData.streetAddress= streetAddress;
                            }
                            if(password){
                                userData.hashedPassword= helpers.hash(password);
                            }
                            _data.update('users',email,userData, (err)=>{
                                if(!err){
                                    callback(200);
                                }else{
                                    callback(500,{'Error': 'Server error. Could not update the user.'})
                                }
                            })
                        }else{
                            callback(400,{'Error': 'The specified user does not exist.'})
                        }
                    })
                }else{
                    callback(403,{'Error': 'Missing required in header, or token is invalid'})
                }
            })
        }else{
            callback(404, {'Error': 'Nothing to update'})
        }

    }else{
        callback(404, {'Error': 'Missing required field'})
    }
    
};


//required: email
handlers._users.delete = (data,callback)=>{
    const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 4 ? data.payload.email.trim() : false;
    if(email){
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,email,(tokenisValid)=>{
            if(tokenisValid){
                _data.read('users',email,(err,userData)=>{
                    if(!err && userData){
                        _data.delete('users',email,(err)=>{
                            if(!err){
                                callback(200); //nothing to delete here, since orders could be useful for the pizza place.
                                _data.delete('tokens',token,(err)=>{
                                    if(!err){
                                        console.log("token and user deleted")
                                    }else{
                                        console.log("Could not delete token!")
                                    }
                                })
                            } else {
                                callback(500,{'Error' : 'Could not delete the specified user'});
                            }
                        });
                    } else {
                        callback(400,{'Error' : 'Could not find the specified user.'});
                    }
                });
            }else{
                callback(403,{'Error': 'Token is invalid'})
            }
        })
    }else {
        callback(400,{'Error' : 'Missing required field'})
    }
};


/*********************************TOKENS***************************************************************** */

handlers.tokens = (data,callback)=>{
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) >-1){
        handlers._tokens[data.method](data,callback);
    }else{
        callback(405);
    }
}

handlers._tokens = {}
//Required: email, password
//opt: none
handlers._tokens.post = (data,callback)=>{
    const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 4 ? data.payload.email.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
    if(email && password){
        //lookup user who matches :)
        _data.read('users',email,(err,userData)=>{
            if(!err && userData){
                //hash pass and compare
                const hashedPassword= helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    //create JWT 1hr valid
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now()+1000*60*60;
                    const tokenObject ={
                        'email': email,
                        'id': tokenId,
                        'expires': expires
                    };

                    _data.create('tokens',tokenId,tokenObject,(err)=>{
                        if(!err){
                            callback(200,tokenObject)
                        }else{
                            callback(500,{'Error': 'Could not create the new token'})
                        }                        
                    })
                }else{
                    callback(400,{'Error':'Password did not match the specified user stored password.'})
                }
            }else{
                callback(400,{'Error': 'Could not find the specified user'})
            }
        })
    }else{
        callback(400, {'Error': 'Missing required fields'})
    }
}
//Required: id;
//opt: none;
handlers._tokens.get = (data,callback)=>{
    //Check the id is valid;
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim(): false;
    if(id){
        _data.read('tokens',id,(err,tokenData)=>{
            if(!err && tokenData){
                callback(200, tokenData);
            }else{
                callback(404,{'Error': 'User does not exist'})
            }
        })
    }else{
        callback(400,{'Error': 'missing field or invalid value'})
    }

}
//required -> id[String], extend[bool]. opt=none
handlers._tokens.put = (data,callback)=>{
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length ==20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend ==true ? true : false;
    if(id && extend){
        _data.read('tokens',id,(err,tokenData)=>{
            if(!err && tokenData){
                //check token isn't expired
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now()+ 1000*60*60;

                    _data.update('tokens',id,tokenData,(err)=>{
                        if(!err){
                            callback(200);
                        }else{
                            callback(500,{'Error': 'Could not update the token expiration'})
                        }
                    })
                }else{
                    callback(400,{'Error':'The token has already expired and cannot be extended'})
                }
            }else{
                callback(400,{'Error': 'Specified token does not exist'})
            }
        })
    }else{
        callback(400,{'Error': 'Missing required fields or fields are invalid'})
    }
}

//Rquired: id . opt = None
handlers._tokens.delete = (data,callback)=>{
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim(): false;
    if(id){
        // Lookup the user
        _data.read('tokens',id,(err,data)=>{
            if(!err && data){
                _data.delete('tokens',id,(err)=>{
                    if(!err){
                        callback(200);
                    } else {
                        callback(500,{'Error' : 'Could not delete the specified token'});
                    }
                });
            } else {
                callback(400,{'Error' : 'Could not find the specified token.'});
            }
        });
    }else {
        callback(400,{'Error' : 'Missing required field'})
    }
}

//Verify if a given token id is currently valid for a given user

handlers._tokens.verifyToken = (id,email,callback)=>{
    _data.read('tokens',id,(err,tokenData)=>{
        if(!err && tokenData){
            if(tokenData.email == email && tokenData.expires > Date.now()){
                callback(true);
            }else{
                callback(false);
            }
        }else{
            callback(false);
        }
    })
};

/*********************************menu**************************************************************************** */
handlers.menu = (data,callback)=>{
    const acceptableMethods = ['get'];
    if(acceptableMethods.indexOf(data.method) >-1){
        
        handlers._menu[data.method](callback);
    }else{
        callback(405);
    }
}

handlers._menu = {};


handlers._menu.get = (callback)=>{
    _data.read('menu','menu', (err,menuData)=>{
        if(!err){
            callback(200,{menuData})      
        }else{
            callback(500,{'Error': 'Could not read the menu stored in server'})
        }
    })
}

/**********************shop*******************************************************/
//Create post request to add to shopping cart

handlers.shop = (data,callback)=>{
    const acceptableMethods = ['put','delete'];
    if(acceptableMethods.indexOf(data.method) >-1){
        handlers._shop[data.method](data,callback);
    }else{
        callback(405);
    }
}
handlers._shop = {}


//Update the shopping cart
//required: email, token, menuID
handlers._shop.put = (data,callback)=>{
    const email = typeof(data.payload?.email) == 'string' && data.payload.email.trim().length > 4 ? data.payload.email.trim() : false;
    const menuID = typeof(data.payload?.menuID) == 'string' && data.payload.menuID.trim().length > 0 ? data.payload.menuID.trim() : false;
    if(email && menuID){
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,email,(tokenisValid)=>{
            if(tokenisValid){
                _data.read('menu','menu',(err,menuData)=>{
                    if(!err && menuData){
                            if(menuData[menuID] !== undefined){ //valid menu id
                                _data.read('users', email,(err,userData)=>{
                                    if(!err){
                                        let shoppingCart = typeof(userData.shoppingCart) == 'object' && userData.shoppingCart instanceof Array ? userData.shoppingCart : [];
                                        userData.shoppingCart = shoppingCart;
                                        userData.shoppingCart.push(menuID)
                                        
                                        _data.update('users',email,userData,(err)=>{
                                            if(!err){
                                                callback(200,userData.shoppingCart)
                                            }else{
                                                callback(500,{'Error': 'Could not update the check'})
                                            }
                                        })
                                        
                                    }else{
                                        callback(500,{'Error': 'Internal server error'})
                                    }
                                })
                                
                            }else{
                                callback(400,{'Error': 'invalid menu item'})
                            } 
                    }else{
                        callback(500,{'Error': 'Internal server error'})
                    }
                })

            }else{
                callback(400, {'Error': 'Invalid token'})
            }
        })
    }else{
        //callback(400,{'Error':'Missing required inputs, or inputs are invalid'})
        callback(405, {'Error': 'missing required fields'});
    }
}

//Delete item from shopping cart

handlers._shop.delete = function(data,callback){
    const email = typeof(data.payload?.email) == 'string' && data.payload.email.trim().length > 4 ? data.payload.email.trim() : false;
    const menuID = typeof(data.payload?.menuID) == 'string' && data.payload.menuID.trim().length > 0 ? data.payload.menuID.trim() : false;
    if(email && menuID){
      // Lookup the check
      
      _data.read('users',email,function(err,userData){
        if(!err && userData){
          let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token,email,function(tokenIsValid){
              
            if(tokenIsValid){
                const itemIndexToRemove = userData.shoppingCart.indexOf(menuID)
                // Delete the item from the array.
                if(itemIndexToRemove > -1){
                    userData.shoppingCart.splice(itemIndexToRemove,1);
                    _data.update('users',email,userData,(err)=>{
                        if(!err){
                            callback(200,userData.shoppingCart);
                        }else{
                            callback(400,{'Error': 'Could not delete the request'})
                        }
                    })
                }else{
                    callback(405, {'Error': 'Invalid ID or shopping cart empty.'})
                }
            } else {
              callback(403);
            }
          });
        } else {
          callback(400,{"Error" : "user not found"});
        }
      });
    } else {
      callback(400,{"Error" : "Missing required fields"});
    }
};





/*************************************Create Orders ******************************************************/
handlers.orders = (data,callback)=>{
    const acceptableMethods = ['post']; //just post for the moment.
    if(acceptableMethods.indexOf(data.method) >-1){
        
        handlers._orders[data.method](data,callback);
    }else{
        callback(405); 
    }
}

handlers._orders = {};

//required:  whatever stripe needs, plus token and email.

handlers._orders.post = (data,callback)=>{
    //Validate inputs
    const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 4 ? data.payload.email.trim() : false;
    
    if(email){
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,email,function(tokenIsValid){
            if(tokenIsValid){
                _data.read('users',email,(err,userData)=>{
                    if(!err && userData){
                        const shoppingCart = userData.shoppingCart;
                        let price = 0;
                        if(shoppingCart.length > 0){
                            _data.read('menu','menu',(err,menu)=>{
                                if(!err && menu){
                                    shoppingCart.forEach((item)=>{
                                        price = price + menu[item].price;
                                    })
                                    const orderID = helpers.createRandomString(20);
                                    const orderObject = {
                                        "price" : price,
                                        "user" : userData.email,
                                        "streetToDeliver": userData.streetAddress
                                    }
                                    _data.create('orders',orderID,orderObject, (err)=>{
                                        if(!err){
                                            console.log("Order Created");
                                            helpers.sendPaymentStripe(price, (err)=>{
                                                if(!err){//Payment has been sent. 
                                                    //create random string to generate an order :)
                                                    
                                                    //Time to remove everything from shopping cart.
                                                    userData.shoppingCart = [];
                                                    _data.update('users',email,userData,(err)=>{
                                                        if(!err){
                                                            console.log("payment made, shopping cart emptied");
                                                            helpers.sendMailtoUser(email,price,(err)=>{
                                                                if(!err){
                                                                    callback(200);
                                                                }  else{
                                                                    callback(500, {'Error': 'Your payment has been made, but the receipt could not be sent to your email.'})
                                                                }
                                                            })
                                                            
                                                        }else{
                                                            callback(500, {'Error': 'Your payment has been made, however the shopping cart could not be emptied. Please manually remove the items.'})
                                                        }
                                                    })
                                                    
        
                                                }else{
                                                    console.log(err)
                                                    callback(500, {'Error':'Could not process payment'});
                                                }
                                            });
                                        }else{
                                            console.log("Order could not be created.")
                                        }
                                    });

                                    
                                }else{
                                    callback(500);
                                }
                            });
                        }else{
                            callback(400, {'Error': 'Empty cart'})
                        }
                        
                    }else{
                        callback(500);
                    }
                })
            }else{
                callback(400,{'Error': 'Invalid token or email'})
            }
        });

    }else{
        callback(400,{'Error':'Missing required inputs, or inputs are invalid'})
    }
}


//not found handler

handlers.notFound = (data,callback)=>{
    callback(404);
}

handlers.ping = (data,callback)=>{
    callback(200);
}



module.exports = handlers; 