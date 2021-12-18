import { Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';
import * as axios from 'axios';

export interface DatosPluviometricosCapturados {
  nombrePluviometro: string;
  precipitacionesHoraActual: string;
  precipitacionesUltimas12horas: string;
  precipitacionesAcumuladoHoy: string;
  precipitacionesAcumuladoAyer: string;
  precipitacionesUnidad: string;
}

export interface DatosPluviometricos {
  pluviometro: {
    codigo: string;
    nombre: string;
  }
  provincia: {
    codigo: string;
    nombre: string;
  };
  precipitacionesHoraActual: string;
  precipitacionesUltimas12horas: string;
  precipitacionesAcumuladoHoy: string;
  precipitacionesAcumuladoAyer: string;
  precipitacionesUnidad: string;
}

const tiempoValidezDatos: number = 10 * 60 * 1000; // Establece el tiempo (ms) de validez de los datos antes de que sea necesario actualziarlos
let datosPrecipitacionCache: { fecha: Date, datos: DatosPluviometricos[] } | undefined;

export const getUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  let datosPrecipitacion: DatosPluviometricos[] = [];

  if (datosPrecipitacionCache && datosPrecipitacionCache.fecha.getTime() < Date.now() + tiempoValidezDatos) {
    // Cargar datos antiguos
    datosPrecipitacion = datosPrecipitacionCache.datos;
  } else {
    // Obtener datos nuevos
    try {
      const datosPC: DatosPluviometricosCapturados[] = await capturarDatosPluviometricos();
      const datosP: DatosPluviometricos[] = transformarDatosPluviometricos(datosPC);
      datosPrecipitacion = datosP;
      datosPrecipitacionCache = { fecha: new Date(), datos: datosP };
    } catch (err) {
      res.status(500).json({ ok: false, error: err });
    }
  }

  res.status(200).send(datosPrecipitacion);
};

// Captura los datos de precipitaciones en crudo.
const capturarDatosPluviometricos = async (): Promise<DatosPluviometricosCapturados[]> => {
  return new Promise((resolve, reject) => {
    axios.default.get('https://www.chguadalquivir.es/saih/LluviaTabla.aspx').then((resp) => {
      try {
        const $ = cheerio.load(resp.data);
        const lista = $('#ContentPlaceHolder1_GridLluviaTiempoReal tbody').children();
        const datos: DatosPluviometricosCapturados[] = [];

        lista.each((i, elem) => {
          if (i === 0) {
            // No queremos la cabecera de la tabla
            return;
          }
          const fila = $(elem, 'tr').children();
          const obj = {
            nombrePluviometro: fila.eq(0).text(),
            precipitacionesHoraActual: fila.eq(1).text(),
            precipitacionesUltimas12horas: fila.eq(2).text(),
            precipitacionesAcumuladoHoy: fila.eq(3).text(),
            precipitacionesAcumuladoAyer: fila.eq(4).text(),
            precipitacionesUnidad: fila.eq(5).text()
          };
          datos.push(obj);
          resolve(datos);
        });
        return datos;
      } catch (error) {
        reject(new Error('Error al obtener los datos de la página cargada de CHG'));
      }
    }).catch(() => {
      reject(new Error('Error al cargar la página de CHG'));
    });
  });
};

// Transforma los datos en crudo de precipitaciones
const transformarDatosPluviometricos = (datosPC: DatosPluviometricosCapturados[]): DatosPluviometricos[] => {
  const listaProvinciaCodigosNombre = [
    { codigos: ['AB', ''], nombre: 'Albacete' },
    { codigos: ['CE', 'RENEGADO - CEUTA'], nombre: 'Ceuta' },
    { codigos: ['CR', ''], nombre: 'Ciudad Real' },
    { codigos: ['CO', 'GUADALQUIVIR CORDOBA'], nombre: 'Córdoba' },
    { codigos: ['GR', ''], nombre: 'Granada' },
    { codigos: ['HU', ''], nombre: 'Huelva' },
    { codigos: ['JA', ''], nombre: 'Jaén' },
    { codigos: ['ME', 'LAS ADELFAS-MELILLA'], nombre: 'Melilla' },
    { codigos: ['SE', ''], nombre: 'Sevilla' }
  ];

  return datosPC.map((datoPC, idx, arr) => {
    // Calcular código pluviómetro
    const pluviometroCodigo: string = datoPC.nombrePluviometro.split(' ')[0]; // Extraer código pluviometro. Se supone que siempre existe y tiene el formato M13

    // Calcular nombre pluviómetro
    let pluviometroNombre: string = datoPC.nombrePluviometro.substring(4); // Quitar codigo pluviometro. Se supone que siempre existe y tiene el formato M13
    if (pluviometroNombre[0] === ' ') {
      // Corrige fallo de doble espacio en blanco en la captura de la pantalla por parte de axios
      pluviometroNombre = pluviometroNombre.slice(1);
    }
    if (pluviometroNombre.slice(-1) === ')') {
      pluviometroNombre = pluviometroNombre.slice(0, pluviometroNombre.length - 5); // Quitar código provincia si existe. Se supone que tiene el formato (JA)
    }

    // Calcular codigo y nombre de provincia
    const provinciaNombreCodigo = listaProvinciaCodigosNombre.find((prov) => {
      return prov.codigos.find((provCodigo) => datoPC.nombrePluviometro.includes(provCodigo));
    }) || { codigos: 'ER', nombre: 'ERROR' };

    const datoP: DatosPluviometricos = {
      pluviometro: {
        codigo: pluviometroCodigo,
        nombre: pluviometroNombre
      },
      provincia: {
        codigo: provinciaNombreCodigo.codigos[0],
        nombre: provinciaNombreCodigo.nombre
      },
      precipitacionesHoraActual: datoPC.precipitacionesHoraActual,
      precipitacionesUltimas12horas: datoPC.precipitacionesUltimas12horas,
      precipitacionesAcumuladoHoy: datoPC.precipitacionesAcumuladoHoy,
      precipitacionesAcumuladoAyer: datoPC.precipitacionesAcumuladoAyer,
      precipitacionesUnidad: datoPC.precipitacionesUnidad
    };

    return datoP;
  });
};
