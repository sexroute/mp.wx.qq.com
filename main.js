/* Listen for messages */
var __gMsgListId = "listContainer";
var __gLastMsgId = localStorage["lastMsgId"];
var __gDomain = "https://mp.weixin.qq.com/";
var __gtoken = 0;
//var __gUserName = "sexroute";
//var __gPassword = "Q!W@E#R$T%";
var __gUserName = "tonia.xu@mattel.com";
var __gPassword = "19911020k1222";
if (typeof (__gLastMsgId) == "undefined")
{
    __gLastMsgId = 0;
}
var __gShouldTreatMsgList = [];

function SimulateNavigateToMsg()
{
    loUrl = $("#menu_message").find('a').attr('href');
    if(typeof(loUrl)!="undefined")
    {
        loUrl =  loUrl.replace("count=20","count=1000");
		loUrl =  loUrl.replace("filterivrmsg=1","filterivrmsg=0");
		if(loUrl.indexOf("filterivrmsg=0")<0)
		{
			loUrl = loUrl + "&filterivrmsg=0";
		}

    }
    window.location = (loUrl);
}

function DownloadAudio(aoAudioObj)
{
    if (loAudioObj && loAudioObj.url)
    {
        // window.open(loAudioObj.url);  
        chrome.runtime.sendMessage(
            {
                text: "download",
                url: loAudioObj.url,
                saveAs: false,
                tag: loAudioObj.id,
                user: aoAudioObj.user,
                durl: null,
                fakeid:loAudioObj.fakeid,
                token:loAudioObj.token,
                tabid:0
            });
    }
}

function StartDownloadAudioList(aoList)
{
    for (i = 0; i < aoList.length; i++)
    {
        loAudioObj = aoList[i];
        DownloadAudio(loAudioObj);
        //  break;
    }
}

function RefreshList()
{
    $("#newMsgNum").trigger("click");
}

function getAudioMsgList(anToken)
{
    loList = $("#" + __gMsgListId).find('li');
    __gLastMsgId = localStorage["lastMsgId"];
    if(typeof (__gLastMsgId)=="undefined")
    {
        __gLastMsgId = 0;
    }
    if (loList)
    {
        __gShouldTreatMsgList = [];
		var g_max_msg_id = 0;
        for (var i = loList.length; i >=0 ; i--)
        {
            $lstrClass = loList.attr('class');
			var loID = loList.attr('data-id');
            $loAudioMsg =  $(loList[i]).find(".audioBox");
            if($loAudioMsg.length <=0)
            {
                continue;
            }
			if(g_max_msg_id < loID)
			{
				g_max_msg_id = loID;
			}
            loMsgObj = $(loList[i]);
            loDownloadObj = $(".icon18_common", loMsgObj);
            if (loDownloadObj.length > 0)
            {
                lnID = loDownloadObj.attr('idx');
                lnID = parseInt(lnID);
                lstrDownloadUrl = loDownloadObj.attr('href');
                lstrDownloadUrl = lstrDownloadUrl.substring(1);
                lstrDownloadUrl = __gDomain + lstrDownloadUrl;
                //1.bigger than processed
                if (lnID && (lnID>__gLastMsgId) )
                {
                    //2.is audio
                    loUserObj = $(".remark_name", loMsgObj);
                    lstrUserName = "";
                    $lstrFakeID = "";
                    if (loUserObj && loUserObj.length > 0)
                    {
                        lstrUserName = loUserObj[0].innerText;
                        $lstrFakeID = loUserObj.attr('data-fakeid');
                    }
                    loTaskObj = {
                        id: lnID,
                        url: lstrDownloadUrl,
                        user: lstrUserName,
                        fakeid:$lstrFakeID,
                        token:__gtoken
                    };
                    __gShouldTreatMsgList.push(loTaskObj);
                }
            }
        }
    }
	if(__gShouldTreatMsgList.length ==0)
	{
		if(g_max_msg_id!=0)
		{
			localStorage["lastMsgId"] = g_max_msg_id;
		}
	}
    console.log("msg to upload list length:%d", __gShouldTreatMsgList.length);
    StartDownloadAudioList(__gShouldTreatMsgList);
}

var g_loginChecking = false;
var g_login = true;
function BeginCheckLogin()
{
    g_loginChecking = true;

    chrome.runtime.sendMessage(
        {
            text: "checklogin",
            tabid:0
        });

    return g_login;
}

function CheckLogin()
{
    if(!g_loginChecking)
    {
        BeginCheckLogin();
    }

    return g_login;
}

function doLogin()
{
    //1.navigation
    var $lstrCurrentUrl = window.location;
    if(lstrCurrentUrl.indexOf("https://mp.weixin.qq.com/")==0)
    {
        if(lstrCurrentUrl !=  "https://mp.weixin.qq.com/")
        {
            window.location = "https://mp.weixin.qq.com/";
        }
    }
    //2.set username password

    var loUsername   = document.getElementById("account");
    loUsername.value = __gUserName;

    var loPassword = document.getElementById("password");
    loPassword.value = __gPassword;
    var evt0 = document.createEvent("MouseEvents");
    evt0.initEvent("click", true, true);
    loPassword.dispatchEvent(evt0);

    //3.find button simulate press

    var evt = document.createEvent("MouseEvents");
    evt.initEvent("click", true, true);
    document.getElementById("login_button").dispatchEvent(evt);

}

