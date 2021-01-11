const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const validUrl = require('valid-url')
const { nanoid } = require('nanoid')

require('dotenv').config()
const app = express()

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected..."))
.catch(e => console.error(e));

const urlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true
    },
    shortUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Url = mongoose.model('Url', urlSchema)

app.get('/:nano', async (req, res) => {
    try {
        const shortUrl = process.env.BASE_URL + req.params.nano

        const urlDoc = await Url.findOne({shortUrl})

        if (urlDoc) {
            res.redirect(urlDoc.longUrl)
        }
        else {
            res.status(404).json({error: "Oops! This URL does not exist in our domain."})
        }
    } catch (e) {
        console.error(e)
    }
})

app.post('/api/', async (req, res) => {
    const { longUrl } = req.body
    
    if (!validUrl.isUri(longUrl)) {
        return res.status(404).json({error: "Sorry! That was not a valid URL."})
    }

    try {
        const url = await Url.findOne({ longUrl })
        if (url) {
            res.status(200).json(url)
        }
        else {
            const newUrlEntry = new Url({
                longUrl,
                shortUrl: process.env.BASE_URL + nanoid()
            })

            await newUrlEntry.save()            
            res.status(201).json(newUrlEntry)
        }
    } 
    catch (e) {
        console.error(e);
    }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))