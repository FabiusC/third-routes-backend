import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routes from './routes/routes';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use('/api', routes);

// Inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
