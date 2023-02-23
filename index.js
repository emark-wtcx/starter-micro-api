const express = require('express');
const app = express();
const path = require('path');
var logDe = 'passcreator_success_log'
var errorDe = 'passcreator_error_log'
var testUrl = 'https://eo2mifqm9yelk7e.m.pipedream.net'
var testUrl = '/execute'
var tokenUrl = 'https://mc3tb2-hmmbngz-85h36g8xz1b4m.auth.marketingcloudapis.com/v2/token'

var HOME_DIR = '/';
var postDebug = true
var dataType = 'application/json'
var access_token = null /* Raw token */
var accessToken = null /* Parsed token */
var tokenExpiry = null;
var restDomain = null /* REST domain for logging */

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
var PORT = process.env.port || 8080;

/**
 *
 * Front End Routes 
 * 
**/
app.use('/', express.static(__dirname + HOME_DIR));

app.get('/', function (req, res) {
  res.sendFile(path.resolve('index.html'));
});

/**
 *  Mock form access
 * */
app.get('/form', function (req, res) {
  res.sendFile(path.resolve('./html/form.html'));
});

/**
 *  Tesing area access
 **/
app.get('/test', function (req, res) {
  res.sendFile(path.resolve('./html/test_area.html'));
});

/**
 *  
 * Back End Routes
 * 
**/

/**
 * Send payload to Passcreator 
 */
app.post('/execute',async function (req, res, next) { 
  if (postDebug) console.log('/execute called ')
  if (req.body != null){
    await postMessage(req.body).then((serverResponse) => {
    if (postDebug) console.log('/execute Response: ')
    if (postDebug) console.table(serverResponse)
    return res.json(serverResponse)
    })
  }else{
    return {'message':'No data submitted'}
  }
})

/**
 * Test reading data from a DataExtension identified by CustomerKey 
 */
app.post('/getde',async function (req, res, next) { 
  if (req.body.customerKey != null){
    let getde = await getDataExtension(req.body.customerKey).then((getServerResponse) => {
    return res.json(getServerResponse)
    })
    return getde
  }else{
    return {'message':'No data submitted'}
  }
})

/**
 * Test requesting an authentication token
 */
app.post('/testauth',async function (req, res, next) { 
  if (postDebug) console.log('/testauth called ') 
  if (req != null){
    await getAccessToken().then((getAuthResponse) => {
      if (postDebug) console.log('/testauth Response: ')
      if (postDebug) console.table(getAuthResponse)
      return res.json(getAuthResponse)
    })
  }else{
    return {'message':'No data submitted'}
  }
})

/**
 * Test writing data to the log 
 */
app.post('/testlog',async function (req, res, next) { 
  if (postDebug) console.log('(/testlog) called') 
  if (req != null){
    await logData('Log test',req.body)
    .then((logResponse) => {
      if (postDebug) console.log('(/testlog) Response: ')
      if (postDebug) console.table(logResponse)
      return res.send(logResponse)
    }).catch(errorObject => {
      let errorString = JSON.stringify(errorObject)
      // Broadcast error 
      if (postDebug) console.log('(/testlog) Error:'+errorString);
      return errorString;
    })
  }else{
    return {'message':'No data submitted'}
  }
})

/**
 * Send a mock payload to the test endpoint 
 */
app.post('/testmessage',async function (req, res, next) { 
  if (postDebug) console.log('/testmessage called ')
  if (req.body != null){
    await postMessage(req.body).then((serverResponse) => {
    if (postDebug) console.log('/testmessage Response: ')
    if (postDebug) console.table(serverResponse)
    return res.json(serverResponse)
    })
  }else{
    return {'message':'No data submitted'}
  }
})


/**
 * Generic Error Handling
 */
app.use(function (err, req, res, next) {
  console.table(err.stack)
  res.status(500).send('Something broke!')
})


/**
 *  Back End Functions
* */

