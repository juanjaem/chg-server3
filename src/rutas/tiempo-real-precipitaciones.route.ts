import { getPrecipitacionesTR } from '../controladores/tiempo-real-precipitaciones.controller';
import { Router } from 'express';

export class TiempoRealPrecipitacionesRoute {
  public router = Router();

  constructor () {
    // /api/tiempo-real/precipitaciones
    this.router.get('/', getPrecipitacionesTR);
  }
}
