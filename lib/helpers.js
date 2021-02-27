
const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');

const helpers ={};

helpers.hash = (password)=>{
    if(typeof(password) == 'string' && password.length > 0){
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
        return hash;
    }else{
        return false;
    }
}

helpers.parseJsonToObject = (str)=>{
    if(str && str.length > 0){
        try{
            const obj = JSON.parse(str);
            return obj;
        }catch (err){
            console.log('Could not parse',err.message);
            return {};
        }
    }
    
};

helpers.createRandomString = (strLength)=>{
    strLength = typeof(strLength) == 'number' && strLength >0 ? strLength: false;

    if(strLength){
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let str = ''
        let randomChar = ''
        for (i=1; i<=strLength; i++){
            randomChar = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
            str += randomChar;
        }
        return str;
    }else{
        return false;
    }

    
}

helpers.sendPaymentStripe = (amount,callback)=>{
    console.log(amount);
    const chargeObject = 
    {
        
        "object": "charge",
        "amount": amount,
        "amount_captured": 0,
        "amount_refunded": 0,
        "application": null,
        "application_fee": null,
        "application_fee_amount": null,
        "balance_transaction": "txn_1IF60UEysDRGA73lJQlMW1XN",
        "billing_details": {
          "address": {
            "city": null,
            "country": null,
            "line1": null,
            "line2": null,
            "postal_code": null,
            "state": null
          },
          "email": null,
          "name": "Jenny Rosen",
          "phone": null
        },
        "calculated_statement_descriptor": null,
        "captured": false,
        "created": 1614360808,
        "currency": "usd",
        "customer": null,
        "description": "My First Test Charge (created for API docs)",
        "disputed": false,
        "failure_code": null,
        "failure_message": null,
        "fraud_details": {},
        "invoice": null,
        "livemode": false,
        "metadata": {},
        "on_behalf_of": null,
        "order": null,
        "outcome": null,
        "paid": true,
        "payment_intent": null,
        "payment_method": "card_1IOGj8EysDRGA73liwaYB5TH",
        "payment_method_details": {
          "card": {
            "brand": "visa",
            "checks": {
              "address_line1_check": null,
              "address_postal_code_check": null,
              "cvc_check": "pass"
            },
            "country": "US",
            "exp_month": 8,
            "exp_year": 2022,
            "fingerprint": "sKQsd79UUrM2n9Fy",
            "funding": "credit",
            "installments": null,
            "last4": "4242",
            "network": "visa",
            "three_d_secure": null,
            "wallet": null
          },
          "type": "card"
        },
        "receipt_email": null,
        "receipt_number": null,
        "refunded": false,
        "refunds": {
          "object": "list",
          "data": [],
          "has_more": false,
          "url": "/v1/charges/ch_1IPABwEysDRGA73lEsmlz624/refunds"
        },
        "review": null,
        "shipping": null,
        "source_transfer": null,
        "statement_descriptor": null,
        "statement_descriptor_suffix": null,
        "status": "succeeded",
        "transfer_data": null,
        "transfer_group": null
    }

    const chargeObject2 = {
        "amount": 2000,
        "currency": "mxn",
        "source" : "tok_visa"
    }

    const stringPayload = querystring.stringify(chargeObject);

    const requestDetails ={
        'protocol': 'https:',
        'hostname': 'api.stripe.com',
        'method': 'POST',
        'path': 'v1/charges',
        
        'headers': {
            'Content-Type': 'application/json',
            'Content-Length' : Buffer.byteLength(stringPayload)
        }
    }

    let req = https.request(requestDetails, (res)=>{
        let status = res.statusCode;
        if(status = 200 || status ==201){
            callback(false);
        }else{
            callback('Status code returned was' + status);
        }
    });

    req.on('error',(err)=>{
        callback(err);
    });

    req.write(stringPayload);
    req.end();


}

helpers.sendMailtoUser = (email, amount, callback)=>{

    const mailObject = {
        "from": "Mailgun Sandbox <postmaster@sandbox6051217c1bd048ccbc7c40f2405b23ca.mailgun.org>",
        "to": email,
        "subject": "Here is your receipt from Node Pizza!",
        "text": `The total amount of your purchase is: ${amount}. The meal will arrive shortly. Enjoy your meal!`
    };

    const stringPayload = querystring.stringify(mailObject);

    const requestDetails ={
        'protocol': 'https:',
        'hostname': 'api.mailgun.net',
        'method': 'POST',
        'path': 'v3/sandbox6051217c1bd048ccbc7c40f2405b23ca.mailgun.org/messages',
        'headers': {
            'Content-Type': 'application/json',
            'Content-Length' : Buffer.byteLength(stringPayload)
        }
    }

    let req = https.request(requestDetails, (res)=>{
        let status = res.statusCode;
        if(status = 200 || status ==201){
            callback(false);
        }else{
            callback('Status code returned was' + status);
        }
    });

    req.on('error',(err)=>{
        callback(err);
    });

    req.write(stringPayload);
    req.end();


}


module.exports = helpers;