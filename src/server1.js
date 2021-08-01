const express = require('express');
const bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname,'/build')));

app.use(bodyParser.json());

const withDB = async (operations) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db("my-blog");
        await operations(db);
        client.close();
    }
    catch (error) {
        res.status(500).json({ message: 'Error connecting to DB', error })
    }
}

app.get('/api/articles/:id', async (req, res) => {
    withDB(async (db) => {
        const articleId = req.params.id;
        const articleInfo = await db.collection('articles').find({ id: articleId }).toArray();
        res.status(200).json(articleInfo[0]);
    })
})

app.post('/api/articles/:id/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleId = req.params.id;
        const articleInfo = await db.collection('articles').find({ id: articleId }).toArray();
        await db.collection('articles').updateOne({ id: articleId }, {
            '$set': {
                upvotes: articleInfo[0].upvotes + 1
            }
        });
        const updatedArticleInfo = await db.collection('articles').find({ id: articleId }).toArray();
        res.status(200).json(updatedArticleInfo[0]);
    })
});

app.post('/api/articles/:id/add-comment', (req, res) => {
    const { username, comment } = req.body;
    const articleId = req.params.id;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').find({ id: articleId }).toArray();

        await db.collection('articles').updateOne({ id: articleId }, {
            '$set': {
                comments: articleInfo[0].comments.concat({ username, comment })
            }
        });
        const updatedArticleInfo = await db.collection('articles').find({ id: articleId }).toArray();
        res.status(200).send(updatedArticleInfo);
    })
});

app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname+'/build/index.html'));
})

app.listen(8000, () => console.log("Listening on port 8000"));