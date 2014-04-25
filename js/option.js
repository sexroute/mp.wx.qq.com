// Saves options to localStorage.

function save_options()
{
    var select = document.getElementById("cat_id");
    var lstrCateId = select.value;

    var button = document.getElementById("save");
    button.disabled = true;

    localStorage["cat_id"] = lstrCateId;
    chrome.cookies.get(
    {
        url: "http://*.cutt.com/",
        name: "uid"
    }, CheckLogin);

}

function CheckLogin(obj)
{

    if (null == obj || typeof (obj) == "undefined")
    {
        NavigateToCutt();
        var button = document.getElementById("save");
        button.disabled = false;
    }
    else
    {
        var lstrCateId = localStorage["cat_id"];
        GetColumns(lstrCateId);
    }
}

function OnBtnClick(info, tab)
{
    var lstrUrl = tab.url;
    sendToCutt(lstrUrl, info);
}

function sendToCutt(astrUrl, info)
{
    var favorite = info.menuItemId;
    //1.check login
    chrome.cookies.get(
    {
        url: "http://*.cutt.com/",
        name: "uid"
    }, CheckLogin);
    para = "clipId=" + favorite + "&url=" + encodeURIComponent(astrUrl);
    console.log(para);
    $.ajax(
    {
        url: "http://www.cutt.com/imp/save",
        type: 'POST',
        dataType: 'html',
        timeout: 20000, //超时时间设定
        data: para, //参数设置
        error: function ()
        {
            //apCallBack(false);
        }, //错误处理，隐藏进度条
        success: function (html)
        {
            //apCallBack(html);
        }
    });
}

function NavigateToCutt()
{
    chrome.tabs.create(
    {
        'url': 'http://www.cutt.com'
    });
}

function ShowSettingResult(abSucceed, lstrResult)
{
    var status = document.getElementById("status");

    if (abSucceed)
    {
        status.innerHTML = "share setting succsssfully, just righ click to share to specified column";
        setTimeout(function ()
        {
            status.innerHTML = "";
        }, 2000);
    }
    else
    {
        if (null == lstrResult)
        {
            lstrResult = "unkown";
        }
        status.innerHTML = "share setting failed reason:" + lstrResult;
    }
    var button = document.getElementById("save");
    button.disabled = false;
    UpdateUI();

}

function GetColumns(astrAppID)
{
    $.ajax(
    {
        url: "http://zhiyue.cutt.com/api/app/columns",
        type: 'GET',
        dataType: 'html',
        timeout: 20000, //超时时间设定
        error: function ()
        {
            ShowSettingResult(false);
        }, //错误处理，隐藏进度条
        success: function (html)
        {
            try
            {
                var loData = $.parseJSON(html);
                if (loData.length > 0)
                {
                    localStorage["columns"] = html;
                    ShowSettingResult(true);
                }
                else
                {
                    ShowSettingResult(false, html);
                }

            }
            catch (e)
            {
                ShowSettingResult(false, html);
            }
        },
        beforeSend: function (jqXHR, settings)
        {
            jqXHR.setRequestHeader("app", astrAppID);
        }
    });
}
// Restores select box state to saved value from localStorage.

function restore_options()
{
    var favorite = localStorage["cat_id"];
    if (!favorite)
    {
        favorite = "100103476";
        //return;
    }
    var select = document.getElementById("cat_id");
    select.value = favorite;
    localStorage["cat_id"] = favorite;
}

document.addEventListener('DOMContentLoaded', function ()
{
    document.querySelector('button').addEventListener('click', save_options);
    restore_options();
});
function OnBtnGoToSetup()
{
    var lstrUrl = chrome.extension.getURL("options.html");
    chrome.tabs.create(
    {
        'url': "pages/options.html"
    });
}
function refreshColumns()
{
    var lstrCateId = localStorage["cat_id"];
    GetColumns(lstrCateId);
}
function UpdateUI()
{
    chrome.contextMenus.removeAll();
    var lstrHTML = "";
    try
    {
        lstrHTML = $.parseJSON(localStorage["columns"]);
        if (lstrHTML == null || typeof (lstrHTML) == "undefined")
        {
            lstrHTML = "";
        }
    }
    catch (e)
    {
        lstrHTML = "";
    }

    if (lstrHTML.length != 0)
    {
        for (i = 0; i < lstrHTML.length; i++)
        {
            var lstrName = lstrHTML[i].name;
            var lstrAppID = lstrHTML[i].itemId;
            var lstrTitle = "分享到简网栏目:" + lstrName;
            var radio1 = chrome.contextMenus.create(
            {
                "title": lstrTitle,
                "id": lstrAppID + "",
                "type": "normal",
                "contexts": ["all"],
                "onclick": OnBtnClick
            });
        }
        radio1 = chrome.contextMenus.create(
        {
            "title": "separator",
            "id": "0000",
            "type": "separator",
            "contexts": ["all"],
        });
        radio1 = chrome.contextMenus.create(
        {
            "title": "刷新栏目列表",
            "id": "refreshColumns",
            "type": "normal",
            "contexts": ["all"],
            "onclick": refreshColumns
        });
        radio1 = chrome.contextMenus.create(
        {
            "title": "简网设置分享",
            "id": "OnBtnGoToSetup",
            "type": "normal",
            "contexts": ["all"],
            "onclick": OnBtnGoToSetup
        });
    }
}