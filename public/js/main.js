
var tab = null;
var newFileList = null;
(function(){
    getDirList();
    var tabOption = {
        initKey:"upList",
        el:"upAndDownList",
        closeBtn:'TabClose',
        slideBtn:'TabSlide',
    }
    var Breadcrumb = [];
    tab = initUpAndDown(tabOption);
    //tab.show();
    // getFileList();
    //  $("#content").on("click",function(ev){
    //      debugger
    //      let target = ev.target;
    //      let info = JSON.parse($(target).parents("li").attr("source"));
    //      let file = new File(info.name,info.extname,info.total,target);
    //      file.startDownload();
    //  })
     //下载
     $("#downloadBtn").on("click",function(){
        upAndDownEvent.startDownload();
        tab.show("downList");
     })
     //上传
     $("#uploadBtn").on("click",function(){
        //创建一个文件输入框 
        var files = createFileInput();
     });
     //删除文件
     $("#deleteBtn").on("click",function(){
        upAndDownEvent.deleteFiles();
     });
     //新建文件夹
     $("#newDir").on("click",function(){
          var fileTypes = [{type:'0',name:'文件夹'}];
          newFileList = createNewFileList(fileTypes,this);
          newFileList.show();
     })
     $(document).on('click',function(){
        //判断有没有新建的未命名的文件
        var newFile = $(".showInput");
       
    })
 })()

 /**
  * 文件类型列表
  * @param {*文件类型列表} list 
  */
 function fileList(list,dom){
     this.list = list;
     this.dom = dom;
     this.typesList = this.init();
 }
 fileList.prototype.init = function(){
     var typeList = "<div class='typesWrap'><ul class='typesList'>"
     var _self = this;
     _self.list.forEach(function(item,index){
        typeList = typeList+"<li class='li_"+item.type+"'><span class='fileType type_"+item.type+"'></span><span class='typeName'>"+item.name+"</span></li>"
     })
     typeList+"</ul></div>";
     $("body").append($(typeList))
     return $(typeList);      
 }
 fileList.prototype.show = function(){
    var pos = $(this.dom).position();
    $(".typesWrap").css({
        top:pos.top+$(this.dom).height()+$(this.dom).offset().top+10,
        left:pos.left+5
    });
    $(".typesWrap").off();
    $(".typesWrap").on("click",function(ev){
        var target = ev.target;
        var type = $(target).parents("li").get(0).classList[0];
        addNewFileToPanel(type);
        newFileList.hide();
    })
 }
 fileList.prototype.hide = function(){
    $(".typesWrap").css({
        left:-1000
    })
 }
 function getFilePath(){
        var pathlist = $("#breadcrumb_item_path>span");
        var path = []
        pathlist.each(function(key,item){
            path.push($(item).html());
        })
        path.shift();
        return path.join("/")
 };
