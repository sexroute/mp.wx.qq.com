var __gCuttDebug = true;
var __gRequestWxMsgHeaders = [];
var __gGetNewMsgNumHeaders = [];
var __gTokenKey = "token";

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
  	suggest({filename: item.filename,
           conflict_action: 'overwrite',
           conflictAction: 'overwrite'});
  // conflict_action was renamed to conflictAction in
  // http://src.chromium.org/viewvc/chrome?view=rev&revision=214133
  // which was first picked up in branch 1580.
	});
}




InitUIWeixin();