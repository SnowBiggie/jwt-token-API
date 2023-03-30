const express = require('express');
const jwt = require("jsonwebtoken")
const PORT = 3000;
const app = express();
app.use(express.json());

// mock users for the project 
const users = [
    {
        id: "1",
        username: "John",
        password: "1254@gdgrre",
        isAdmin: true
    },
    {
        id: "2",
        username: "Sam",
        password: "855629@sdrgtgg",
        isAdmin: false
    }
];

let refreshTokens = [];

app.post('api/refresh', (req, res)=>{
    // take th refresh token from the user
    const refreshToken = req.body.token;

    //send error if there is no token or it is invalid
    if(!refreshToken){
        return res.status(401).json('you are not authenticated');
    }

    // if refresh toekn in not in the dB or array, send an error
    if(refreshTokens.includes(refreshToken)){
        return res.status(403).json('Refresh token is not valid');
    }
    //if everything is ok, create new access token, refresh token and send to user
    jwt.verify(refreshToken, 'myRefreshSecretToken', (err, user)=>{
        err && console.log(err);
        //remove the refresh token
        refreshTokens = refreshTokens.filter((token)=>{
            token !== refresh
        });
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.push(newRefreshToken);
        res.status(200).json({
            accesToken: newAccessToken,
            refreshToken: newRefreshToken,

        })
    })
});

const generateAccessToken =(user)=>{
    return jwt.sign({id: user.id, isAdmin: user.isAdmin}, 'mysecret',{
            expiresIn: '20s'
        });
};

const generaterefreshToken =(user)=>{
    return jwt.sign({id: user.id, isAdmin: user.isAdmin}, 'myRefreshSecretToken');
}

app.post("/api/login", (req, res) => {
    const {username, password} = req.body;
    const user = users.find((u) =>{
        return u.username === username && u.password === password;
    });
    if(user) {
        // generate access token
        const accessToken = generateAccessToken(user);
        const refreshToken = generaterefreshToken(user);
        refreshTokens.push(refreshToken);
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accesToken,
            refreshToken
        })

    }else{
        res.status(400).json("username or password incorrect")
    }
})

const verify =(req, res, next)=>{
    const auth = req.headers.authorization;
    if(auth){
        //athorize
        const token = auth.split(" ")[1];

        jwt.verify(token,'mysecret', (err, user)=>{
            if(err){
                return res.status(403).json('json token is not valid')
            }
            req.user = user;
            next();
        });
    }else{
        res.status(401).json("not authenticated")
    }
}

app.delete('/api/users/:userid', verify,(req, res)=>{
    if(req.user.id === req.params.userid || req.user.isAdmin){
        res.status(200).json("user deleted.")
    }else{
        res.status(403).json('you are not allowed to delete this user')
    }
});

app.use('/api/logout', verify, (req, res)=>{
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token)=> token !== refreshToken);
    res.status(200).json('you logged out successfully')
});

app.listen(PORT, ()=>{
    console.log(`Listerning on port ${PORT}`)
});