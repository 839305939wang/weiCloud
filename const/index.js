const path = require("path");
const rootPath = process.cwd();
module.exports = {
    uploadBasePath:path.join(rootPath,"upload"),
    thumbPath:path.join(rootPath,"public/img/thumb"),
    staticPath:"img/thumb",
};