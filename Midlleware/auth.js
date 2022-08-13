

const auth = (req, res, next) =>{

    if(!req.session.loggedIn){
        return res.redirect('/')
    }

    next()
    
}


export default auth