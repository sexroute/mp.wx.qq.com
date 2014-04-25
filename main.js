/* Listen for messages */
var __gMsgListId = "listContainer";
var __gLastMsgId = localStorage["lastMsgId"];
var __gDomain = "https://mp.weixin.qq.com/";
if (typeof (__gLastMsgId) == "undefined")
{
    __gLastMsgId = 0;
}
var __gShouldTreatMsgList = [];

function SimulateNavigateToMsg()
{
    loUrl = $("#menu_message").find('a');
    window.location = (loUrl.attr('href'));
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
        });
    }
}

function StartDownloadAudioList(aoList)
{
    for (i = 0; i < aoList.length; i++)
    {
        loAudioObj = aoList[i];
        DownloadAudio(loAudioObj);
        break;
    }
}

function RefreshList()
{
    $("#newMsgNum").trigger("click");
}

function getAudioMsgList()
{
    loList = $("#" + __gMsgListId).find('li');
    if (loList)
    {
        __gShouldTreatMsgList = [];
        for (i = 0; i < loList.length; i++)
        {
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
                if (lnID && (lnID > __gLastMsgId))
                {
                    //2.is audio
                    loTaskObj = {
                        id: lnID,
                        url: lstrDownloadUrl
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
                    //	SimulateNavigateToMsg();
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
    }
});