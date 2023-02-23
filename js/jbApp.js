const connection = new Postmonger.Session();
/**
 * Create a new connection for this session.
 */
/**
 * Show Console Output?
 */
const debug = true;
const br = "\n"

const jbApp = { 
    version:1.7,
    apiKey:null,
    isTest:false, 
    isLocalhost:(location.hostname === 'localhost' || location.hostname === '127.0.0.1'),
    getSchema:true,
    getTokens:true,
    getEndpoints:true,
    getInteractions:false,
    token:null,
    passId:null,
    passUrl:'https://app.passcreator.com/api/pass/{passId}/sendpushnotification',
    currentStep:0,
    pageHtml:'',
    deStructure:{},
    message:'',
    action:null,
    dataExtension:null,
    system:{
        subscriber:{
            'firstname':'{{Contact.Attribute."Email Demographics".Firstname}}',
            'lastname':'{{Contact.Attribute."Email Demographics".Lastname}}',
            'email':'{{Contact.Attribute."Email Demographics".Email}}'
        },
        messages:{
            'firstname':'This is message 1: {firstname}',
            'lastname':'This is message 2: {lastname}',
            'email':'This is message 3: {email}'
        }
    },
    endpoints:{        
        "jbMiddleware":"https://eoya8wjvw5vh5ff.m.pipedream.net",
        "jbTest":"https://eo2mifqm9yelk7e.m.pipedream.net",
        "execute":"https://real-puce-raven-yoke.cyclic.app/execute",
        "publish": "https://eon2nxjzthbdt2w.m.pipedream.net",
        "validate": "https://eoxsr92hcso0n3h.m.pipedream.net",
        "stop": "https://eoot1xooh8qwfa8.m.pipedream.net"
    },
    steps:[
        {
          "label": "Select Type",
          "key": 'select'
        },
        {
          "label": "Configure Message",
          "key": 'configure'
        },
        {
          "label": "Confirm",
          "key": 'confirm'
        },
      ], 

/**
 * Core & Front End Functionality
 */
    getPassEndpoint:function(){
        if (debug) console.log('getPassEndpoint triggered')
        // Get starter URL based on isTest setting of app
        var endpoint = jbApp.passUrl;
        
        if (jbApp.passId != null){
            endpoint = endpoint.replace('{passId}',jbApp.passId)
        }
        return endpoint;
    },
    setPassId:function(id){
        jbApp.passId = '{{'+id+'}}';
    },
    parseEndpoints:function(data){
        if (data.hasOwnProperty('fuelapiRestHost')){
            jbApp.restUrl = data.fuelapiRestHost
        }
        if (data.hasOwnProperty('restHost')){
            let protocol = 'https://'
            jbApp.restHost = protocol+data.restHost
            jbApp.authUrl = jbApp.restHost.replace('rest','auth')+'/v2/token'
        }
    },
    parseSchema:function(){
        if (debug) console.log('parseSchema')
        if (
            jbApp.hasOwnProperty('schema')
            && jbApp.schema.length>0
            ){
                if (debug) console.log('schema: '+JSON.stringify(jbApp.schema))
                for (let i in jbApp.schema){
                    let schemaItem = jbApp.schema[i]
                    let fieldName = schemaItem.name
                    let fieldTag = schemaItem.key

                    if (schemaItem.type == 'Text'
                    && schemaItem.name != 'passId'
                    && schemaItem.length == null){
                        jbApp.deStructure[fieldName] = '{{'+fieldTag+'}}'
                    }else{
                        if (schemaItem.name == 'passId'){                            
                            jbApp.setPassId(fieldTag)
                        }
                    }
                    if (debug) console.log('['+fieldName+']:'+fieldTag)
                }
            }
        if (debug) console.log('jbApp.deStructure: ')
        if (debug) console.table(jbApp.deStructure)
        if (debug) console.log('jbApp.deStructure.length: '+jbApp.deStructure.toString().length)

        if (!jbApp.isLocalhost && typeof connection !== 'undefined'){
            if (debug) console.table(connection)
        }else{
            if (debug) console.table('Localhost or Connection not availble')
        }         
    },
    getCurrentStep:function(){
        return jbApp.currentStep
    },
    getSteps:function(activeStep){   
        let returnSteps = []     
        if (jbApp.hasOwnProperty('steps') && jbApp.steps.length > 0){
            for (let i in jbApp.steps){
                let stepObject = jbApp.steps[i]
                if (activeStep-1 == i){
                    stepObject.active=true
                }
                returnSteps.push(stepObject)
            }
        }
        return returnSteps
    },
    bindMenu:function(connection){
        if (debug) console.log('Binding menu')
        $('.pass_action').each(function() {
            let elem = $( this )
            
            /**
             * Presume we'll be changing the page
             */
            let refreshPage=true;

            /**
             * Isolate the required action
             */
            let action = $(this).data('action');
            jbApp.action = action

            /**
             * Bind the requested action
             */
            switch(jbApp.action){

                case 'showStep':
                    $(elem).on('click',function(){
                        // No page refresh required
                        refreshPage=false   
                        
                        // Prepare action changes
                        jbApp.getCurrentStep()

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked showStep:'+jbApp.currentStep)
                    });                
                    if (debug) console.log('Bound '+action) 
                break
    
                case 'inputMessage':
                    $(elem).on('click',function(){  
                        // Accounce Click
                        if (debug) console.log('clicked inputMessage')

                        // Prepare action changes
                        jbApp.inputMessageButtonAction()
                        })
                    if (debug) console.log('Bound '+action)
                break;
    
                case 'selectMessage':
                    $(elem).on('click',function(){
                        // Prepare action changes
                        jbApp.selectMessageButtonAction()

                        // Execute Action
                        //jbApp.processPageChange(refreshPage)
                        jbApp.buildMessageOptions()
                        
                        // Accounce Click
                        if (debug) console.log('clicked selectMessage')
                        /**
                         * Bind dynamic elements
                         */
                        })
                    if (debug) console.log('Bound '+action)
                break;
    
                case 'previewMessage':
                    $(elem).on('click',function(){
                        // Prepare action changes                        
                        jbApp.previewMessageButtonAction()
                    });
                    if (debug) console.log('Bound '+action)
                break;
    
                case 'previewSelectMessage':
                    $(elem).on('click',function(){                        
                        // Prepare action changes
                        jbApp.previewSelectMessageButtonAction()
                    });
                    if (debug) console.log('Bound '+action)
                break;
    
                case 'showMessages':
                    $(elem).on('click',function(){                        
                        // Prepare action changes
                        jbApp.showMessages()
                    });
                    if (debug) console.log('Bound '+action)
                break;
                
                case 'home':
                    $(elem).on('click',function(){
                        // Prepare action changes
                        jbApp.homeButtonAction()
                        
                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        })
                    if (debug) console.log('Bound '+action)
                break;
            }   
    
        }); 
    },
    processPageChange(refreshPage){
        /** 
         * Process any page changes
         */
        if (refreshPage==true
        && jbApp.hasOwnProperty('pageHtml')
        && jbApp.pageHtml != undefined
        && jbApp.pageHtml.length
        ){
            if(debug) console.log('processPageChange|main:'+jbApp.pageHtml) 
            $('#main').html(jbApp.pageHtml);    
            if(debug) console.log('processPageChange: refresh done')

            /**
             * After updating, enhance html if needed
             */
            if (jbApp.action == 'selectMessage'){
                jbApp.buildMessageOptions()
            }   
        }else{            
            if(debug) console.log('processPageChange: refresh false')
        }   
    },
    showMessages:function(){
        if (debug) console.log('showMessages() called')
        $.when(jbApp.getMessageOptions()).then(function(messages){

            // Format any message display
            if (messages.toString().length > 0){
                if (debug) console.log('showMessages() got messages')
                var messageOutput = '<Br /><p><span class="slds-text-heading_small">Available Messages</span><ul>'

                for (key in messages){
                    var message = messages[key]
                    var output = '<li><strong>'+key+'</strong>: '+message+'</li>'
                    messageOutput += output
                }

                messageOutput += '</ul></p>'

            }else{
                if (debug) console.log('showMessages() No messages found ('+messages.length+') : '+JSON.stringify(messages))
                var messageOutput = 'No messages loaded'
            }

            // Ensure we have somewhere to place the messages
            if ($('#available_messages').length == 0){
                $('#main').append('<div id="available_messages"></div>')
            }

            // Place the messages
            $('#available_messages').html(messageOutput)

            $('#showMessages')
                .attr('onClick',"jbApp.closeMessages()")
                .attr('data-action',"closeMessages")
                .text('Close messages')
        });        
    },
    closeMessages:function(){
        $('#available_messages').html('')
        $('#showMessages')
                .attr('onClick',"jbApp.showMessages()")
                .attr('data-action',"showMessages")
                .text('Show messages')
    },
    saveConfigButtonAction:function(){
        let apiKey = $('#apiKey').val();
        if (apiKey.length == 80){
            jbApp.apiKey = apiKey
            jbApp.homeButtonAction()
        }else{
            alert('The API key should be 80 characters')
            $('#apiKey').addClass('slds-has-error')
        }
    },
    homeButtonAction:function(){
        jbApp.pageHtml = jbApp.getHtml('home')
        $('#jbapp__nav_home').text('Home').data('action','home')        
        jbApp.setProgress(0)
        jbApp.currentStep = 0
        if (jbApp.isLocalhost != true) {
            //connection.trigger('updateSteps', jbApp.getSteps(1));            
            connection.trigger('prevStep')
            if (debug) console.log('Step: 1')
        }else{            
            if (debug) console.log('Local Step: 1')
        }
    },
    inputMessageButtonAction:function(){
        // Setup the required HTML
        jbApp.getHtml('inputMessage',1)

        // Update visual/internal steps
        jbApp.currentStep = 1
        jbApp.setProgress(33)   

        // Update UI Buttons                      
        $('#jbapp__nav_home').html('Cancel').data('action','home') 

        /**
         * Only process action if we 
         * are on the correct starting step
         */
        if(jbApp.currentStep < 1) {   
 
            // Running in JB
            if (jbApp.isLocalhost != true) {
                // Update JB Steps
                connection.trigger('nextStep')
            }
  

        }else{            
            if (debug) console.log('Local Step: '+jbApp.currentStep)
        }
    },
    selectMessageButtonAction:function(){        
        jbApp.html = jbApp.getHtml('selectMessage',1)
    
        $('#jbapp__nav_home').html('Cancel').data('action','home')
        jbApp.currentStep = 1
        jbApp.setProgress(33)

        // Only update the JB steps if we 
        // are on the correct starting step
        if(jbApp.currentStep < 1) {            
            if (jbApp.isLocalhost != true) {
                // Update JB Steps
                connection.trigger('nextStep')
            }          
        }else{            
            if (debug) console.log('Local Step: 2')
        }
    },
    previewMessageButtonAction:function(){
        if (debug) console.log('previewMessageButtonAction start')
        
        let ribbonVisible = false

        if ($('#notification_ribbon').length>0){
            ribbonVisible = true
        }    

        if (debug) console.log('ribbonVisible: '+ribbonVisible)

        if (ribbonVisible == false){  
            // Show ribbon            
            $.when(jbApp.getHtml('ribbon',false)).then(function(ribbon){
                if (debug) console.log('Appending ribbon: '+jbApp.pageHtml)
                // Place ribbon
                $('#main').append(jbApp.pageHtml);
                
                // Transfer Message
                jbApp.transferMessage()
        
                // Make sure we can close the ribbon after presenting it
                jbApp.bindRibbonClose()
        
                // Update UI on progress
                jbApp.setProgress(66)
   
            });        
        }else{
            jbApp.transferMessage()
        }   
        
        // Only update the JB steps if we 
        // are on the correct starting step
        if(jbApp.currentStep == 1) {            
            if (jbApp.isLocalhost != true) {
                // Update JB Steps
                connection.trigger('nextStep')
            }          
        }else{            
            if (debug) console.log('Local Step: 2')
        }
    },
    previewSelectMessageButtonAction:function(){
        if (debug) console.log('!previewSelectMessageButtonAction!')

        let blockVisible = false
        if ($('#notification_ribbon').length>0){
            let blockVisible = true
        }    
        if (debug) console.log('blockVisible: '+blockVisible)

        if (blockVisible == false){  
            $.when(jbApp.getHtml('ribbon',false)).then(function(ribbon){
                if (debug) console.log('Appending ribbon: '+jbApp.pageHtml)
                // Place ribbon
                $('#main').append(jbApp.pageHtml);
            
                // Transfer Message
                jbApp.selectMessage()
        
                // Make sure we can close the ribbon after presenting it
                jbApp.bindRibbonClose()
        
                // Update UI on progress
                jbApp.setProgress(66)
            });
        }else{
            // Transfer Message
            jbApp.selectMessage()
            jbApp.transferMessage()
        }

        // Only update the JB steps if we 
        // are on the correct starting step
        if(jbApp.currentStep == 1) {        
            if (jbApp.isLocalhost != true) {
                // Update JB Steps
                connection.trigger('nextStep')
            }          
        }else{            
            if (debug) console.log('Local Step: 2')
        }
        jbApp.currentStep = 2    
    },
    confirmMessage:function(){
        jbApp.setUiControls()
        if(jbApp.currentStep < 3) {
            jbApp.currentStep = 3          
            if (jbApp.isLocalhost != true) {
                // Update JB Steps
                connection.trigger('nextStep')
            } 
            // Update UI on progress
            jbApp.setProgress(99)      
        }
        jbApp.closeRibbon()
    },
    setUiControls:function(){          
        if ($('#modal_message').html() != ''){    
            // Configured  
            if (jbApp.isLocalhost == false){     
                // Production         
                connection.trigger('updateButton', { button: 'done', text: 'done', visible: true, enabled:true }); 
                if (debug) console.log('Enabled production button')
                $('#done').text('Done').prop('disabled',false)                
            }else{   
                // Development        
                $('#done').text('Done').prop('disabled',false)   
                if (debug) console.log('Enabled development button') 
            }
        }else{ 
            // Not Configured, Cancel
            if (jbApp.isLocalhost == false){
                // Production        
                connection.trigger('updateButton', { button: 'done', text: 'done', visible: true, enabled:false });
                if (debug) console.log('Disabled production button')  
                $('#done').text('Done').prop('disabled',true)                
            }else{   
                // Development      
                $('#done').text('Done').prop('disabled',true)   
                if (debug) console.log('Disabled development button')   
            }
        }
    },
    transferMessage:function(){            
        /**
         * Get the message
         */
        let previewMessage = $('#pass_message').val()
    
        /**
         * Check we have the data to parse 
         */
        if (jbApp.hasOwnProperty('system') 
        && jbApp.system.hasOwnProperty('subscriber')
        && previewMessage != undefined){
            if (debug) console.log('Checking data: '+JSON.stringify(jbApp.system.subscriber))
            
            /**
             * Loop through the attributes
             */
            for (let key in jbApp.system.subscriber){
                if (debug) console.log('Checking key ('+key+')')
                let value = jbApp.system.subscriber[key]
                let keyTag = '{'+key+'}'
                if (debug) console.log('Value: '+value)
                previewMessage = previewMessage.replaceAll(keyTag, value)
            }
        }

        /**
         * Place Message 
         */
        if (debug) console.log('Placing message: '+previewMessage)
        $('#modal_message').html(previewMessage)
        jbApp.message = previewMessage
    },
    selectMessage:function(){
        /**
         * Check we have the jbApp 
         */
        if (debug) console.log('jbApp:')
        if (debug) console.table(jbApp)
            
        /**
         * Get the message choice
         */
        let selectedMessage = $('#messageSelector option:selected').val()    
        if (debug) console.log('selectedMessage:' + selectedMessage)
    
        /**
         * Check we have the data to parse 
         */
        let messages = jbApp.getMessageOptions()
        if (selectedMessage.length > -1 && messages.toString().length > 0){
            var previewMessage = messages[selectedMessage]
            if (debug) console.log('Selected Message: '+previewMessage)
            
            /**
             * Loop through the attributes
             */
            for (let key in jbApp.system.subscriber){
                if (debug) console.log('Checking key ('+key+')')
                let value = jbApp.system.subscriber[key]
                let keyTag = '{'+key+'}'
                if (debug) console.log('Value: '+value)
                previewMessage = previewMessage.replaceAll(keyTag, value)
            }
        }

        /**
         * Place Message 
         */
        if (debug) console.log('Placing selected message: '+previewMessage)
        $('#modal_message').html(previewMessage)
        jbApp.message = previewMessage
    },
    getMessageOptions:function(){
        if (!jbApp.isLocalhost){
            return jbApp.deStructure
        }else{
            return jbApp.system.messages
        }
    },
    buildMessageOptions:function(){
        let messages = jbApp.getMessageOptions()
        if (debug) console.log('Messages:')
        if (debug) console.table(messages)
        
        if (messages.toString().length>0){
            $('#messageSelector').empty()
            let count = 0
            if (debug) console.log('We have Messages:')
            for (let i in messages){
                if (debug) console.log('Message#:'+i)
                count++
                let message = messages[i]
                if (debug) console.log('Message:'+message)
                if (message != '' && message.length>0){
                    let option = '<option value="'+i+'">'+count+': '+i+'</option>'
                    $('#messageSelector').append(option)
                }
            }
        }else{
            if (debug) console.log('We have no Messages')
        }
    },
    closeRibbon:function(){    
        if (debug) console.log('remove ribbon') 
        $('.slds-notify_container').remove()
    },
    bindRibbonClose:function(){
        if (debug) console.log('bind modal close')
        $('.slds-notify__close button').on('click',function(){
            jbApp.closeRibbon()
        });
    },
    setProgress:function(amount){
        if (debug) console.log('Setting progress: '+amount)
        let html = '<div class="slds-progress-bar" id="progress-bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+(100-amount)+'" aria-label="{{Placeholder for description of progress bar}}" role="progressbar">'
        html += '    <span class="slds-progress-bar__value" id="progress-val" style="width:'+amount+'%">'
        html += '        <span class="slds-assistive-text" id="progress-text">Progress: '+amount+'%</span>'
        html += '    </span>'
        html += '</div>'
        $( '#progress-holder' ).html(html)
    },    
    getHtml:function(page,refreshPage = true){
        //
        // Announce request 
        //
        if (debug) console.log('(getHtml): '+page)
        
        //
        // Map page names to file names
        //
        let html={
            home:'home',
            error:'error',
            inputMessage:'input_message',
            selectMessage:'select_message',
            ribbon:'ribbon',
            config:'config'   
        }
        
        //
        // Require API Key
        //
        if (jbApp.apiKey == null){
            page = 'config'
            refreshPage = true
        }else{
            //
            // Serve Error if mapping not defined
            //
            if (page==null 
                || page===undefined 
                || page=='' 
                || page.toString().length<1
                || html[page]===undefined 
                ){
                page = 'error'
            }
        }        
        //
        // Build and announce filename 
        //
        let pageHtmlLocation = './html/'+html[page]+'.html'        
        if (debug) console.log('(getHtml) Location: '+pageHtmlLocation)

        //
        // Retrieve page
        //
        $.ajax({
            type: "GET",
            url: pageHtmlLocation,
            async: false,
            success: function(response) {                 
                jbApp.pageHtml = response; 
                if (refreshPage == true){
                    //
                    // Refreshing page
                    //
                    if (debug)console.log('(getHtml) Refreshing Page:')
                    jbApp.processPageChange(refreshPage)
                }else{
                    //
                    // Returning page
                    //
                    if (debug)console.log('(getHtml) Returning HTML')
                    return jbApp.pageHtml;
                }
             }
         });
    },
    translatePage:function(html){
        // To Do
    },    
    load:function(connection){
        if (debug) console.log('Loading jbApp')
        // If JourneyBuilder available
        if (connection){            
            if (debug) console.log('App input:')
            if (debug) console.table(connection)
            // Inherit properties from JourneyBuilder
            if (connection.hasOwnProperty('version')){
                jbApp.journeyVersion = connection.version 
            }
            if (jbApp.getTokens && jbApp.token== '') connection.trigger('requestTokens');
            
            if (debug) console.log('App version:'+jbApp.version)
            if (debug) console.log('App token:'+jbApp.token)
        }        

        /**
         *  Setup 
         * */
        jbApp.bindMenu(connection)


        // Announce ready
        if (debug) console.log('App Loading Complete')
        window.jbApp = jbApp
        /*
        if (jbApp.apiKey == null){
            jbApp.pageHtml = jbApp.getHtml('config')
        }else{
            jbApp.pageHtml = jbApp.getHtml('home')
        }
        */
        jbApp.pageHtml = jbApp.getHtml('home')
        jbApp.processPageChange(1)
    },
    
    
/**
 * REST functionality 
 */

    getDataExtensionRest:function(customerKey){
        if (debug) console.log('getDataExtension:'+customerKey)
        let ajaxResponse = $.ajax({
            type: "POST",
            url: '/getde',
            contentType: "application/json",
            dataType: "json",
            async:false,
            data: '{"customerKey":"'+customerKey+'"}',            
            success: function(result){           
                return jbApp.restResponse(result)
            },
            fail:function(result){           
                Alert(JSON.stringify(result))
            }
        });
        return ajaxResponse
    },

    authSuccess:function (result) {
        if (debug) console.log('Auth Success')
        if (debug) console.log('Success data: ')
        console.table(result)
        $('#main').html(result)
    },

    restResponse:function (result) {
        if (debug) console.log('Server response parsing starts')
        if (result.hasOwnProperty('status')){
            if (debug) console.log('Server response has status')
            let status = result.status;
            switch(status){
                case 200:
                    if (result.hasOwnProperty(responseJSON)){
                        return result.responseJSON;
                    }else{
                        return result;
                    }
                break;
                case 404:
                    if (debug) console.log(JSON.stringify(result))
                    return 'Server endpoint not found'
                break;
            }
        }
    },

    restError:function(data) {
        if (debug) console.log('Rest Error')
        if (data.hasOwnProperty('responseText')){
            console.log(data.responseText + " " + data.status);
        }else if (data.hasOwnProperty('statusText')){
            console.log(data.responseText + " " + data.statusText);
        }else{
            console.table(data)
        }
    },

    checkDeExists:function(deName=''){
        if (deName==''){
            deName = 'passCreator_configuration'
        }                        
        checkResults = jbApp.getDataExtensionRest(deName);
        return checkResults;
    },
    
/**
 * SOAP functionality 
 */
    soapBuildTag:function(field='',value=null){
        let xml = null
        console.log('Formatting: '+field+' is '+(typeof value))
        if (
            typeof value === 'boolean'
            || field == 'FieldType'
            || field == 'Length'
        ){
            xml = br+'<'+field+'>'+value+'</'+field+'>';
        }else{
            xml = br+'<'+field+'><![CDATA['+value+']]></'+field+'>';
        }
        return xml
    },

    soapBuildDe:function(details={},fields = [],sendableFields=[]){
        /**
         * Envelope Wrapper
         */
        let soapOpening = `<?xml version="1.0" encoding="UTF-8"?>
        <s:envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
        <s:header>
          <fueloauth>
            ${accessToken}
          </fueloauth>
        </s:header>
        <s:body>
        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
            <Options></Options>
            <Objects xmlns:ns1="http://exacttarget.com/wsdl/partnerAPI" xsi:type="ns1:DataExtension">`
        let soapClosing = `
            </Objects>
        </CreateRequest>
    </soapenv:Body>`

        /**
         * Sendable fields
         */
        let sendFields = ''
        if (sendableFields.length > 0){
            for (var s in sendableFields){
                let field = sendableFields[s];
                let sendField=br+'<SendableDataExtensionField>'+br
                for(var x in field){
                    let prop = field[x]
                    sendField += jbApp.soapBuildTag(x,prop)
                }
                sendField+='</SendableDataExtensionField>'+br
                sendFields += sendField
            }
        }

        /**
         * Standard Fields
         */
        let mainFields = br+'<Fields>'+br
        if (fields.length > 0){
            for (var f in fields){
                let field = fields[f]                
                let soapField='<Field>'
                for(var x in field){
                    let prop = field[x]
                    soapField += jbApp.soapBuildTag(x,prop)
                }
                soapField+=br+'</Field>'
                mainFields += soapField+br
            }
            mainFields += '</Fields>'+br
        }

        /**
         * SOAP Details
         */        
        let soapDetails = ''
        for (var d in details){
            let detail = details[d]
            soapDetails += jbApp.soapBuildTag(d,detail)
        }

        /**
         * Build Envelope 
         */
        let SOAP = soapOpening+soapDetails;
        if (sendableFields.length && sendFields.length>0){
            SOAP += sendFields
        }
        if (fields.length && mainFields.length>0){
            SOAP += mainFields
        }
        return SOAP+soapClosing;
    },

    getConfigXml:function(){
        let details = {
            CustomerKey:'passCreator_configuration',
            Name:'passCreator_configuration',
            isSendable:false
        }
        let fields = [
        {
            CustomerKey:'Id',
            Name:'Id',
            FieldType:'Text',
            Length:36
        },
        {
            CustomerKey:'APIKey',
            Name:'APIKey',
            FieldType:'Text',
            Length:80
        },{
            CustomerKey:'DateModified',
            Name:'DateModified',
            FieldType:'Date'
        },
        ]
        return this.soapBuildDe(details,fields)
    },

    getLogXml:function(logName){
        let details = {
            CustomerKey:logName,
            Name:logName,
            isSendable:false
        }
        let fields = [
        {
            CustomerKey:'Id',
            Name:'Id',
            FieldType:'Text',
            Length:36
        },{
            CustomerKey:'DateModified',
            Name:'DateModified',
            FieldType:'Date'
        },
        {
            CustomerKey:'Message',
            Name:'Message',
            FieldType:'Text',
            Length:4000
        },
        {
            CustomerKey:'MetaData',
            Name:'MetaData',
            FieldType:'Text'
        }
        ]
        return this.soapBuildDe(details,fields)
    },


/**
 * Testing functionality 
 */
    bindTestMenu:function(){
        if (debug) console.log('Binding test menu')
        $('.test_action').each(function() {
            let elem = $( this )
            
            /**
             * Presume we'll be changing the page
             */
            var refreshPage=true;

            /**
             * Isolate the required action
             */
            let action = elem.data('action');
            jbApp.action = null
            jbApp.action = action

            /**
             * Bind the requested action
             */
            switch(action){

                case 'readSendable':
                    $(elem).on('click',function(){
                        // Nominate table
                        let customerKey = 'testing_dale'

                        // Request Table
                        let table = jbApp.getDataExtensionRest(customerKey)

                        // Execute Action                        
                        jbApp.pageHtml = JSON.stringify(table)
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked:readSendable | '+jbApp.action)

                    });                
                    console.log('Bound '+action) 
                break;  

                case 'getLogTable':
                    $(elem).on('click',function(){
                        // Nominate table
                        let customerKey = 'passcreator_success_log'

                        // Request Table
                        let table = jbApp.checkDeExists(customerKey)
                        
                        // Execute Action                        
                        jbApp.pageHtml = JSON.stringify(table)
                        jbApp.processPageChange(refreshPage)

                    });                
                    console.log('Bound '+action) 
                break; 

                case 'getConfiguration':
                    $(elem).on('click',async function(){
                        let customerKey = 'passCreator_configuration'                        
                        let table = await jbApp.getDataExtensionRest(customerKey)
                        jbApp.pageHtml = JSON.stringify(table)

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked:getConfiguration | '+jbApp.action+' ('+typeof table+')')

                    });                
                    console.log('Bound '+action) 
                break; 

                case 'buildTable':
                    let configXml = getConfigXml()
                    console.log('clicked:buildTable | got: '+configXml)
                    console.log('Bound '+action) 
                break;

                case 'authenticate':
                    $(elem).on('click',function(){
                        var testResults = jbApp.testAuth()
                        jbApp.pageHtml = JSON.stringify(testResults)

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked:authenticate | '+jbApp.action)

                    });                
                    console.log('Bound '+action) 
                break;     

                case 'testLog':
                    $(elem).on('click',function(){
                        var testResults = jbApp.testLog({'message':'Test of the logging system performed at '})
                        jbApp.pageHtml = JSON.stringify(testResults)

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked:testLog | '+jbApp.action)

                    });                
                    console.log('Bound '+action) 
                break;        

                case 'testMessage':
                    $(elem).on('click',function(){
                        var testResults = jbApp.testMessage({
                            'message':'help me'
                        })
                        jbApp.pageHtml = testResults

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked:testLog | '+jbApp.action)

                    });                
                    console.log('Bound '+action) 
                break;  

                case 'getXml':
                    $(elem).on('click',function(){
                        var testResults = jbApp.getConfigXml()
                        testResults = testResults.replaceAll('<','&lt;').replaceAll('>','&gt;')
                        jbApp.pageHtml = '<pre>'+testResults+'</pre>'

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked:getXml | '+jbApp.action)

                    });                
                    console.log('Bound '+action) 
                break; 

                case 'getLogXml':
                    $(elem).on('click',function(){
                        var testResults = jbApp.getLogXml('passcreator_success_log')
                        testResults = testResults.replaceAll('<','&lt;').replaceAll('>','&gt;')
                        jbApp.pageHtml = '<pre>'+testResults+'</pre>'

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked:getLogXml | '+jbApp.action)

                    });                
                    console.log('Bound '+action) 
                break; 

                default:
                    $(elem).on('click',function(){
                        jbApp.action = null
                        var testResults = '<h1>Error</h1><h2>Unconfigured test option</h2>'
                        jbApp.pageHtml = testResults

                        // Execute Action
                        jbApp.processPageChange(refreshPage)
                        
                        // Accounce Click
                        console.log('clicked unconfigured test option:'+jbApp.action)   
                    });    
                break;


            }   

        }); 
    },

    testAuth:function(){
        $.ajax({
            beforeSend:function(){$('#main').html('Loading')},
            type: "POST",
            url: '/testauth',
            contentType: "application/json",
            dataType: "json",
            success: function(authResult){                        
                jbApp.authSuccess(authResult)
            },
            error: function(xhr){
                jbApp.restError(xhr)
              }
        });        
    },    

    testLog:function(data){
        if (debug) console.log('testLog:')
        if (debug) console.table(data)
        $.ajax({
            type: "POST",
            url: '/testlog',
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result){
                jbApp.restSuccess(result)
            },
            error: function(error){
                jbApp.restError(error)
            }
        });
    },   

    testMessage:function(data){
        if (debug) console.log('testmessage:')
        if (debug) console.table(data)
        $.ajax({
            type: "POST",
            url: '/testmessage',
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(result){
                jbApp.restSuccess(result)
            },
            error: function(error){
                jbApp.restError(error)
            }
        });
    },

    testConfigXml:function(){
        let xml = jbApp.getConfigXml()
        return xml;
    }
}
jbApp.load(connection)