(function(window,$){
    function dialogConfirm(option){
        this.defaultOption={
            type:'info',
            title:'确认消息',
            message:'',
            duration:500,
            showClose:true,
            ok:'确定',
            cancel:'取消',
            okCallback:null,
            cancelCallback:null
        };
        this.option = $.extend(this.defaultOption,option);
        this.el = this.init();
    }
    dialogConfirm.prototype.setOption=function(option){
        this.option=$.extend(this.defaultOption,option);
        var newMsg = this.create();
        this.el.replaceWith(newMsg);
    }

    dialogConfirm.prototype.show=function(option){
        var _self = this;
        if(option){
            this.option=$.extend(this.defaultOption,option);
            var newMsg = this.create();
            this.el.replaceWith(newMsg);
        }
        this.el=$(".dialog_confirm")
        this.el.fadeIn()
        $(document.body).off('click','.btn-ok');
        $(document.body).off('click','.btn-cancel')
        $(document.body).on('click','.btn-ok',function(){
            if(_self.option.okCallback){
                _self.option.okCallback();
            }
            _self.hide();
        })
        $(document.body).on('click','.btn-cancel',function(){
            _self.hide();
        })
    }
    dialogConfirm.prototype.hide=function(){
        this.el.fadeOut()
    }
    dialogConfirm.prototype.create=function(){
        var _self = this;
        var close = this.option.showClose?"show":'hide';
        var dialog = "<div class='dialog_confirm'>"
                         +"<div class='dialog_confirm_header'>"
                             +"<div class='dialog_confirm_header_title'>"+_self.option.title+"</div>"
                             +"<div class='dialog_confirm_header_close "+close+"'></div>"
                         +"</div>"
                         +"<div class='dialog_confirm_body'>"
                            +"<div class='dialog_confirm_body_icon "+_self.option.type+"'></div>"
                            +"<div class='dialog_confirm_content'>"
                                 +"<div>"+_self.option.message+"</div>"
                                 +"<div class='btn-group'>"
                                     +"<div class='btn btn-ok'>"+_self.defaultOption.ok+"</div>"
                                     +"<div class='btn btn-cancel'>"+_self.defaultOption.cancel+"</div>"
                                 +"</div>"
                            +"</div>"
                         +"</div>"
                         +"<div class='dialog_confirm_footer'></div>"
                      "</div>"
        return dialog
    }
    dialogConfirm.prototype.init = function(){
        var _self = this;
        $(document.body).append(this.create())
        $(document.body).on('click',".dialog_confirm_header_close",function(){
            _self.hide();
        })
        return $(".dialog_confirm")
    }

    function dialogMessage(option){
        this.defaultOption={
            type:'info',
            title:'提示消息',
            message:'',
            top:50,
            right:0,
            duration:500,
            showClose:true,
        };
        this.option = $.extend(this.defaultOption,option);
        this.el = this.init();
    }
    dialogMessage.prototype.setOption=function(option){
        this.option=$.extend(this.defaultOption,option);
        var newMsg = this.create();
        this.el.replaceWith(newMsg);
    }

    dialogMessage.prototype.show=function(option){
        if(option){
            this.option=$.extend(this.defaultOption,option);
            var newMsg = this.create();
            this.el.replaceWith(newMsg);
        }
        this.el=$(".dialog_message")
        this.el.animate({
            right:this.option.right,
            top:this.option.top
        },this.option.duration)
    }
    dialogMessage.prototype.hide=function(){
        this.el.animate({
            right:-1000,
            top:this.option.top
        },this.option.duration)
    }
    dialogMessage.prototype.create=function(){
        var _self = this;
        var close = this.option.showClose?"show":'hide';
        var dialog = "<div class='dialog_message'>"
                         +"<div class='dialog_message_header'>"
                             +"<div class='dialog_message_header_title'>"+this.option.title+"</div>"
                             +"<div class='dialog_message_header_close "+close+"'></div>"
                         +"</div>"
                         +"<div class='dialog_message_body'>"
                            +"<div class='dialog_message_body_icon "+this.option.type+"'></div>"
                            +"<div class='dialog_message_body_content'>"+this.option.message+"</div>"
                         +"</div>"
                         +"<div class='dialog_message_footer'></div>"
                      "</div>"
        return dialog
    }
    dialogMessage.prototype.init = function(){
        var _self = this;
        $(document.body).append(this.create())
        $(document.body).on('click',".dialog_message_header_close",function(){
            _self.hide();
        })
        return $(".dialog_message")
    }
    $.extend({
        dialog:{
            message:function(){
                var instance = null;
                return {
                    show:function(option){                    
                        if(!instance){
                            instance = new dialogMessage();
                        }
                        instance.show(option)
                        return instance;
                   },
                   hide:function(){
                    if(instance){
                        instance.hide()
                    }
                   }
                }
            }(),
            confirm:function(){
                var instance = null;
                return {
                    show:function(option){                    
                        if(!instance){
                            instance = new dialogConfirm();
                        }
                        instance.show(option)
                        return instance;
                   },
                   hide:function(){
                    if(instance){
                        instance.hide()
                    }
                   }
                }
            }(),
        }
    })
})(window,jQuery)