function guid() { 
  var d = new Date().getTime();//Timestamp
  var d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16;//random number between 0 and 16
      if(d > 0){//Use timestamp until depleted
          r = (d + r)%16 | 0;
          d = Math.floor(d/16);
      } else {//Use microseconds since page-load if supported
          r = (d2 + r)%16 | 0;
          d2 = Math.floor(d2/16);
      }
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getDateTime(){
  let d = new Date();
  var requestDate = d.toLocaleDateString()
  var requestTime = d.toLocaleTimeString()
  var dateTime = requestDate+'-'+requestTime;
  return {
    'Date':requestDate,
    'Time':requestTime,
    'DateTime':dateTime,
    'ISODateTime':d.toISOString()
  }
}
/**
 * Set the details from Journey Builder 
 */
function setToken(payload){
  if (postDebug) console.log('(setToken) setting token: '+payload.token)
  access_token = payload.token
  accessToken = 'Bearer '+access_token
}
function setRestUrl(payload){
  if (postDebug) console.log('(setRestUrl) setting restUrl: '+payload.restUrl)
  restDomain = payload.restUrl
}

async function postMessage(data){
  /**
   *  The inArguments property originates in JourneyBuilder
   *  if the property is missing, the request is a test
   */
  if (data.hasOwnProperty('inArguments')
    && data.inArguments[0].hasOwnProperty('endpoint')
    ){
    var messageData = data.inArguments[0]
  }else{
    var messageData = data
    messageData.endpoint = testUrl
    }

  if (postDebug) console.log('checking for: token')
  if (messageData.hasOwnProperty('token')){
    if (postDebug) console.log('prop found: token')
    setToken(messageData)
  }
  if (postDebug) console.log('checking for: restUrl')
  if (messageData.hasOwnProperty('restUrl')){
    if (postDebug) console.log('prop found: restUrl')
    setRestUrl(messageData)
  }
    
  if (postDebug) console.log('POST messageData: ')
  if (postDebug) console.table(messageData)

  var date = getDateTime();
  /**
   * Restructure call with 
   * PassCreator required fields
   * Include token for authenticating
   * SFMC API calls and URLs in case
   * of custom endpoints
   */
  var bodyContent = {
    "pushNotificationText":messageData.message+ ' | ['+date.Time+']',   
    "url":messageData.endpoint,
    "token":messageData.token,
    "authUrl":messageData.authUrl,
    "restUrl":messageData.restUrl
  }
  if (postDebug){
    console.log('POST bodyContent: ')
    console.table(bodyContent)
    }


  /**
   * Transmit Message via postDataToPassCreator function
   */
  let postResponse = postDataToPassCreator(messageData.endpoint, bodyContent)
    .then((dataResponse) => {
      //
      //  Build response 
      //
      var messageResponse = {
        'requestDate':date.DateTime,
        'requestData':bodyContent,
        'messageData':JSON.stringify(dataResponse)
      }
      //
      // Add call status if available
      //
      if (dataResponse && dataResponse.hasOwnProperty('status')){
        messageResponse.status = dataResponse.status
      }

      if (postDebug){
        console.log('pDTPC messageResponse:',messageResponse); 
        console.table(messageResponse);
      }
      return messageResponse
    });
  return postResponse
}

async function getDataExtension(customerKey){
  // Request setup
  var data = {}
  let dePath = 'https://www.exacttargetapis.com/data/v1/customobjectdata/key/{{dataextension}}/rowset/'
  data.url = dePath.replace('{{dataextension}}',customerKey)

  // Request content
  if (postDebug) console.log('getDataExtension Table by CustomerKey: ')
  if (postDebug) console.table(customerKey)
  
  // Perform Request
  var dataResponse = await getAccessToken().then(async (accessToken) => {
    if (postDebug) console.log('getDataExtension accessToken: ')
    if (postDebug) console.table(accessToken)

    /* Get DE Headers */
    var headers = {
      "Accept": dataType,
      "Content-Type": dataType,
      "Authorization":accessToken
    }

    if (postDebug) console.log('getDataExtension Headers: ')
    if (postDebug) console.table(headers)
    if (postDebug) console.log('getDataExtension Endpoint: '+data.url)

    //
    // Request Data via getData function
    //
    var getDataResponse = await getData(data.url,headers).then((dataResponse) => {
        // Return result
        return dataResponse        
      }).catch((error) => {
        console.log('getDataExtension Error:'+JSON.stringify(error))
        //logError(error)
        return JSON.stringify(error)
      });
      if (postDebug) console.log('getDataExtension getDataResponse: ')
      if (postDebug) console.table(getDataResponse)
      return getDataResponse; // return response
    })
    return dataResponse
}

async function logData(message,data={}){
  if (postDebug) console.log('logData called')
  let date = getDateTime();
  let logId = guid();
  let loggingUri = 'data/v1/async/dataextensions/key:'+logDe+'/rows'

  let row = {'items':[
    {
      'Id':logId,
      'DateTime':date.ISODateTime,
      'Message':message,
      'MetaData':JSON.stringify(data)
    }
    ]
  }
  
  if (postDebug) console.log('logData loggingUrl: '+loggingUri)
  if (postDebug) console.log('logData items: ')
  if (postDebug) console.table(row.items)

  var logResponse = await postData(loggingUri,row)   
    .then(async (logResponse) => JSON.stringify(logResponse))
    .then((logResponse) => {
    if (postDebug){
      console.log('logData logResponse: ')
      console.table(logResponse)
      }
    return logResponse
    });  
  return logResponse;
}


async function logError(message,data={}){
  let loggingUri = 'data/v1/async/dataextensions/key:'+errorDe+'/rows'
  let date = getDateTime();
  let logId = guid();

  let row = {'items':[
    {
      'Id':logId,
      'DateTime':date.ISODateTime,
      'Message':message,
      'MetaData':JSON.stringify(data)
    }
    ]
  }

  var logResponse = await postData(loggingUri,row)   
    .then(async (logResponse) => JSON.stringify(logResponse))
    .then((logResponse) => {
    if (postDebug){
      console.log('logError logResponse: ')
      console.table(logResponse)
      }
    return logResponse
    });  
  return logResponse;
}

/**
 * 
 *  External API call engines
 * 
 * */

function refreshToken(data){
  // Response time
  let d = new Date();
  let time = d.getTime()

  if (postDebug){
    console.log('Refreshing Token')
    console.log('Old Token: '+accessToken)
    }

  if (data.hasOwnProperty('access_token')){
    access_token = data.access_token    
    accessToken = 'Bearer '+access_token
    if (postDebug) console.log('Updated Authentication Token: '+accessToken)
  }
  if (data.hasOwnProperty('rest_instance_url')){
    restDomain = data.rest_instance_url
  }
  if (data.hasOwnProperty('auth_instance_url')){
    authDomain = data.auth_instance_url
  }
  if (data.hasOwnProperty('expires_in')){
    if (postDebug){
      
      console.log('refreshToken : (Date) | '+d)
      console.log('refreshToken : (Time) | '+time)
      
      console.log('New Token Expires after: '+data.expires_in+' seconds?')

      let oldDate = new Date(tokenExpiry);
      console.log('Old Token Expiry: '+oldDate)
    }
    
    // Caluclate new expiry time
    tokenExpiry = parseInt(time)+(parseInt(data.expires_in)*1000)

    if (postDebug){
      let newDate = new Date(tokenExpiry);
      console.log('New Token Expiry: '+newDate)
      console.log('refreshToken: token valid (time<tokenExpiry) ? '+(time>tokenExpiry ? 'true':'false'))
    }
  }
  return accessToken
}

function tokenValid(){
  if (postDebug) console.log('Checking Token')
  if (accessToken == null
    || tokenExpiry == null){
      if (postDebug) console.log('No token to check')
      return false
  }else{
    let d = new Date();
    let time = d.getTime()
    if (postDebug) console.log('checking: (time<tokenExpiry) '+time+'<'+tokenExpiry)
    //
    // If the current time is lower than 
    // the expiry time, the token is valid
    return (time<tokenExpiry) ? true : false
    }
}

/**
 * SFMC Communication
 */
async function getAccessToken(){
  if (!tokenValid()){
    if (postDebug) console.log('Token expired: Requesting remote authentication')
    var authUrl = tokenUrl
    let authBody = {
      "grant_type": "client_credentials",
      "client_id": "xja05pcunay325cyg6odcyex",
      "client_secret": "b36KqpkMECP8T3h0j2nD81Ve",
      "account_id": "7207193"
      }
      
    var authHeaders = {
      "Accept": dataType,
      "Content-Type": dataType
    }

    if (postDebug){
      console.log('Auth Headers: ')
      console.table(authHeaders)
      console.log('Auth URL: ')
      console.table(authUrl)
      console.log('Auth Body: ')
      console.table(authBody)
      }

    var authResponse = await fetch(authUrl, {
        method: 'POST', 
        mode: 'no-cors', 
        cache: 'no-cache', 
        credentials: 'omit', 
        headers: authHeaders,
        redirect: 'follow', 
        referrerPolicy: 'no-referrer', 
        body: JSON.stringify(authBody) 
      }).catch((error) => {
        // Broadcast error 
        if (postDebug) console.log('Backend auth error:'+JSON.stringify(error));
        return error;
      }).then(response => response.json())
      .then((authenticationResponse) => {  
        if (postDebug) console.log('Refreshing Authentication')
        accessToken = refreshToken(authenticationResponse)
        return accessToken
      })
    if (postDebug) console.log('Authentication requested')
    return authResponse
  }else{
    if (postDebug) console.log('Token valid: Authentication cached: '+accessToken)
    return accessToken
  }
}

async function getData(url = '', headers) {
  var getResponse = await fetch(url, {
    method: 'GET', 
    mode: 'no-cors', 
    cache: 'no-cache', 
    credentials: 'omit', 
    headers: headers,
    redirect: 'follow', 
    referrerPolicy: 'no-referrer'
  }).then(response => response.json())
    .then(response=>parseHttpResponse(response))
    .then((getResponse) => {
      return getResponse; // return response
    }).catch((error) => {
      return handleError(error);
    })
  return getResponse;
}

async function postData(url = '', postData=null) {
  if (url != '' && postData != null){
    let postResponse = await getAccessToken()
      .then(async accessToken => {
        var headers = {
          "Accept": "*/*",
          "Content-Type": dataType,
          "Authorization":accessToken
        }
        // Prepend Rest Domain to URL 
        // (if missing)
        if (url.indexOf(restDomain)==-1){
          url = restDomain+url
        }

        if (postDebug) {
          console.log('postData postDataUrl: '+url)
          console.log('postData headers: ')
          console.table(headers)
          console.log('postData data: ')
          console.log(JSON.stringify(postData))
        }

        let requestResponse = fetch(url, {
            method: 'POST', 
            headers: headers,
            body: JSON.stringify(postData)
          }).then(response => response.json())
            .then(response=>parseHttpResponse(response))
            .then((fetchResult) => {
              if (postDebug) {
                let responseString = JSON.stringify(fetchResult)
                console.log('(postData) Backend responseString:'+responseString);              
              }
              return fetchResult; // return response
            }).catch(error => {
              return handleError(error);
            });  

        return requestResponse // transfer response
      }
    );    
    return postResponse; // collect & return response
  }
}

/**
 * PassCreator Communication
 */
async function postDataToPassCreator(url = '', postData=null) {
  if (url != '' && postData != null){
    //
    // Set Custom Headers 
    //
    var headers = {
      "Accept": dataType,
      "Content-Type": dataType,
      "Authorization":apiKey
    }

    //
    // Perform API Call
    //
    var postResponse = await fetch(url, {
      method: 'POST', 
      mode: 'no-cors', 
      cache: 'no-cache', 
      credentials: 'omit', 
      headers: headers,
      redirect: 'follow', 
      referrerPolicy: 'no-referrer', 
      body: JSON.stringify(postData) 
    })// Parse Response
    .then(response => response.json())
    // Announce and log response
    .then((response)=>{
        console.log('pDTPC raw response:')
        console.table(response)
        var logResponse = logData('Message sent',postData)
        .then((response)=>{return response;})
      return logResponse
    })
    .catch((error) => {
      // Broadcast error 
      if (postDebug) console.log('Backend error:'+JSON.stringify(error));
      return error;
    });
    return postResponse; // return response
  }
}
function handleError(error){  
  // Response time
  var date = getDateTime();

  if (postDebug) console.log('(handleError) '+JSON.stringify(error));
  //
  // Construct Standardised Response
  //
  var errorResponse = {
    'requestDate':date.DateTime,
    'status':error.status,
    'body':(typeof error !== 'string') ? JSON.stringify(error) : error
  }  
  return errorResponse
}
function parseHttpResponse(result) {  
  // Announce and log result
  if (postDebug){    
    console.log('parseHttpResponse result:'+JSON.stringify(result))
    }  

  // Response time
  var date = getDateTime();
  
  //
  // Construct Standardised Response
  //
  var messageResponse = {
    'requestDate':date.DateTime,
    'status':result.status,
    'body':null
  }      
  
  if (result.hasOwnProperty('errorcode')){
    if (result.hasOwnProperty('message')){
      messageResponse.body = result.message
      return messageResponse
    }else{
      messageResponse.body = 'Error: '+result.errorcode
      return messageResponse
      }
  }else{
    messageResponse.body = result
    return messageResponse
  }  
}
app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}`);
});