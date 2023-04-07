require('dotenv').config();
const { google } = require('googleapis');
const express = require('express')
const axios = require('axios')
const OAuth2Data = require('./google_key.json')

const app = express()

app.set('view engine', 'ejs');

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;

app.get('/', (req, res) => {
    if (!authed) {
        res.render('index');
    } else {
        var oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2'});
        oauth2.userinfo.v2.me.get(function(err, result) {
            if (err) {
                console.log(err);
            } else {
                loggedUser = result.data.name;
                console.log(loggedUser);
            }
            res.render('google', { loggedUser: loggedUser, picture: result.data.picture});
        });
    }
})

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/')
            }
        });
    }
});

app.get('/auth/github/callback', function (req, res) {
const requestToken = req.query.code
  
axios({
  method: 'post',
  url: `https://github.com/login/oauth/access_token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${requestToken}`,
  headers: {
       accept: 'application/json'
  }
}).then((response) => {
  access_token = response.data.access_token
  res.redirect('/success_git');
})
});

app.get('/signin/google', function (req, res) {
    // Generate an OAuth URL and redirect there
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile'
    });
    console.log(url)
    res.redirect(url);            
});

app.get('/signin/github', function (req, res) {
    res.render('githubLogin', {client_id: process.env.CLIENT_ID});
});

app.get('/success_git', function(req, res) {

    axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {
        Authorization: 'token ' + access_token
      }
    }).then((response) => {
      res.render('github',{ userData: response.data });
    })
});

app.get('/logout/google', function (req, res) {
    if(authed) {
        authed = false;
    }
    res.redirect('/');           
});


const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));