
(function ()
{
    // Export variable to the global scope
    (this == undefined ? self : this)['FormData'] = FormData;

    var ___send$rw = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype['send'] = function (data)
    {
        if (data instanceof FormData)
        {
            if (!data.__endedMultipart) data.__append('--' + data.boundary + '--\r\n');
            data.__endedMultipart = true;
            this.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + data.boundary);
            data = new Uint8Array(data.data).buffer;
        }
        // Invoke original XHR.send
        return ___send$rw.call(this, data);
    };

    function FormData()
    {
        // Force a Constructor
        if (!(this instanceof FormData)) return new FormData();
        // Generate a random boundary - This must be unique with respect to the form's contents.
        this.boundary = '------RWWorkerFormDataBoundary' + Math.random().toString(36);
        var internal_data = this.data = [];
        /**
         * Internal method.
         * @param inp String | ArrayBuffer | Uint8Array  Input
         */
        this.__append = function (inp)
        {
            var i = 0,
                len;
            if (typeof inp === 'string')
            {
                for (len = inp.length; i < len; i++)
                    internal_data.push(inp.charCodeAt(i) & 0xff);
            }
            else if (inp && inp.byteLength)
            { /*If ArrayBuffer or typed array */
                if (!('byteOffset' in inp)) /* If ArrayBuffer, wrap in view */
                    inp = new Uint8Array(inp);
                for (len = inp.byteLength; i < len; i++)
                    internal_data.push(inp[i] & 0xff);
            }
        };
    }
    /**
     * @param name     String                                  Key name
     * @param value    String|Blob|File|Uint8Array|ArrayBuffer Value
     * @param filename String                                  Optional File name (when value is not a string).
     **/
    FormData.prototype['append'] = function (name, value, filename)
    {
        if (this.__endedMultipart)
        {
            // Truncate the closing boundary
            this.data.length -= this.boundary.length + 6;
            this.__endedMultipart = false;
        }
        var valueType = Object.prototype.toString.call(value),
            part = '--' + this.boundary + '\r\n' +
                'Content-Disposition: form-data; name="' + name + '"';

        if (/^\[object (?:Blob|File)(?:Constructor)?\]$/.test(valueType))
        {
            return this.append(name,
                new Uint8Array(new FileReaderSync().readAsArrayBuffer(value)),
                filename || value.name);
        }
        else if (/^\[object (?:Uint8Array|ArrayBuffer)(?:Constructor)?\]$/.test(valueType))
        {
            part += '; filename="' + (filename || 'blob').replace(/"/g, '%22') + '"\r\n';
            part += 'Content-Type: application/octet-stream\r\n\r\n';
            this.__append(part);
            this.__append(value);
            part = '\r\n';
        }
        else
        {
            part += '\r\n\r\n' + value + '\r\n';
        }
        this.__append(part);
    };
})();

// Note: In a Web worker, the global object is called "self" instead of "window"
self.onmessage = function (event)
{
    var msg = event.data; // From the background page
    var xhr = new XMLHttpRequest();
    //xhr.responseType = 'arraybuffer';
    xhr.open('GET', msg.url, true);

    // Response type arraybuffer - XMLHttpRequest 2
    xhr.responseType = "blob";
    xhr.onload = function (e)
    {
        if (xhr.status == 200)
        {
            nextStep(xhr.response, event.data);
        }
    };
    xhr.send();
};

function nextStep(arrayBuffer, msg)
{
    var xhr = new XMLHttpRequest();
    // Using FormData polyfill for Web workers!
    var fd = new FormData();
    fd.append('server-method', 'upload');

    // The native FormData.append method ONLY takes Blobs, Files or strings
    // The FormData for Web workers polyfill can also deal with array buffers
    lstrfileName =  msg.tag + "_"+ msg.fakeid+".mp3";
    fd.append('file', arrayBuffer, lstrfileName);//
    xhr.open('POST', 'http://wxaudio.sinaapp.com/index.php/Index/upload', true);

    //fd.append('inputFile', arrayBuffer, lstrfileName);
   // xhr.open('POST', 'http://barbie.sinaapp.com/index.php?mod=data&action=DealFile', true);

    // Transmit the form to the server
    xhr.send(fd);

    xhr.onload = function (msg)
    {
        return function (e)
        {
            if (xhr.status == 200)
            {

                //console.log(xhr.response);
                msg.durl = xhr.response;
                postMessage(msg);
            }
        };
    }(msg);

};