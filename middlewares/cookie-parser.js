const cookieParser = (req, res, next) => {
    let cookies = req.headers.cookie;
    if(cookies){
        let token = cookies.split("=");
        let index = token.findIndex(tkn => tkn === "token");
        if(index >= 0){
            req.headers.token = token[index + 1];
        }
    }
    next();
}

module.exports = cookieParser;