function CheckNewMsg(aoData)
{
    if(!IsCurrentInMsgList(g_TimeRefreshTime))
    {
        SimulateNavigateToMsg();
    }

    __gLastMsgId = localStorage["lastMsgId"];
    if(typeof (__gLastMsgId) == "undefined")
    {
        __gLastMsgId = 0;
    }
    __gtoken = aoData.token;
    localStorage["lastToken"] = __gtoken;
    $.ajax(
        {

            url: "https://mp.weixin.qq.com/cgi-bin/getnewmsgnum",
            type: 'POST',
            dataType: 'html',
            data: "token=" + aoData.token + "&lang=zh_CN&random=" + Math.random() + "&f=json&ajax=1&t=ajax-getmsgnum&lastmsgid=" + __gLastMsgId,
            timeout: 20000, //
            cache: false,
            error: function ()
            {
                //ShowSettingResult(false);
            }, //
            success: function (html)
            {
                try
                {
                    var loData = $.parseJSON(html);
                    if (loData && loData.newTotalMsgCount > 0)
                    {

                        //1.get audio list
                        SimulateNavigateToMsg();
                        getAudioMsgList(__gtoken);
                    }

                }
                catch (e)
                {
                    //showResult(false, html);
                }
            },
            beforeSend: function (jqXHR, settings)
            {
                jqXHR.setRequestHeader("test", "1");
            }
        });
}
function IsCurrentInMsgList(anTimeOut)
{
    CheckLogin();

    loUrl = $("#menu_message").find('a').attr('href');
    lstrCurrentUrl = window.location.href;
    if(typeof(loUrl)==  "undefined")
    {
        return true;
    }
    if(lstrCurrentUrl.indexOf("mp.weixin.qq.com")<0)
    {
        return true;
    }

    if(lstrCurrentUrl.indexOf(loUrl)<0)
    {
        loUrl =  loUrl.replace("count=20","count=1000");
		loUrl =  loUrl.replace("filterivrmsg=1","filterivrmsg=0");
		if(loUrl.indexOf("filterivrmsg=0")<0)
		{
			//loUrl = loUrl + "&filterivrmsg=0";
		}
        if(lstrCurrentUrl.indexOf(loUrl)<0)
        {
            return false;
        }

    }

    if(anTimeOut>100*1000)
    {
        //return false;
    }
    return true;
}
var g_TimeRefreshTime = 0;
function CheckMsgListTabTimerFunc()
{

    if(!IsCurrentInMsgList(g_TimeRefreshTime))
    {
        SimulateNavigateToMsg();
    }
    window.setTimeout(CheckMsgListTabTimerFunc,3000);
    g_TimeRefreshTime += 3000;
}

function ResponseToUser(aoMsg)
{
    var xmlHttp = new XMLHttpRequest();
    lnToken = localStorage["lastToken"];
    $lstrContent = "mask=false&tofakeid="+aoMsg.fakeid+"&imgcode=&type=1&content="+encodeURIComponent(aoMsg.durl.msg)+"&quickreplyid="+aoMsg.tag+"&token="+lnToken+"&lang=zh_CN&random="+ Math.random() +"&f=json&ajax=1&t=ajax-response";
    xmlHttp.open("POST", "https://mp.weixin.qq.com/cgi-bin/singlesend", true);
    xmlHttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded;");  //用POST的时候一定要有
    xmlHttp.send($lstrContent);
    xmlHttp.onload = function (msg)
    {
        return function (e)
        {
            if (xmlHttp.status == 200)
            {

                console.log(xmlHttp.response);


            }
        };
    }(aoMsg);
}
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse)
{
    /* If the received message has the expected format... */
    if (msg.text && (msg.text == "dom_test"))
    {
        getAudioMsgList();
    }
    else if (msg.text && (msg.text == "get_new_msg_num"))
    {
        CheckNewMsg(msg.data);
    }
    else if (msg.text && (msg.text == "navigate_to_msg"))
    {
        SimulateNavigateToMsg();
    }
    else if (msg.text && (msg.text == "get_audio_list"))
    {
        getAudioMsgList();
    }else if(msg.text && (msg.text == "init_check_msg_list_timer"))
    {
        CheckMsgListTabTimerFunc();
    }else if(msg.text && (msg.text == "audio_downloaded"))
    {
        loMsg = msg.data;
        lnID = localStorage["lastMsgId"];
        if(typeof(lnID)=="undefined")
        {
            localStorage["lastMsgId"] = 0;
        }
        if(loMsg.tag >= lnID)
        {
            localStorage["lastMsgId"] = loMsg.tag;
        }
        if(loMsg.durl)
        {
            ResponseToUser(loMsg);
        }

    }else if(msg.text && (msg.text == "done_checklogin"))
    {
        g_loginChecking = false;
        g_login = msg.data;
        if(!g_login)
        {
            doLogin();
        }
    }
});
