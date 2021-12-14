import 'dotenv/config'; // Debe ir el primero para que funcione bien la carga del .env
import express from 'express';
import cors from 'cors';
import { TiempoRealPrecipitacionesRoute } from './rutas/tiempo-real-precipitaciones.route';

// Crear el servidor de express
const app = express();

// Configurar CORS
app.use(cors());

// Lectura y parseo del body
app.use(express.json());

// // Directorio público
// app.use(express.static('public'));

// Rutas
// app.use('/api/tiempo-real/precipitaciones', require('./rutas/tiempo-real-precipitaciones'));
app.use('/api/tiempo-real/precipitaciones', new TiempoRealPrecipitacionesRoute().router);

app.listen(process.env.PORT, () => {
  console.log('Servidor corriendo en puerto ' + process.env.PORT);
});

// import express, { Application, Request, Response, NextFunction } from 'express';

// // Boot express
// const app: Application = express();
// const port = 5000;

// // Application routing
// app.use('/', (req: Request, res: Response, next: NextFunction) => {
//   res.status(200).send({ data: 'Hello from Ornio AS' });
// });

// // Start server
// app.listen(port, () => console.log(`Server is listening on port ${port}!`));
