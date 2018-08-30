function parcessBar(dom,size){
    this.dom = dom;
    this.instacece = null;
    this.ctx = null;
    this.size = size||50;
}
parcessBar.prototype.init = function(){
   var instacece = document.getElementById(this.dom);
   this.ctx = instacece.getContext('2d');
   // 画灰色的圆
   this.ctx.beginPath();
   this.ctx.arc(this.size,this.size,this.size-10, 0, Math.PI*2);
   this.ctx.closePath();
   this.ctx.fillStyle = '#F6F6F6';
   this.ctx.fill();
   this.process = 0;
};
parcessBar.prototype.animate = function(){
       var that = this;
       requestAnimationFrame(function (){
           that.process = that.process + 1;
           console.log("that.process:",that.process)
           if (that.process <= 100) {
               that.drawCricle(that.process);
           }
       });
};
parcessBar.prototype.drawCricle = function(percent,color){
      // 画进度环
      this.ctx.beginPath();
      this.ctx.moveTo(this.size,this.size);  
      this.ctx.arc(this.size,this.size,this.size-5, Math.PI * 1.5, Math.PI * (1.5 + 2 * percent / 100 ));
      this.ctx.closePath();
      color?this.ctx.fillStyle = color:'#0ec53e';
      
      this.ctx.fill();

      // 画内填充圆
      this.ctx.beginPath();
      this.ctx.arc(this.size,this.size,this.size-8, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fillStyle = '#fff';
      this.ctx.fill();

      // 填充文字
      this.ctx.font = "bold 6pt Microsoft YaHei"; 
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'center';  
      this.ctx.textBaseline = 'middle';  
      this.ctx.moveTo(this.size,this.size);  
      this.ctx.fillText(percent + '%', this.size,this.size);
}