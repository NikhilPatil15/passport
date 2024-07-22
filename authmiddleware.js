
export const authmiddleware = async(req,res,err,next)=>{
    const {accessToken} = req.cookies
const token =
    accessToken||
    req.header("Authorization")?.replace("Bearer ", "");

    if(!token){
     return res.status(401).send("Unauthorized request")
    }

    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err)
            return res.status(401).send("Invalid Token")
        req.decoded = decoded
    })

    
    next()

}