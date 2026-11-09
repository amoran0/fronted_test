import { bootstrapApplication } from '@angular/platform-browser';
import { configuracionAplicacion } from './app/configuracion-aplicacion';
import { Aplicacion } from './app/aplicacion';

bootstrapApplication(Aplicacion, configuracionAplicacion).catch((error) => console.error(error));
