// import jsonwebtoken from "jsonwebtoken";

function verifyToken(token) {
        var jwtverify= require('jsonwebtoken');
        var cert = fs.readFileSync('public.pem');  
        return jwtverify.verify(token, cert, null);
    }