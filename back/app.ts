import express from 'express'
import dotenv from 'dotenv'
import keywordRoutes from './routes/keywordRoutes'
import saveTempRoutes from './routes/saveTempRoutes'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import checkDBConnection from './core/db_check_connection'

import { validateUserAccessToken } from './middlewares/validateUserAccessToken'


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors()) // todo dev only


// Routes
app.use('/keywords', validateUserAccessToken, keywordRoutes);
app.use('/save-temp', saveTempRoutes);


app.get('/get-updates', async (req, res) => {
  res.json({
    trigger: 'clientIP',
    PORT: process.env.PORT,
    isSendToStat: 'sendToStatResult',
  });    
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  checkDBConnection()
});