import { Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';
import * as axios from 'axios';

export interface TRPrecipitacion {
  nombrePunto: string;
  horaActual: string;
  ultimas12horas: string;
  acumuladoHoy: string;
  acumuladoAyer: string;
  unidad: string;
}

const tiempoValidezDatos: number = 10 * 60 * 1000; // Establece el tiempo (ms) de validez de los datos antes de que sea necesario actualziarlos
let datosPrecipitacionCache: {fecha: Date, datos: TRPrecipitacion[]} | undefined;

export const getUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  let datosPrecipitacion: TRPrecipitacion[] = [];

  if (datosPrecipitacionCache && datosPrecipitacionCache.fecha.getTime() < Date.now() + tiempoValidezDatos) {
    // Cargar datos antiguos
    datosPrecipitacion = datosPrecipitacionCache.datos;
  } else {
    // Cargar datos nuevos y guardarlos en la caché
    try {
      await axios.default.get('https://www.chguadalquivir.es/saih/LluviaTabla.aspx').then((resp) => {
        const $ = cheerio.load(resp.data);
        const lista = $('#ContentPlaceHolder1_GridLluviaTiempoReal tbody').children();
        datosPrecipitacion = [];

        lista.each((i, elem) => {
          if (i === 0) {
            // No queremos la cabecera de la tabla
            return;
          }
          const fila = $(elem, 'tr').children();
          const obj = {
            nombrePunto: fila.eq(0).text(),
            horaActual: fila.eq(1).text(),
            ultimas12horas: fila.eq(2).text(),
            acumuladoHoy: fila.eq(3).text(),
            acumuladoAyer: fila.eq(4).text(),
            unidad: fila.eq(5).text()
          };
          datosPrecipitacion.push(obj);
        });
        datosPrecipitacionCache = { fecha: new Date(), datos: datosPrecipitacion };
      });
    } catch (err) {
      res.status(500).json({ ok: false });
      // next(err);
    }
  }

  res.status(200).json({ ok: true, datos: datosPrecipitacion });
};
