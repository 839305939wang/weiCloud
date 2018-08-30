var ffmpeg = require("ffmpeg");
try {
    var process = new ffmpeg('./video/VID_20170430_100219.mp4');
    process.then(function (video) {
        // Callback mode
        //video.setSize("40");
        video.fnExtractFrameToJPG('./images/thumb/', {
           // frame_rate :0,
            number :1,
            size:"40x40",
            file_name : 'ffpemg.jpg'
        }, function (error, files) {

            if (error){
                console.error(error)
                return ;
            }
                
            console.log('Frames: ' + files);
        });
    }, function (err) {
        console.log('Error: ' + err);
    });
} catch (e) {
    console.log(e.code);
    console.log(e.msg);
}