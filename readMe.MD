# Pirple Node Pizza service breakdown.

<!-- prettier-ignore-start -->
Full backend Node Pizza project! Full backend for users to create accounts and shop their favorite pizza. This backend handles user authentication via tokens, has a menu route to handle the shopping cart and can create payments via stripe API, and mail the receipts via mailgun. Since this is built entirely on node, there is no need to NPM install or NPM init anything, so with node installed, it runs right off the bat.

This REST API can handle complete CRUD operations for every user. But reading, updating and deleting can only be performed with token validation.  

Reading the menu can be done by anyone, but it cannot be updated via the API as of now.   

The user can update its shopping cart through the shop route.  Just needs a valid token, and the id of the menu. This adds the item to the user's shopping cart

The user can delete any item from the shopping cart using the menu route as well. Same requirements as above.

To create an order of its shopping cart, the user must create a post request to the orders route, identifying itself with email and valid token. The system will automatically check the shopping cart, place the order, process the payment, send the receipt and empty the shopping cart.

CRUD operations can be done on tokens as well.  

### On payment processing:  
    Since It is currently in sandbox mode, no actual card payment process has to be made whatsoever. The API call, I believe, just tests that the amount and currency are alright.
### On receipt mailing:  
    Same as payment processing. The call is only on sandbox mode, so it can be possible that the actual receipt could not be received. (Sorry for that, I haven't been able to validate my account). However, the API call does return a status 200. 
## MODELS
This Node project has three main models: Users, Tokens, and Menu. 

* User model example:  
    {   
        "fullName":"John Smith",
        "email":"user@mail.com",
        "streetAddress":"Bakery street,123. North Pole",
        "hashedPassword":"fb55a2a23a4fa464f193a21004cd297d998f6d56cf715fee10f7452263296498",
        "tosAgreement":true,
        "ShoppingCart": ["item1", "item2","item3",...]
    }  

* Token model example:  
    {   
        "email":"user@mail.com","id":"2cfnfn6zkkdnplqjjlmn",
        "expires":1614272396643 
    }  
* menu can be found @ .data/menu/menu.json 

## API call examples

### USERS

path (staging):   localhost:3000/users

Examples:  

*Creating an user*  
* method: POST localhost:3000/users

* payload:  
    {
    "fullName": "John Doe",
    "email": "john@test.com",
    "streetAddress": "Bakery street,123. North Pole",
    "password" : "securePassword",
    "tosAgreement": true
    }  
* returns:  
    status 200  

_*Reading user data:*_  
* method: get localhost:3000/users
* header:  
    token : [valid_token]

* query:  
    ?email=john@test.com
* returns:  
    {
    "fullName": "John Doe",
    "email": "john@test.com",
    "streetAddress": "Bakery street,123. North Pole",
    "password" : "securePassword",
    "tosAgreement": true
    }  

_*Updating user Data*_  
* method: PUT localhost:3000/users
* header:  
    token : [valid_token]
* payload:   
    {  
        "email" : "john@test.com"
        "fullName" : "John William Doe"
    }  
*email is required, FullName, password or street addr are optional but there must exist one of them.

* returns:  
    status 200  

*deleting user*  
* method: DELETE localhost:3000/users
* headers:  
    token : [valid_token]
* payload:  
    {  
        "email" :"john@test.com"
    }  
* returns:  
    status 200  

### TOKENS

path (staging):  
localhost:3000/tokens

*creating token*  
* method: POST localhost:3000/tokens
* payload:  
    {  
        "email" : "john@test.com",
        "password" : "securePassword"
    }  

* returns:  
    status 200  
    {  
        "email" : "john@test.com",
        "id": "abcdefghijklmnopqrst",
        "expires": 1614276985652
    }  

*Reading token*  
* method: GET localhost:3000/tokens
* query:      ?id=abcdefghijklmnopqrst
* returns:  
    status 200  
    {  
    "email": "mail@test.com",
    "id": "abcdefghijklmnopqrst",
    "expires": 1234576789123
    }  



*updating token*  
* payload:  
    {  
        "id": "abcdefghijklmnopqrst",
        "extend":true
    }  

* returns:  
    status 200  

*deleting token*  

* query:  
    ?id="abcdefghijklmnopqrst"  

* returns:  
    status 200  

### Menu
path (staging):  
localhost:3000/menu

*Read all the menu*
* method - GET localhost:3000/menu
* returns: 
status 200
{
    "item1": {"price": 129, "description" : "bla bla" },
    "item2": {"price": 129, "description" : "bla bla" },
    ...
}

*Update shopping cart*
*method PUT - localhost:3000/menu


*delete item from shopping cart*

### Shopping cart
The only valid methods are put to update the shopping cart (just to add 1 item at a time), and delete (same, 1 item at a time based on the key in the menu, referenced as menuID)
*Update shopping cart*
* method -put localhost:3000/shop
* header - token : [valid_token]
* payload:
    {
    "email": "john@test.com",
    "menuID": "pepperoniPizza"
    }
* returns 
    [
    "pepperoniPizza"
    ]

*Delete item from shopping cart* 
* method -delete localhost:3000/shop
* header - token : [valid_token]
* payload:
    {
    "email": "john@test.com",
    "menuID": "pepperoniPizza"
    }
* returns 
    [
    ]
    *if the actual item was inside the shopping cart, though.

### Orders
The only valid option is to create an order with post. This method checks if the shopping cart has items, and sends to stripe API and Mailgun API a post method to process payment and mail the user. The orders are placed in the .data/orders folder before any payment attempt or receipt sending.

*Create a new order*
* method - post localhost:3000/orders
* header - token : [valid_token]
* payload:
    {
    "email": "john@test.com"
    }
* returns:  status 200

<!-- prettier-ignore-end -->
