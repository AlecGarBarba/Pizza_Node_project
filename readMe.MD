# Pirple Node Pizza service breakdown.

## API calls

Token in headers for:
get user, update user, update token, delete token,

Examples:

_Creating an user_
payload:
{
"fullName": "Alec Barba",
"email": "alecburbu@gmail.com",
"streetAddress": "Bakery street,123. North Pole",
"password" : "contraseña",
"tosAgreement": true
}
_Reading user data:_

payload
{

}

TODO: implement token create, update, delete. Test all, users & tokens req with postman
