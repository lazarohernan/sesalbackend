import { Router } from "express";

import reportesRutas from "./reportes.rutas";
import tableroRutas from "./tablero.rutas";
import configuracionRutas from "./configuracion.rutas";

const enrutador = Router();

enrutador.use("/tablero", tableroRutas);
enrutador.use("/reportes", reportesRutas);
enrutador.use("/api", configuracionRutas);

export default enrutador;
