import express from 'express'
import mysql from 'mysql2/promise'
import { engine } from 'express-handlebars'
import multer from 'multer'
import session from 'express-session'
import auth from './Midlleware/auth.js'
import authPlaylist from './Midlleware/authPlaylist.js'


const app = express()


app.use('/publick', express.static('publick'))
app.use( express.urlencoded({
    extends: true
})  )

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

//session configuration part
app.use(session({
    secret:'stasiukynai',
    resave: false,
    saveUninitialized: false,
    cookie:{
        
        maxAge: 60000
        
    }

}))



const database = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spotify'
})






//Konfiguracine eilute kad galetume priimti failus  jpg , git it t.t . Veliau galesime nurodyti kokius formatus norime priimti


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './publick/nuotraukos')
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.')
        
    
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext[ext.length -1]
      cb(null,  uniqueSuffix)
    }
  })

  
const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, next){
     if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif'){

        next(null, true)
     } else{
        next(null, false)
     }
    }
 })


 //muter konfigo galas/////////////////////////

//LOGIN part start///////////////////////////

app.get('/login', (req, res) => {


    res.render('login')

})

app.post('/login', async (req, res) => {
    const login = req.body
    
        for(let key in login){
        if(login[key] === ''){
            return res.render('login',{message:'Turi buti uzpildyti visi laukeliai', status:'danger'} )
        }
        }


        try {

            const user = await database.query(` SELECT * FROM users WHERE  email = '${login.email}' AND  password = '${login.password}' `)
            
        if(!user[0].length >= 1){

            return res.render('login',{message:'Suvesti blogi duomenys', status:'danger'} )
         }

         // prisijungimas ingile@gmail.com 7675675
            req.session.loggedIn = true
            return res.redirect('/')
            
        } catch {

            return res.render('login',{message:'Ivyko klaida persiunciant duomenis ', status:'danger'} )

            
        }
        
        

   return res.redirect('/')

})

//LOGIN part END///////////////////////////



//REGISTER part START///////////////////////////

app.get('/register', (req, res) => {


    res.render('register')


})

app.post('/register', async (req, res) => {

    const register = req.body

    for(let key in register){
        if(register[key] === ''){
          return res.render('register',{message:'Turi buti uzpildyti visi laukeliai', status:'danger'} )
        }
      }

    try {

        const user = req.body

        const newuser =  await database.query(`INSERT INTO users (name, last_name, email, password) VALUES ('${user.name}','${user.lastName}', '${user.email}', '${user.password}')`)
    
       return res.redirect('/login/?message=Duomenys isaugoto sekmingai&status=success')
        
    } catch {

        return res.render('register', {message: 'Ivyko klaida', status:'danger'})
        
    }

    res.render('register')


})





//REGISTER part END///////////////////////////




// songs start
app.get('/' ,async (req, res) => {

    
   const songs =  await database.query('SELECT id, song_Name, song_album FROM songs')

//    if(!req.session.loggedIn === true){

//    return res.render('songsTable', {songs: songs[0] , cookie: true})
// }

   

    res.render('songsTable', {songs: songs[0]})
})

// console.log('testas veikia');

app.get('/new', (auth), async (req, res)=>{

    res.render('new')

    // const songs =  await database.query('SELECT id, song_Name, song_album FROM SONGS')
})

app.post('/new', async (req, res) => {

    try {

        const data = req.body
    
    // const songs =  await database.query(`INSERT INTO SONGS (playlist_id, song_Name, song_album) VALUES ('${data.playlistId}','${data.song}','${data.songAlbum}')`)
    const songs =  await database.query('INSERT INTO songs ( `playlist_id`, `song_Name`,`song_album`) VALUES (?, ?, ?) ' , [data.playlistId, data.song, data.songAlbum])

    return res.redirect('/')
        
    } catch  {

       return res.render('new', {message: 'Ivyko klaida', status:'danger'})
        
    }
    
})


app.get('/edit/:id',(auth), async (req, res) => {

    const id = req.params.id

    const songs = await database.query(`SELECT playlist_id, song_Name, song_album FROM songs WHERE id = ${id}`)

    const song = songs[0][0]

    res.render('edit', song)
})


app.post('/edit/:id', async (req, res) => {

    const id = req.params.id

    const data = req.body

    const songs = await database.query(`UPDATE songs SET playlist_id = ${data.playlistId}, song_Name = '${data.song}', song_album = '${data.songAlbum}' WHERE  id = ${id} `)

    return res.redirect('/')
})


