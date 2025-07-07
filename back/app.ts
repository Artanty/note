import express from 'express'
import dotenv from 'dotenv'
import keywordRoutes from './routes/keywordRoutes'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import checkDBConnection from './core/db_check_connection'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(express.json());
app.use(cookieParser()); 


// Routes
app.use('/keywords', cors(), keywordRoutes);


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