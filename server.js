const koa = require("koa");
const static = require("koa-static");
const router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const app = new koa();
app.use(static(__dirname+"/public"));
app.use(bodyParser());
const fileRouter = new router();
const file = require("./lib/file.js");
fileRouter.post("/file/download",file.download());
fileRouter.get("/file/fileList",file.list())
fileRouter.post("/file/dirList",file.dirList())
fileRouter.post("/file/upload",file.upload())
fileRouter.put("/file/newFile",file.newFile())
fileRouter.delete("/file/delete",file.delete())
app.use(fileRouter.routes(),fileRouter.allowedMethods())
app.listen(3000,(err)=>{
    if(err){
        throw new Error("服务启动错误")
    }
    console.log("服务启动成功")
})