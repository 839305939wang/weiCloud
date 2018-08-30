var  upAndDownEvent = function(){
    var uploadList = [];
    var downloadList = [];
    var limit = 3;
    var waitingObjList={};//等待下载列表
    var waitingUploadList={};//等待上传列表
    return {
        /**
         * 清空上传下载列表
         */
        clearupAndDownList:function(){
            waitingObjList = {};
            waitingUploadList= {};
        },
        /**
         * 删除文件
         */
        deleteFiles:function(){
            var _self = this;
           if(JSON.stringify(waitingObjList)=="{}"){
               //提示选中需要删除的文件
               $.dialog.message.show({
                   type:'warning',
                   message:'请选中需要删除的数据'
               })
               return;
           }
           //提醒是否需要删除数据
           var params = {
                data:[]
            }
            for(var item in waitingObjList){
                var file = waitingObjList[item];
                params.data.push(file);
            }
           var message = "确认是否需要删除选中的"+params.data.length+"条数据";
           $.dialog.confirm.show({
                type:'info',
                message:message,
                okCallback:function(){
                      //发送删除请求
                        var option = {
                            type:"delete",
                            contentType:"application/json",
                            url:"/file/delete",
                            contentType: 'application/json',
                            data: JSON.stringify(params),
                            success:function(result){
                                $.dialog.message.show({
                                    type:'success',
                                    message:'删除成功'
                                })
                                //移除当前文件
                                for(var key in waitingObjList){
                                    $(".fileItem[key="+key+"]").remove();
                                }
                                 //移除当前waitingObjList中已经删除的对象
                                 waitingObjList = {};
                                //显示当前页还有多少文件
                                var count =  $(".fileItem[key]").length;
                                var desc = count>0?"共"+count+"项":"空空如也";
                                $(".footer").text(desc);
                            },
                            error:function(err){
                                $.dialog.message.show({
                                    type:'success',
                                    message:'删除成功'
                                })
                            }
                        }
                        $.ajax(option)
                }
            })
           
           
           //

        },
        /**
         * 新增上传对象
         */
       addUploadItem:function(item){
            var exist = uploadList.find(function(obj){
                return obj.id==item.id;
            })
            //判断对象是否以及存在
           if(exist){
             //判断状态 1正在上传 2上传完成 5上传暂停 4下载失败
              var fileItem = uploadList.find(function(obj){
                return obj.id==item.id;
              })
              var state = fileItem.state;
              switch(state){
                    case 1:
                       console.log("正在上传")
                       break;
                    case 2:
                       console.log("上传完成")
                       break;
                    case 3:
                       console.log("上传暂停")
                       break;
                    case 4:
                       console.log("上传失败")
                       break;
              }
            }else{
                //判断正在下载的数量有没有超过同时下载的限制的数量，如果超过的就处于等待下载的状态
                uploadList.push(item);
                //正在下载的文件列表
                var downloading = uploadList.filter(function(item){
                    return item.state==1;
                })
                if(uploadList>limit){
                    var waitting = uploadList.filter(function(item,index){
                        if(item.state==4||!item.state){
                            item.state=4;
                            return item;
                        }
                    })
                }else{
                    
                }
                //更新下载列表面板
                this.updateUpAdnDownPanel("upload");
          }
       },
       /**
        * 新增上传对象
        * @param {*下载对象} item 
        */
       addDownloadItem(item){
            var exist = downloadList.find(function(obj){
                return obj.id==item.id;
            })
            //判断对象是否以及存在
           if(exist){
             //判断状态 1正在下载 2下载完成 3下载失败
              var fileItem = downloadList.find(function(obj){
                return obj.id==item.id;
              })
              var state = fileItem.state;
              switch(state){
                    case 1:
                       console.log("正在下载")
                       break;
                    case 2:
                       console.log("下载完成")
                       break;
                    case 3:
                       console.log("下载失败")
                       break;
                    case 4:
                       console.log("等待下载")
                       break;
              }
            }else{
                
                //判断正在下载的数量有没有超过同时下载的限制的数量，如果超过的就处于等待下载的状态
                downloadList.push(item);
                //正在下载的文件列表
                var downloading = downloadList.filter(function(obj){
                    return obj.state==1;
                })
                if(downloading>limit){
                    var waitting = downloadList.filter(function(item,index){
                        if(item.state==4||!item.state){
                            item.state=4;
                            return item;
                        }
                    })
                }else{
                    
                }
                //更新下载列表面板
                this.updateUpAdnDownPanel("download");
          }
         
       },
       /**
        * 更新下载列表面板
        */
        updateUpAdnDownPanel:function(type){
             var that = this;
             if(type=="download"){
                 var down_contents = $("#down_content>#filelist>.downloadItem");
                 downloadList.forEach(function(item){
                    var target = null;
                    for(var i=0;i<down_contents.length;i++){
                        var file = down_contents[i];
                        if($(file).attr("key")==item.id){
                            target = file;
                            break;
                        }
                    }
                    if(target){
                        //更新列表状态
                        that.updateState(target);
                    }else{
                        //添加文件到列表中去
                        that.addFileToList('download',item);
                    }
                 })
             }else if(type="upload"){
                var upload_contents = $("#up_content>#filelist>.upItem");
                    uploadList.forEach(function(item){
                        var target = null;
                        for(var i=0;i<upload_contents.length;i++){
                        var file = upload_contents[i];
                        if($(file).attr("key")==item.id){
                            target = file;
                            break;
                        }
                        }
                    if(target){
                        //更新列表状态
                        that.updateState(target);
                    }else{
                        //添加文件到列表中去
                        that.addFileToList('upload',item);
                    }
                })
             }
       },
       /**
        * 更新列表状态
        */
       updateState(){
             console.log("更新对象状态",downloadList);
       },
       /**
        * 添加文件到列表中去
        */
       addFileToList(type,element){
             var fileName = element.name
             if(element.ext){
                fileName = fileName+element.ext;
             }
             var fileItem = 
             "<li source="+JSON.stringify(element)+" key="+element.id+" class='downloadItem'>"
                +"<span class='fileName'>"+fileName+"</span>"
                +"<span class='status' id='status'></span>"
                +"<span class='operate'>"
                    +"<canvas class='process' id="+element.id+" width='40' height='40'></canvas>"
                +"</span>"
             +"</li>"
             if(type=="download"){
                $("#down_content>#filelist").append(fileItem);
                let file = new File(element,fileItem);
                file.startDownload()
             }else if(type=="upload"){
                $("#up_content>#filelist").append(fileItem); 
                let file = new File(element,fileItem);
                file.startUpload(element)
             }
       },
       /**
        * 添加到待操作对象中去
        */
       add(type,item){
           if(type=="download"){
             if(!waitingObjList[item.id]){
                waitingObjList[item.id] = item; 
             }
           }else if(type=="upload"){
                this.addUploadItem(item)
           }
          console.log(type,"->add:",item);
       },
       /**
        * 从待操作对象中删除
        */
       delete(type,item){
        if(type=="download"){
            if(!waitingObjList[item.id]){
                delete waitingObjList[item.id];
            }
          }else if(type="upload"){
            if(!waitingUploadList[item.lastModified+""]){
                delete waitingUploadList[item.lastModified+""];
            }
          }
        console.log(type,"->delete:",waitingObjList);
       },
       /**
        * 开始下载
        */
       startDownload(){
          for(var key in waitingObjList){
              var item = waitingObjList[key];
              this.addDownloadItem(item)
          }
          waitingObjList = {};
       },
       /**
        * 开始上传
        */
       startUpload(){

       }

    }
}()
