/**
 * 
 * @param {*} name 
 * @param {*} extname 
 * @param {*} total 
 * @param {*} el 
 */
function File(element,el){
    this.name=element.name;
    this.extname = element.ext;
    this.total=element.size;
    this.el = el;
    this.processColor="#6aff75";
    this.successColor="#0ca726";
    this.errorColor="#ff2222";
    this.status="";
    this.processBar = $(this.el).find("canvas")
    this.process = $(this.el).find("canvas").attr("id");;
    this.value = $(this.el).find(".processStatus");
    this.circle = null;
    this.path = element.path;
    this.start=0;
    this.fileSize=element.size;
    this.end=0;
    this.limitSize=1024*1024;
    this.percent  = 0;
    this.fileId="";
    this.statusEl = $("[key="+element.id+"]").find(".status")
}
File.prototype.startDownload = startDownload;
File.prototype.startUpload=fileUPload;
File.prototype.setProcess = setProcess;
File.prototype.initProcess = initProcess;
function initProcess(){
    var circle = new parcessBar(this.process,20);;
    circle.init();
    this.circle = circle;
    this.circle.drawCricle(1)  
}
function setProcess(percentComplete){
     let that = this;
     var percent = parseInt((percentComplete * 100));
     if(percentComplete==1){
         setTimeout(function(){
             that.circle.drawCricle(percent,that.successColor);
             $(that.statusEl).html("<span class='statusDesc success'>下载成功</>")
         },1000)
     }else{
         that.circle.drawCricle(percent,that.processColor)  
     }
     this.percent = percent;
    
    
 }
 /**
  * blob 转字符串
  */
function blobToString(blob,callback){
   var reader = new FileReader();
   reader.addEventListener("loadend",function(res){
       callback(res.result)
   });
   reader.readAsBinaryString(blob)
}

function startDownload(){
     var that = this;
     var page_url = '/file/download';
     that.initProcess();
     var req = new XMLHttpRequest();
     req.open("POST", page_url, true);
     req.setRequestHeader('content-type', 'application/json');
     //req.responseType = "blob";
     req.responseType = "blob";
     //监听进度事件
     req.addEventListener("progress", function (evt) {
         console.log("header:",req.getResponseHeader("total"))
         console.log("that.total:",evt.loaded,that.total)
             var percentComplete = (evt.loaded+1) / (that.total);
              console.log("percentComplete:",percentComplete)
             that.setProcess(percentComplete)
     }, false);

     req.onerror = function(err){
        console.error("下载发生错误:",err);
        $(that.statusEl).html("<span class='statusDesc error'>下载发生错误</>")
        that.circle.drawCricle(that.percent,that.errorColor)
     }
     req.onreadystatechange = function () {
         if (req.readyState === 4 && req.status === 200) {
             if(req.response){
                that.circle.drawCricle(100,that.successColor);
                $(that.statusEl).html("<span class='statusDesc success'>下载成功</>")
             }
             var filename = that.name+""+that.extname;
            if (typeof window.chrome !== 'undefined') {
                // Chrome version
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(req.response);
                link.download = filename;
                link.click();
            } else if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // IE version
                var blob = new Blob([req.response], { type: 'application/force-download' });
                window.navigator.msSaveBlob(blob, filename);
            } else {
                // Firefox version
                var file = new File([req.response], filename, { type: 'application/force-download' });
                window.open(URL.createObjectURL(file));
            }
            
         }
     };
     var params = {id:this.name,path:this.path,ext:this.extname};
     req.send(JSON.stringify(params));
     that.statusEl.html("<span class='statusDesc'>正在下载...</span>");
}
/**
 * 文件上传
 */
function fileUPload(file){
    var that = this;
    that.initProcess();
    var page_url = '/file/upload';
    var start = 0;
    var fileSize = file.size;
    var end = 0;
    var size = 1024*1024;
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("error",uploadError)
    xhr.upload.addEventListener("loadstart",uploadLoadstart)
    /*xhr.upload.addEventListener("load",uploadLoad)
    xhr.upload.addEventListener("loadend",uploadLoadend*/
    xhr.upload.addEventListener("abort",uploadAbort)
    xhr.upload.addEventListener("progress",uploadProcess)
    xhr.onreadystatechange = function () {
        console.log(xhr.readyState,xhr.status)
        if (xhr.readyState === 4 && xhr.status === 200) {
            var percentComplete = (that.end+1) / (that.fileSize);
            var response = JSON.parse(xhr.responseText);
            that.fileId = response.id
            console.log("responseText:",response)
            that.setProcess(percentComplete);
            file.thumbPath = response.thumbPath||"";
            sendData(file)
        }
    };
    sendData(file)
    function uploadError(ev){
        console.log("uploadError-->",ev)
    }
    function uploadLoadstart(ev){
        console.log("uploadLoadstart-->",ev)
    }
    function uploadLoad(ev){
        console.log("uploadLoad-->",ev)
    }
    function uploadLoadend(ev){
        console.log("uploadLoadend-->",ev)
    }
    function uploadAbort(ev){
        console.log("uploadAbort-->",ev)
    }
    function uploadProcess(ev){
          console.log("process-->",ev)
    }
    function sendData(data){
        var blob=null;
        that.start = that.end;
        if(that.start>=that.fileSize){
            //更新列表
            getDirList(data.path);
            //重上传列表中移除
            upAndDownEvent.delete("upload",data)
            return;
        }else if(that.start<=that.fileSize){
            if((that.fileSize-start)<that.limitSize){
                that.end=that.fileSize;
            }else{
                that.end=(that.start)+that.limitSize;
            }
            blob = data.slice(that.start,that.end)
        }
        var form  = new FormData()
        form.append(data.name,blob)
        xhr.open("POST", page_url, true);
        xhr.setRequestHeader('id', that.fileId);
        var path =  data.path;
        path = encodeURIComponent(path)
        console.log("path:",data.path)
        xhr.setRequestHeader('path',path);
        xhr.setRequestHeader('total',data.size);
        xhr.setRequestHeader('current',that.end); 
        xhr.send(form)
    }

}