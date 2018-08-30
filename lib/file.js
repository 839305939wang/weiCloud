const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const PassThrough = require('stream').PassThrough;
const resBody = require("./responseBody.js");
const Busboy = require("busboy");
const config = require("../const");
const gm = require("gm");
const ffmpeg = require("ffmpeg");
class File{
   constructor(ctx){
       this.ctx = ctx;
       this.id=ctx.request.body.id||"";
       this.ext = ctx.request.body.ext||'';
       this.route = ctx.request.body.path||''
   }
   static md5(str) {
    var md5sum = crypto.createHash("md5");
    md5sum.update(str);
    str = md5sum.digest("hex");
    return str;
   }
   //获取下载文件列表
   list(){
      let dirPath = "./down";
      let dir = fs.readdirSync(dirPath);
      let res = [];
      dir.forEach((item)=>{
           let name = path.basename(item,path.extname(item))
           let extname = path.extname(item);
           let itemUrl = path.join(dirPath,item);
           let itemStat = fs.statSync(itemUrl);
           let json = {
               name:name,
               extname:extname,
               total:itemStat.size
           }
           res.push(json);
      });
      this.ctx.body=res;
   }
   //下载文件
   download(){
       let str = "";
       let basePath =config.uploadBasePath; //"./down/fileManager";
       let url = path.join(basePath,this.route);
       let exist = fs.existsSync(url);
       if(exist){
           let Etag=this.ctx.Etag;
           let stat=fs.statSync(url);
           let fileEtag = File.md5(stat.birthtimeMs+"")
           if(!Etag){
            this.ctx.set({
                "Etag":fileEtag,
                "Content-type":"application/octet-stream",
                "total":stat.size
            });
            let fileReaderStream = fs.createReadStream(url);
            this.ctx.body = fileReaderStream.on('error',this.ctx.onerror).pipe(PassThrough());
           }
       }else{
           this.ctx.set({
             "Content-type":"application/json"
           })
           this.ctx.body={
               code:'1001',
               msg:'文件走丢了'
           }
       }
   }
   //获取文件目录结构
   static dirList(targetPath){
     let that = this;
     let dirList = [];
     let basePath =config.uploadBasePath;//"./down/fileManager"
     getList(targetPath);
     function getList(targetPath){
           if(!targetPath){
              targetPath=basePath;
           }else{
            targetPath = path.join(basePath,targetPath);
           };
           let list = fs.readdirSync(targetPath);
           list.forEach((item,index)=>{
               let filePath=path.join(targetPath,item);
               let fileDeatil = fs.statSync(filePath);
               let type=that.judgeType(fileDeatil,filePath);
               let json = {
                   id:that.md5(fileDeatil.birthtimeMs.toString()),
                   name:path.basename(filePath,path.extname(filePath)),
                   path:filePath.split("upload")[1],
                   ext:path.extname(filePath),
                   lastModify:fileDeatil.birthtime,
                   size:that.caculateFileSize(filePath),
               }
               Object.assign(json,type);
               dirList.push(json)
           });
           dirList.sort((a,b)=>{
               return a.type-b.type;
           })
     }
     let result = new resBody(true,'','',dirList).body();
     return result
   }
   /**
    * 计算文件大小
    */
    static caculateFileSize(filePath){
        let size=1;
        let that = this;
        getSize(filePath);
        function getSize(filePath){
            let fileDeatil = fs.statSync(filePath); 
            if(fileDeatil.isDirectory()){
               let list = fs.readdirSync(filePath);
               if(list.length!=0){
                  list.forEach((item,index)=>{
                      let subPath = path.join(filePath,item)
                      getSize(subPath)
                  })
               }
            }else{
                size+=fileDeatil.size;
            }
        }
         return size;
   }
   /**
    * 判断目标类型
    */
    static judgeType(stat,filePath){
       let methods = ["isDirectory","isFile","isBlockDevice","isCharacterDevice","isFIFO","isSocket","isSymbolicLink"]
       let result={};
       for(let i =0;i<methods.length;i++){
           let item = methods[i];
           let thumbPath = "";
           if(stat[item]()){
                //判断文件是否存在缩略图
                if(item=="isFile"&&filePath){
                   thumbPath = path.join(config.thumbPath,path.basename(filePath,path.extname(filePath))+"_1")+".jpg"
                   let exist = fs.existsSync(thumbPath);
                   console.log("thumbPath:",thumbPath,exist);
                   thumbPath =exist?(path.join(config.staticPath,path.basename(filePath,path.extname(filePath))+"_1")+".jpg"):""
                }
                result = {type:i,thumbPath:thumbPath?thumbPath.split("\\"):""};
                break;
            } 
       }
       console.log()
       return result;
   }
   /**
    * 处理上传文件
    * @param {*} ctx 
    */
    async upload(){
        let req = this.ctx.req;
        let res = this.ctx.res;
        let that = this;
        let busboy = new Busboy({ headers: req.headers });
        let Etag = this.ctx.Etag;
        let fileId = req.headers.id;
        let filePath = decodeURIComponent(req.headers.path);
        console.log("filePath:",filePath)
        let fileSize=req.headers.total;
        let current = req.headers.current;
        let fileUrl = "";
        let result = new Promise((resolve,reject)=>{
            busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                console.log("uploadFilePath:",filePath)
                let fPath = path.join(config.uploadBasePath,filePath,fieldname);
                fileUrl = fPath;
                let wr = null;//fs.createWriteStream(fPath);
                if(fs.existsSync(fPath)){
                    //判断是不是分片段传输的文件
                    let stat = fs.statSync(fPath);
                    let Etag = File.md5(stat.birthtimeMs.toString());
                    console.log(Etag,"Etag==fileId:",Etag==fileId)
                    if(Etag==fileId){
                       //分段传输
                    }else{
                        fs.unlinkSync(fPath);
                    }
                    wr = fs.createWriteStream(fPath,{'flags': 'a'}); 
                }else{
                    wr = fs.createWriteStream(fPath,{'flags': 'a'}); 
                }
                file.on('data', function(data) {
                    console.log("收到数据:",data.length);
                   //console.log(`文件类型:${filename}--文件名称:${fieldname}--编码方式:${encoding}--媒体类型:${mimetype}--文件大小:${data.length}`)
                   wr.write(data);
                });
                file.on('end', function() {
                    wr.close()
                });
           });
           busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
                 console.log('Field:',fieldname,"val:",val,"mimetype:",mimetype);
                 //console.log(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype)
           });   
           busboy.on('finish', function() {
                File.handlUploadFile(fileUrl,fileSize,current).then((result)=>{
                    let msg = {
                        "success":true,
                        "desc":"文件写入成功"
                    }
                    Object.assign(msg,result);
                    resolve(msg)
                }).catch((err)=>{
                    reject(err)
                })
           });
           busboy.on('error', function() {
                let msg = {
                    "success":false,
                    "desc":"文件上传失败"
                }
                reject(msg)
            });
           req.pipe(busboy);
        })
       return result;
   }
    /**
     * 判断上传文件的类型并处理文件
    */
    static async handlUploadFile(filePath,total,current){
        let stat = fs.statSync(filePath); 
        let that = this;
        let fileExt = (path.extname(filePath)+"").toLocaleLowerCase();
        /**
         * 处理职责链
         */
        function handlChan(fn){
             this.fn=fn;
             this.nextHandle = null; 
        };
        handlChan.prototype.setNextHandle = function(handl){
            this.nextHandle = handl; 
        }
        handlChan.prototype.handle =async function(){
           let ret =await  this.fn.apply(this,arguments);
          
           if(ret=="next"){
              // console.log("this.nextHandle:",this.nextHandle)
               ret = await this.nextHandle&&this.nextHandle.handle.apply(this.nextHandle,arguments)
           }  
           return ret;
           
        }
        //生成单个职责节点
        let imageChain = new handlChan(uploadIsImage);
        let videoChain = new handlChan(uploadIsVideo);
        let normalChain = new handlChan(uploadIsNormal);
        //多个职责节点组成链条
        imageChain.setNextHandle(videoChain);
        videoChain.setNextHandle(normalChain);
        //执行第一个节点
        console.log("filePath:",filePath)
        let thumb =await imageChain.handle(filePath,fileExt);
        
        //图片
        function uploadIsImage(filePath,ext){
            return new Promise((resolve,reject)=>{
                let surports = [".png",".jpg"];
                if(surports.indexOf(fileExt)!=-1){
                    //判断是不是分段传输的最后一次上传
                    if(current<total){
                        resolve({"thumbPath:":""});
                    }
                    console.log("---uploadIsImage---",config.thumbPath,path.basename(filePath))
                    let thumbPath = path.join(config.thumbPath,path.basename(filePath,path.extname(filePath)))+"_1.jpg";
                    console.log(filePath,"filePath--:",path.basename(filePath,path.extname(filePath)));
                    gm(filePath)
                    .resizeExact(40,40)
                    .write(thumbPath,function(err){
                        if(err){
                            console.log("err:",err);
                            resolve({thumbPath:""})
                        }
                        let url = path.join(config.staticPath,path.basename(filePath,path.extname(filePath))+"_1.jpg");
                        resolve({"thumbPath:":url});
                    });
                   
                }else{
                    resolve("next")
                }
            })
            
        }
        //视频
        function uploadIsVideo(url,ext){
            return new Promise((resolve,reject)=>{
                let surports = [".avi",".mp4"];
                if(surports.indexOf(ext)!=-1){
                    console.log("---uploadIsVideo---");
                    //判断是不是分段传输的最后一次上传
                    if(current<total){
                        resolve({"thumbPath:":""});
                    }else{
                        console.log("传输完成:",stat.size,total);
                        try {
                            let basename = path.basename(url)
                            let process = new ffmpeg(url);
                            process.then(function (video) {
                                // Callback mode
                                //video.setSize("40");
                                let thumbFilePath = basename;
                                video.fnExtractFrameToJPG(config.thumbPath, {
                                    frame_rate : 1,
                                    number :1,
                                    size:"40x40",
                                    file_name : basename
                                }, function (error, files) {
                                    if (error){
                                        console.log("error:",error)
                                        return;
                                    }
                                    let file = files[0].split("thumb")[1];
                                    let returnPath = path.join(config.staticPath,file)
                                    resolve({thumbPath:returnPath});
                                });
                            }, function (err) {
                                resolve({thumbPath:""});
                            });
                        } catch (e) {
                            console.log(e.code);
                            console.log(e.msg);
                            resolve({thumbPath:""});
                        }
                    }  
                }else{
                    resolve("next")
                }
            })
           
        }
        //普通文件
        function uploadIsNormal(url,ext){
           return new Promise((resolve,reject)=>{
               console.log("---uploadIsNormal---")
               resolve({});
           })
        }

        return new Promise((resolve,reject)=>{
            if(stat.birthtimeMs){
                let etag = File.md5(stat.birthtimeMs+"");
                let result = {
                    id:etag,
                    id:File.md5(stat.birthtimeMs.toString()),
                    name:path.basename(filePath,path.extname(filePath)),
                    path:filePath.split("upload")[1],
                    ext:path.extname(filePath),
                    lastModify:stat.birthtime,
                    size:that.caculateFileSize(filePath),
                }
                Object.assign(result,thumb);
                resolve(result)
            }
        })
    }
    /**
     * 创建文件夹
     */
    static createFile(option){
        let that = this;
        let basePath =config.uploadBasePath;
        let filePath = path.join(basePath,option.path)
        let exist = fs.existsSync(filePath);
        if(exist){
            return  Promise.resolve({"success":false,desc:"官人！奴家已经有了"})
        }
        switch(option.type){
            case "0":
               fs.mkdirSync(filePath);
               let fileDeatil = fs.statSync(filePath);
               let type=that.judgeType(fileDeatil);
               let json = {
                   id:File.md5(fileDeatil.birthtimeMs.toString()),
                   name:path.basename(filePath,path.extname(filePath)),
                   path:filePath.split("upload")[1],
                   ext:path.extname(filePath),
                   lastModify:fileDeatil.birthtime,
                   size:File.caculateFileSize(filePath),
               }
               Object.assign(json,type);
               return Promise.resolve({"success":true,data:json})
            default :
               return Promise.resolve({"success":false})
        } 
    };
    static delete(data){
        return new Promise((resolve,reject)=>{
            if(!data||!data.length){
                resolve({success:true,"desc":"没有课删除的文件"})
            }
            data.forEach((file,index)=>{
                let url = path.join(config.uploadBasePath,file.path);
                //判断文件类型
                deleteAll(url)
                resolve({success:true,"desc":"文件删除成功"})
            })
            function deleteAll(url){
                let stat = fs.statSync(url);
                if(stat.isFile()){
                    console.info("删除文件:",url)
                    fs.unlinkSync(url);
                }else if(stat.isDirectory()){
                    let files = fs.readdirSync(url);
                    if(files.length==0){
                        try {
                            fs.rmdirSync(url);
                        } catch (error) {
                            
                        }
                    }else{
                        files.forEach((item)=>{
                            url = path.join(url,item);
                            deleteAll(url)
                        });
                        //删除文件夹
                        let dirPath = path.dirname(url);
                        try {
                            console.info("删除文件夹:",dirPath,dirPath==config.uploadBasePath)
                            if(dirPath==config.uploadBasePath){
                                 return;
                            }
                            fs.rmdirSync(dirPath);
                           
                        } catch (error) {
                            
                        }
                    }
                    //let filePath = path.join(url,)
                }
            }
        })
    }

}
const files = {
    download:function(){
        return async (ctx,next)=>{
         let file = new File(ctx);
         file.download();
         file=null;
        }
    },
    list:function(){
       return async (ctx,next)=>{
        let file = new File(ctx);
        file.list();
        file=null;
       }
    },
    dirList:function(){
        return async (ctx,next)=>{
            let path = ctx.request.body.path||"" 
            let list = File.dirList(path);
            ctx.body = list;
        }
     },
     upload:function(){
        return async (ctx,next)=>{
            let file = new File(ctx);
            let result = await file.upload();
            file=null;
            ctx.body=result
        }
     },
     newFile:function(){
        return async (ctx,next)=>{
            let type = ctx.request.body.type||""
            let path = ctx.request.body.path||""
            let option = {
                type:type,
                path:path
            }
            let result = await File.createFile(option)
            debugger
            ctx.body=result;
        }
     },
     delete:function(){
        return async (ctx,next)=>{
            let files = ctx.request.body;
            let result = await File.delete(files.data)
            ctx.body=result;
        }
     },
};
module.exports = files;