/**
 * 请求响应体封装
 */
const RES={
    '1000':"请求成功",
    '1001':"请求失败",
}
class responseBody{
   constructor(success,code,desc,data){
        this.success=success;
       
        if(this.success){
            this.code = code||"1000";
        }else{
            this.code = code||"1001";
        }
        this.desc=desc||RES[this.code];
        this.data = data||"";
   }
   body(){
       let json = {
           code:this.code,
           desc:this.desc,
           data:this.data
       }
       return json;
   }
}

module.exports=responseBody;