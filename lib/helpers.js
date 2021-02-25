
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

helpers.sendPaymentStripe = ()=>{

}

helpers.sendMailtoUser = ()=>{

}

helpers.sendTwilioSms = (phone,msg,callback)=>{
    //validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() :false;
    msg = typeof(msg) == 'string' && msg.trim().length >0 && msg.trim().length <=1600 ? msg.trim() :false;
    if(phone && msg){
        const payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+521'+phone,
            'Body': msg
        };
        const stringPayload = querystring.stringify(payload);
        const requestDetails ={
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        }

        //instantiate the req object
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

    }else{
        callback('Given parameters are missing or invalid')
    }
}


module.exports = helpers;