app.get('/delete/:id', (auth), async (req,res) => {

    

    const id = req.params.id

    const songs = await database.query(`DELETE FROM  songs  WHERE  id = ${id}`)

    return res.redirect('/')
})



/// PLAYLIST get  post update delete part////////////////////////////////////////

app.get('/playlist', async (req, res) => {


    const playlist =  await database.query('SELECT id, name, image FROM playlist')



    res.render('playList', {playlist: playlist[0]})

})




app.get('/playlists/new', (authPlaylist), (req, res) => {

    res.render('addPlaylist')


})

app.post('/playlists/new', (authPlaylist) ,upload.single('image'),  async (req, res) => {

try {

    const data = req.body.name
    const imgData = req.file.path

     const playlist =  await database.query(`INSERT INTO playlist (name, image) VALUES ('${data}','${imgData}')`)

    return res.redirect('/playlist')
    
} catch (error) {
    console.error(error);
    console.log('Kazkas ne taip su duomenu perdavimu');
    
}

    res.send('play list post dalis veikia')
})


app.get('/playlists/edit/:id', (authPlaylist), async (req, res) => {

    const id = req.params.id
    

    const playlist = await database.query(`SELECT name, image  FROM playlist WHERE id = ${id}`)

    const list = playlist[0][0]
    

    res.render('editPlaylist', list)


})

app.post('/playlists/edit/:id',(authPlaylist), upload.single('image'), async (req,res) => {

    const id = req.params.id
    const imgData = req.file.path
    const nameData = req.body.name

    console.log(id);
    
      const playlistUpdate = await database.query(`UPDATE playlist set name = '${nameData}', image = '${imgData}' WHERE id = ${id}`)

    res.redirect('/playlist')

} )


app.get('/playlists/delete/:id',(authPlaylist), async (req, res) => {

    const id = req.params.id

    const playlistDelete = await database.query(`DELETE FROM playlist WHERE id = ${id}`)

    res.redirect('/playlist')


})





app.listen(3000)












/* import express, { urlencoded } from 'express'
import multer from 'multer'
import path from 'path'


const app = express()
//Konfiguracija  kad galetume priimti informacija POST metodu
app.use(urlencoded({
    extended: true
}))

app.use('/nuotraukos', express.static('nuotraukos'))






//Konfiguracine eilute kad galetume priimti failus  jpg , git it t.t . Veliau galesime nurodyti kokius formatus norime priimti


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './nuotraukos')
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.')
        
    
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext[ext.length -1]
      cb(null,  uniqueSuffix)
    }
  })

  
const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, next){
     if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif'){

        next(null, true)
     } else{
        next(null, false)
     }
    }
 })




//Middleware 'upload.single()' kad galetume priimti nuotraukas

app.post('/', upload.single('nuotrauka'), (req, res) => {

    res.send(req.file.filename)  
})

app.get('/', (req, res) => {

    res.sendFile(path.resolve('./templates/index.html') )
})


app.listen(3000)            

*/


/*
Spotify aplikacija
Due today at 23:59
Instructions
Praplėskite spotify aplikacijos funkcionalumą:

Sukurkite vartotojų registraciją bei prisijungimą. 
Neprisijungęs vartotojas turi turėti galimybę peržiūrėti visus grojaraščius bei dainas.
Prisijungęs vartotojas gali kurti bei redaguoti grojaraščius ir dainas.
Saugant naują grojaraštį priskirkite prisijungusio vartotojo "id" prie stulpelio "user_id", "playlists" lentelėje.
Prisijungęs vartotojas gali matyti tik savo įkeltas dainas ir grojaraščius.

Papildomi taškai:
Įkeliant naują dainą sukurkite "select" elementą kuriame atvaizduokite visų vartotojų grojaraščių pasirinkimą. Prie kiekvieno <option> elemento priskirkite value reikšmę kurioje nurodykite grojaraščio id. Gautą reikšmę išsaugokite duomenų bazės lentelėje "songs", prie "playlist_id" stulpelio.

Stilizuokite aplikaciją norimais css karkasais (Bootstrap, Material, Tailwindcss ir t.t.)
Užbaigę aplikaciją įkelkite ją į github ir repozitorijos nuorodą prisekite prie šios užduoties.
*/