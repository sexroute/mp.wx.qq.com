var __gCuttDebug = true;
var __gRequestWxMsgHeaders = [];
var __gGetNewMsgNumHeaders = [];
var __gTokenKey = "token";
var __gDownloadTaskList = [];

(function() {
    // Export variable to the global scope
    (this == undefined ? self : this)['FormData'] = FormData;

    var ___send$rw = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype['send'] = function(data) {
        if (data instanceof FormData) {
            if (!data.__endedMultipart) data.__append('--' + data.boundary + '--\r\n');
            data.__endedMultipart = true;
            this.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + data.boundary);
            data = new Uint8Array(data.data).buffer;
        }
        // Invoke original XHR.send
        return ___send$rw.call(this, data);
    };

    function FormData() {
        // Force a Constructor
        if (!(this instanceof FormData)) return new FormData();
        // Generate a random boundary - This must be unique with respect to the form's contents.
        this.boundary = '------RWWorkerFormDataBoundary' + Math.random().toString(36);
        var internal_data = this.data = [];
        /**
        * Internal method.
        * @param inp String | ArrayBuffer | Uint8Array  Input
        */
        this.__append = function(inp) {
            var i=0, len;
            if (typeof inp === 'string') {
                for (len=inp.length; i<len; i++)
                    internal_data.push(inp.charCodeAt(i) & 0xff);
            } else if (inp && inp.byteLength) {/*If ArrayBuffer or typed array */
                if (!('byteOffset' in inp))   /* If ArrayBuffer, wrap in view */
                    inp = new Uint8Array(inp);
                for (len=inp.byteLength; i<len; i++)
                    internal_data.push(inp[i] & 0xff);
            }
        };
    }
    /**
    * @param name     String                                  Key name
    * @param value    String|Blob|File|Uint8Array|ArrayBuffer Value
    * @param filename String                                  Optional File name (when value is not a string).
    **/
    FormData.prototype['append'] = function(name, value, filename) {
        if (this.__endedMultipart) {
            // Truncate the closing boundary
            this.data.length -= this.boundary.length + 6;
            this.__endedMultipart = false;
        }
        var valueType = Object.prototype.toString.call(value),
            part = '--' + this.boundary + '\r\n' + 
                'Content-Disposition: form-data; name="' + name + '"';

        if (/^\[object (?:Blob|File)(?:Constructor)?\]$/.test(valueType)) {
            return this.append(name,
                            new Uint8Array(new FileReaderSync().readAsArrayBuffer(value)),
                            filename || value.name);
        } else if (/^\[object (?:Uint8Array|ArrayBuffer)(?:Constructor)?\]$/.test(valueType)) {
            part += '; filename="'+ (filename || 'blob').replace(/"/g,'%22') +'"\r\n';
            part += 'Content-Type: application/octet-stream\r\n\r\n';
            this.__append(part);
            this.__append(value);
            part = '\r\n';
        } else {
            part += '\r\n\r\n' + value + '\r\n';
        }
        this.__append(part);
    };
})();



function doStuffWithDOM(domContent) 
{
   
}
function OnClickMenu(info, tab)
{
    var lstrUrl = tab.url;
    chrome.tabs.sendMessage(tab.id,{ text:"dom_test" },doStuffWithDOM);
}

function getQueryVariable(astrParameters,variable) 
{
    var query = astrParameters;
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}



function InitUIWeixin()
{
	// chrome.contextMenus.removeAll();
	 var radio1 = chrome.contextMenus.create(
            {
                "title": "微信测试",
                "id": "wx",
                "type": "normal",
                "contexts": ["all"]
            });
   
 //1.menu     
 chrome.contextMenus.onClicked.addListener(OnClickMenu);  
 
 //2.web request
 var callback = function(details) 
 {
 		console.log("I received the following http request:\n" + details); 
 		lbShouldReSendRequest = false;
 		lstrToken = "";
 		if(details.url.indexOf("getnewmsgnum")>=0)
 		{
 			lbShouldReSendRequest = true; 			
 			for (var i = 0; i < details.requestHeaders.length; ++i) 
 			{
 				if(details.requestHeaders[i].name =="test")
 				{
 					lbShouldReSendRequest = false;
 					details.requestHeaders.splice(i, 1);
 					
 				}else if(details.requestHeaders[i].name =="Referer")
 				{
 					lstrRefer = "https://mp.weixin.qq.com/cgi-bin/message?t=message/list&count=20&day=7&token=1894349238&lang=zh_CN";
 					lstrRefer =  details.requestHeaders[i].value;
 					lstrToken = getQueryVariable(lstrRefer,__gTokenKey);
 				} 						
 			} 
 		}
 	
    if(details.url.indexOf("getnewmsgnum")>=0)
    {    	
    	 if(lbShouldReSendRequest)
	    {
	    	__gGetNewMsgNumHeaders = [];
		 		for (var i = 0; i < details.requestHeaders.length; ++i) 
		 		{
		 			__gGetNewMsgNumHeaders.push(details.requestHeaders[i]);    	
		    }
	    	chrome.tabs.sendMessage(details.tabId,{ text:"get_new_msg_num",data: {token:lstrToken} },doStuffWithDOM);
	    }
	    
    }
 };  
	 var filter = {urls:["*://*.qq.com/*"]};
	 var  opt_extraInfoSpec = ["blocking", "requestHeaders"];
	 chrome.webRequest.onBeforeSendHeaders.addListener(
	        callback, filter, opt_extraInfoSpec);
	        
	//3.load completed,get audio list
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) 
	{
    if (changeInfo.status === 'complete') 
    {
       chrome.tabs.sendMessage(tabId,{ text:"get_audio_list"},doStuffWithDOM);
    }
	});
	
	//4.download api
	chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) 
	{
		loMsg = null;
		for(i = 0;i<  __gDownloadTaskList.length;i++)	
		{
				if(__gDownloadTaskList[i].url ==  item.url)
			  { 
			  		loMsg =__gDownloadTaskList[i];
			  			__gDownloadTaskList.splice(i, 1);
			  		break;
			  }
		}
		if(loMsg && loMsg.tag)
		{
			lstrFileName = loMsg.tag+".mp3";
			suggest({filename: lstrFileName,
	           conflict_action: 'overwrite',
	           conflictAction: 'overwrite'});
		}else
		{
	  	suggest({filename: item.filename,
	           conflict_action: 'overwrite',
	           conflictAction: 'overwrite'});
    }
  // conflict_action was renamed to conflictAction in
  // http://src.chromium.org/viewvc/chrome?view=rev&revision=214133
  // which was first picked up in branch 1580.
	});
	
		chrome.runtime.onMessage.addListener
		( 
				function(msg, sender, sendResponse) 
			  {
			  	if(msg.text && msg.text == "download")
			  	{	
			  		 for(i = 0;i<  __gDownloadTaskList.length;i++)	
			  		 {
			  		 	 if(__gDownloadTaskList[i].url ==  msg.url)
			  		 	 { 
			  		 	 		__gDownloadTaskList.splice(i, 1);
			  		 	 		break;
			  		 	 }
			  		 }
			  		 __gDownloadTaskList.push(msg);
			  		 
			  		 var worker = new Worker('js/worker.js');
			  		 // Note: In a Web worker, the global object is called "self" instead of "window"


       			 worker.postMessage(msg);
		    		 //chrome.downloads.download({  url: msg.url,saveAs: msg.saveAs});
     			}
				}
		);
}
InitUIWeixin();