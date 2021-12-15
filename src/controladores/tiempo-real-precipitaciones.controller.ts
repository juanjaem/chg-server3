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

export const getUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  // res.status(200).json({ ok: true, data: 'Hello from Ornio AS' });
  try {
    axios.default.get('https://www.chguadalquivir.es/saih/LluviaTabla.aspx').then((resp) => {
      const $ = cheerio.load(resp.data);
      const datosPrecipitacion: TRPrecipitacion[] = [];

      const lista = $('#ContentPlaceHolder1_GridLluviaTiempoReal tbody').children();

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
          unidad: fila.eq(5).text(),
        };
        datosPrecipitacion.push(obj);
      });

      res.status(200).json({ ok: true, datos: datosPrecipitacion });
    });
  } catch (err) {
    next(err);
  }
};
