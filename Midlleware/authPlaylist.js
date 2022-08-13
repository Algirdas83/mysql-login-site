const authPlaylist = (req, res, next) =>{

    if(!req.session.loggedIn){
        return res.redirect('/playlist')
    }

    next()
    
}


export default authPlaylist