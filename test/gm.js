var gm=require('gm').subClass({ imageMagick : true });
var filePath = "./images/s2.png";
var thumbPath = "./images/thumb/s2.png"
gm(filePath)
.resizeExact(40,40)
.write(thumbPath, function (err) {
  if (!err) console.log('done');
});
