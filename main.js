/* Listen for messages */
var __gMsgListId = "listContainer";
var __gLastMsgId = localStorage["lastMsgId"];
var __gDomain = "https://mp.weixin.qq.com/";
var __gtoken = 0;
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
        loUrl =  loUrl.replace("count=20","count=10000");
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
        for (var i = loList.length; i >=0 ; i--)
        {
            $lstrClass = loList.attr('class');

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
    console.log("msg to upload list length:%d", __gShouldTreatMsgList.length);
    StartDownloadAudioList(__gShouldTreatMsgList);
}

function CheckNewMsg(aoData)
{
    if(!IsCurrentInMsgList())
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
function IsCurrentInMsgList()
{
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
        loUrl =  loUrl.replace("count=20","count=10000");

        if(lstrCurrentUrl.indexOf(loUrl)<0)
        {
            return false;
        }

    }
    return true;
}
function CheckMsgListTabTimerFunc()
{
    if(!IsCurrentInMsgList())
    {
        SimulateNavigateToMsg();
    }
    window.setTimeout(CheckMsgListTabTimerFunc,3000);
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

    }
});