/**
 * 在页面创建文件
 */
 function addNewFileToPanel(type){
    //获取当前文件路径
    var name = "新建文件夹";
    var path = getFilePath().split("/")
    path.push(name);
    type = type.split("_")[1]||9;
     var item = {
        ext: "",
        id:new Date().getTime(),
        lastModify:new Date().getUTCDate(),
        name:name,
        path: "/"+path.join("/"),
        size: 0,
        type: type,
     }
    var html = "<div class='fileItem' source="+JSON.stringify(item)+" key="+item.id+">"
                    +"<div class='fileItem_key name'>"
                        +"<div class='checkbox'></div>"
                        +"<div class='fileType type_"+getType(item)+"'></div>"
                        +"<div class='showname' onclick = 'fileClick(this)'>"+item.name+""+item.ext+"</div>" 
                        +"<input class='showInput' autofocus='autofocus' type='text' onblur='onBlur(this)' value="+item.name+"></input>"    
                    +"</div>"
                    +"<div class='fileItem_key lastModify'>"+item.lastModify+"</div>"
                    +"<div class='fileItem_key size'>"+getSize(item.size)+"</div>"
                +"</div>"
    $("#disk_content_body").prepend(html)
 }
 function onBlur(el){
     var name = $(el).val();
     if(!name){
        return;
     }
     var path = getFilePath().split("/")
     path.push(name);
     path =  "/"+path.join("/")
     console.log("path:",path);
     var source =  $(el).parents(".fileItem").attr("source");
     source = JSON.parse(source)
     //发送请求
     var data = {
         type:source.type,
         path:path
     }
     var option = {
         type:'put',
         url:"/file/newFile",
         dataType:'json',
         data:data,
         success:function(result){
             if(!result.success){
                $.dialog.message.show({
                    type:'error',
                    message:result.desc
                });
                 return;
             }else{
                $.dialog.message.show({
                    type:'success',
                    message:"创建成功"
                });
             }
            $(el).hide()
            $(el).prev(".showname").html(name).show();
            $(el).parents(".fileItem").attr("source",JSON.stringify(result.data));
            $(el).parents(".fileItem").find(".lastModify").text(result.data.lastModify)
            $(el).parents(".fileItem").attr("key",result.data.id)
         },
         error:function(err){
            console.log("err:",err)
         }
     }
     $.ajax(option);
 }
 /**
  * 创建新建文件类型下拉列表
  */
 var createNewFileList = function(){
    var instance = null;
    return function(data,dom){
        if(instance){
            return instance;
        }
        instance = new fileList(data,dom);
        return instance;
    }
 }();
 /**
  * 创建文件输入框
  */
 function createFileInput(){
    var inputInstance = null; 
    return (function(){
        if(inputInstance){
           return inputInstance;
        }else{
            var input= document.createElement("input");
            input.type="file";
            inputInstance = input;

            $(inputInstance).on("change",function(){
                console.log("inputInstance:",inputInstance.files[0]);
                //更新上传文件列表
                if(!inputInstance.files[0]){
                     return;
                }
                inputInstance.files[0].id=inputInstance.files[0].lastModified;
                inputInstance.files[0].path=getFilePath();
                upAndDownEvent.add("upload",inputInstance.files[0]);
                tab.show("upList")
            })
        }
        inputInstance.click();
        return inputInstance;
    })()
       
 }

 /**
  * 根据路径获取云盘下的目录结构
  * @param {*云盘路径} path 
  */
 function getDirList(path){
    $("#disk_content_body").off('click',checkbox);
    $.post("/file/dirList",{path:path||""},function(res){
         if(res.code=="1000"){
           var html =  createList(res.data);
           var breadcrumb = createBreadcrumb(path)
           $("#disk_content_body").html(html);
           $("#disk_content_body").on('click',checkbox);
           $("#breadcrumb_item_path").html(breadcrumb);
         }
    })
    
 };
 /**
  * 选中文件或文件夹
  */
 function checkbox(e){
   var ev=e||event;
   var target = ev.target;
   var checkbox = null;
   var fileItem = $(target).parents(".fileItem");
   var source =  fileItem.attr("source");
       source = JSON.parse(source)
   if(!$(target).hasClass("checkbox")){
       return;
   }/*else{
       checkbox =  $(target).find(".checkbox");
   }*/
   //判断有没有被选中
   checkbox = $(target)//.parents(".fileItem").find(".checkbox");
   if(checkbox.hasClass("checked")){
        upAndDownEvent.delete("download",source)
    }else{
        upAndDownEvent.add("download",source)
    }
   checkbox.toggleClass("checked")
   fileItem.toggleClass("checked");
 }
 /*
  *获取可下载文件
  */
 function getFileList(){
     $.get("/file/fileList",function(res){
         let content = "<ul class='filelist'>"
         res.forEach(function(element){
             content = content
              +"<li source="+JSON.stringify(element)+">"
                 +"<span class='fileName'>"+element.name+"</span>"
                 +"<span class='status'><span class='processBar'><span class='process'></span><span class='value'></span></span></span></span>"
                 +"<span class='operate'><button class='btn'>下载</button></span>"
              +"</li>"
         });
         content+"</ul>";
         $("#content").append(content)
     })
 };

 /**
  * 点击文件列表
  * @param {*文件} file 
  */
 function fileClick(file){
    var data = $(file).parents(".fileItem").attr("source")
    if(!data){
       return
    }
    data = JSON.parse(data);
    if(data.type==0){
        //文件夹
        var path = data.path;
        getDirList(path);
     }
 };

 /**
  * 创建列表
  * @param {*列表数据} data 
  */
 function createList(data){
    var html="";
    data.forEach(function(item){
        var name=item.name;
        var size = item.size;
        var lastModify = item.lastModify;
        var type=item.type;
        var style = "";
        if(item.thumbPath.length>0){
            var path = item.thumbPath.join("/")
            style = "background:url(../"+path+")"
        }else{
            style = "";
        }
        var tr = "<div class='fileItem' source="+JSON.stringify(item)+" key="+item.id+">"
                  +"<div class='fileItem_key name'>"
                        +"<div class='checkbox'></div>"
                        +"<div class='fileType type_"+getType(item)+"' style="+style+" onclick='fileClick(this)'></div>"
                        +"<div onclick='fileClick(this)'>"+name+""+item.ext+"</div>"     
                  +"</div>"
                  +"<div class='fileItem_key lastModify'>"+lastModify+"</div>"
                  +"<div class='fileItem_key size'>"+getSize(size)+"</div>"
                +"</div>"
        html+=tr
    });
    var str="";
    if(data.length==0){
        str="空空如也"
    }else{
        str="共"+data.length+"项"
    }
    var foot="<div class='footer desc'>"+str+"</div>"
    return html+foot
 }

 function getType(item){
    var type=item.type;
    var ext = (item.ext||"").toLowerCase();
    if((ext.indexOf(".zip")!=-1)||(ext.indexOf(".rar")!=-1)||(ext.indexOf(".zlib")!=-1)){//压缩文件
        return 7;
    }else if(ext.match(/(jpg)|(png)/)){
        return 8;   
    }else if(ext.match(/(mp4)|(wma)|(avi)/)){
        return 9;
    }else{
        return type;
    }
 }
 /**
  * 转换问价大小
  * @param {*大小} size 
  */
 function getSize(size){
    if(size>1024*1024){
        return (size/(1024*1024)).toFixed(2)+"MB";
    }else{
        if(size==0){
           size=1024;
        }
        return (size/1024).toFixed(2)+"KB";
    }
 }
 /**
  * 创建导航条
  * @param {*地址} path 
  */
 function createBreadcrumb(path){
   var  list=[];
   Breadcrumb = [];
   if(!path){
     list = ["."];
   }else{
     list = path.split("\\")
   }
   var html = "";
   list.forEach(function(item,i){
      var className = ".";
      if(i==0){
        className="breadcrumbItem one";
        item="首页"
      }else{
        className="'breadcrumbItem other'";
      }
      item = item.replace("\\","");
      Breadcrumb.push(item);
      html+="<span class="+className+" data="+i+" onclick='breadcrumbClick(this)'>"+item+"</span>"
   })
   return html
 }
 function breadcrumbClick(e){
    var data = $(e).attr("data");
    if(data||data==0){
        var path = "\\"+Breadcrumb.slice(1,data+1).join("/");
         //清空上传下载列表
         upAndDownEvent.clearupAndDownList()
        getDirList(path)
    }
 }
 /**
  * 下载上传列表
  */
  function initUpAndDown(option){
      var defaultOption = {
        initKey:"",
        el:''
      }
      $.extend(defaultOption,option)
      var hasInit=false;
      //1.初始化事件
      $(".tabKey").on("click",function(){
          changeTab(this);
      });
      $("#"+defaultOption.closeBtn).on('click',function(){
        $("#"+defaultOption.el).slideUp();
      });
      $("#"+defaultOption.slideBtn).on('click',function(){
          if($(this).hasClass("slideDown")){
            $("#"+defaultOption.el).animate({"height":"400px"},"easing");
            $(this).removeClass("slideDown")
          }else{
            $("#"+defaultOption.el).animate({"height":"40px"},"easing");
            $(this).addClass("slideDown")
          }
        
      })
      function changeTab(tab){
          //切换tab
          $(".tabKey").removeClass("selected")
          $(tab).addClass("selected");
          //切换内容列表
          var tab = $(tab).attr("tab");
          $(".tabContent").removeClass("selected");
          $(".tabContent[key='"+tab+"']").addClass("selected");
      };
      return {
          show:function(key){
              if(!hasInit){
                 hasInit=true;
              }
              var initTab = $(".tabKey[tab='"+key||defaultOption.initKey+"']");
              changeTab(initTab);
              $("#"+defaultOption.el).slideDown();
          },
          hide(){
              $("#"+dom).slideUp()();
          }
         
      }
  }

