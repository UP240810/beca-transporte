const bcrypt = require("bcryptjs");
const db = require("./db");

// Contraseña de demostración para TODAS las cuentas semilla.
const DEMO_PASSWORD = "calvillo2026";

function limpiar() {
  const tablas = [
    "viajes_consumidos", "recargas", "solicitud_rutas", "solicitud_trayectos", "solicitudes",
    "alumno_rutas", "alumnos", "usuarios", "rutas",
  ];
  for (const t of tablas) {
    try { db.exec(`DELETE FROM ${t}`); } catch { /* tabla puede no existir aún */ }
  }
  try { db.exec(`DELETE FROM sqlite_sequence`); } catch { /* */ }
}

function seed() {
  limpiar();
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  // --- Catálogo de rutas (sin precio fijo; DS lo pone al aprobar) ---
  const insertRuta = db.prepare(
    `INSERT INTO rutas (nombre, codigo, descuento_pct, costo_por_viaje) VALUES (?, ?, 60, 0)`
  );
  const catalogo = [
    { nombre: "ARBOLEDAS → CALVILLO", codigo: "R001" },
    { nombre: "ARBOLEDAS → EL RODEO", codigo: "R002" },
    { nombre: "COLOMOS → MALPASO", codigo: "R003" },
    { nombre: "CRUCERO DE LAS PILAS → FRACC VALLE DE HUEJUCAR", codigo: "R004" },
    { nombre: "EL CUERVERO → MALPASO", codigo: "R005" },
    { nombre: "EL RODEO → CALVILLO", codigo: "R006" },
    { nombre: "EL SALITRE → OJO DE AGUA", codigo: "R007" },
    { nombre: "EL TEPALCATE → CALVILLO", codigo: "R008" },
    { nombre: "EL TEPALCATE → LOS PATOS", codigo: "R009" },
    { nombre: "FRACC VALLE DE HUEJUCAR → OJO DE AGUA", codigo: "R010" },
    { nombre: "LAS ANIMAS → CALVILLO", codigo: "R011" },
    { nombre: "LAS TINAJAS → EL SALITRE", codigo: "R012" },
    { nombre: "LAS TINAJAS → OJO DE AGUA", codigo: "R013" },
    { nombre: "LOS ARCOS → CALVILLO", codigo: "R014" },
    { nombre: "MESA GRANDE → CALVILLO", codigo: "R015" },
    { nombre: "OJO DE AGUA → CALVILLO", codigo: "R016" },
    { nombre: "OJOCALIENTE → CALVILLO", codigo: "R017" },
    { nombre: "POTRERO DE LOS LÓPEZ → CALVILLO", codigo: "R018" },
    { nombre: "SAN TADEO → CALVILLO", codigo: "R019" }
  ];
  const rutaIds = {};
  for (const r of catalogo) {
    rutaIds[r.codigo] = insertRuta.run(r.nombre, r.codigo).lastInsertRowid;
  }
  // alias para alumnos demo
  const rutaUPA = rutaIds["R001"];
  const rutaMalpaso = rutaIds["R005"];
  const rutaCentroAgs = rutaIds["R014"];


  // --- Personal municipal -------------------------------------------------
  const insertUsuario = db.prepare(
    `INSERT INTO usuarios (usuario, password_hash, rol, nombre, es_jefe) VALUES (?, ?, ?, ?, ?)`
  );
  // Jefes de área (pueden dar de alta al resto de su equipo)
  insertUsuario.run("recaudacion.andres", hash, "recaudacion", "Andrés Martínez", 1);
  insertUsuario.run("desarrollo.social", hash, "desarrollo_social", "Jefe Desarrollo Social", 1);
  insertUsuario.run("ventanilla.01", hash, "ventanilla", "Jefe de Ventanilla", 1);
  insertUsuario.run("ventanilla.02", hash, "ventanilla", "Ventanilla 2", 0);
  insertUsuario.run("operador.14", hash, "camionero", "Operador 14 (Jefe)", 1);
  insertUsuario.run("admin.transportistas", hash, "admin_transportistas", "Admin Transportistas", 1);
  // Unidades demo
  try {
    db.prepare(`INSERT INTO unidades (codigo, nombre) VALUES ('01', 'Unidad 01'), ('02', 'Unidad 02')`).run();
  } catch (e) {}
  const u01 = db.prepare(`SELECT id FROM unidades WHERE codigo = '01'`).get();
  const op = db.prepare(`SELECT id FROM usuarios WHERE usuario = 'operador.14'`).get();
  if (u01 && op) {
    try {
      db.prepare(`INSERT INTO camionero_perfil (usuario_id, unidad_id, codigo_chofer) VALUES (?, ?, '015')`).run(op.id, u01.id);
    } catch (e) {}
  }


  // --- Alumnos ya aprobados -----------------------------------------------
  function crearAlumno({ nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula, viajesRestantes, rutas }) {
    const usuarioLogin = matricula.toLowerCase();
    const usuarioId = insertUsuario.run(usuarioLogin, hash, "alumno", nombre, 0).lastInsertRowid;
    const alumnoId = db.prepare(`
      INSERT INTO alumnos (usuario_id, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula, viajes_restantes, viajes_limite_mes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 30)
    `).run(usuarioId, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula, viajesRestantes).lastInsertRowid;

    const insertAR = db.prepare(`INSERT INTO alumno_rutas (alumno_id, ruta_id, orden) VALUES (?, ?, ?)`);
    rutas.forEach((rutaId, i) => insertAR.run(alumnoId, rutaId, i + 1));
    return alumnoId;
  }

  const upa = "Universidad Politécnica de Aguascalientes (UPA)";

  const alumnoCamila = crearAlumno({
    nombre: "Camila", apellidos: "Delgado Ruiz", telefono: "4651234567", correo: "cami.delgado@upa.edu.mx",
    escuela: upa, carrera: "Ing. en Computación", grado: "6to semestre", matricula: "UPA-20231045",
    viajesRestantes: 12, rutas: [rutaUPA],
  });

  const alumnoJorge = crearAlumno({
    nombre: "Jorge", apellidos: "Ramírez Soto", telefono: "4659876543", correo: "jorge.ramirez@cbtis191.edu.mx",
    escuela: "CBTIS 191 Calvillo", carrera: "Técnico en Informática", grado: "4to semestre", matricula: "UPA-20230812",
    viajesRestantes: 3, rutas: [rutaMalpaso, rutaUPA],
  });

  const alumnoAna = crearAlumno({
    nombre: "Ana Sofía", apellidos: "Luna", telefono: "4655551122", correo: "ana.luna@upa.edu.mx",
    escuela: upa, carrera: "Ing. Industrial", grado: "2do semestre", matricula: "UPA-20229981",
    viajesRestantes: 0, rutas: [rutaCentroAgs],
  });

  const alumnoDiego = crearAlumno({
    nombre: "Diego", apellidos: "Torres Vega", telefono: "4654448899", correo: "diego.torres@upa.edu.mx",
    escuela: upa, carrera: "Ing. en Mecatrónica", grado: "3er semestre", matricula: "UPA-20225567",
    viajesRestantes: 7, rutas: [rutaUPA],
  });

  // --- Solicitudes pendientes (con trayectos en texto libre) --------------
  const insertSolicitud = db.prepare(`
    INSERT INTO solicitudes (folio, nombre, apellidos, telefono, correo, escuela, carrera, grado, matricula, estado, motivo_correccion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTrayecto = db.prepare(
    `INSERT INTO solicitud_trayectos (solicitud_id, orden, descripcion) VALUES (?, ?, ?)`
  );

  const sol1 = insertSolicitud.run(
    "SOL-3321-2026", "Fernanda", "López Cruz", "4657778899", "fer.lopez@upa.edu.mx",
    upa, "Ing. en Biotecnología", "5to semestre", "UPA-20233321", "pendiente", null
  ).lastInsertRowid;
  insertTrayecto.run(sol1, 1, "De Calvillo Centro a UPA (Aguascalientes)");

  const sol2 = insertSolicitud.run(
    "SOL-7742-2026", "Miguel Ángel", "Torres Ibarra", "4653332211", "miguel.torres@cbtis191.edu.mx",
    "CBTIS 191 Calvillo", "Técnico en Contabilidad", "2do semestre", "UPA-20237742", "pendiente", null
  ).lastInsertRowid;
  insertTrayecto.run(sol2, 1, "De Malpaso a Calvillo Centro");
  insertTrayecto.run(sol2, 2, "De Calvillo Centro a UPA");

  const sol3 = insertSolicitud.run(
    "SOL-5510-2026", "Paola", "Hernández Gil", "4656665544", "paola.hg@upa.edu.mx",
    upa, "Ing. Industrial", "1er semestre", "UPA-2023551O", "corregir",
    "Matrícula no coincide con el formato de la UPA."
  ).lastInsertRowid;
  insertTrayecto.run(sol3, 1, "De Ojocaliente a Aguascalientes Centro");

  // --- Recargas de ejemplo ------------------------------------------------
  const staffVentanilla = db.prepare(`SELECT id FROM usuarios WHERE usuario = 'ventanilla.02'`).get().id;
  const insertRecarga = db.prepare(`
    INSERT INTO recargas (alumno_id, viajes, monto, staff_usuario_id, creado_en)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertRecarga.run(alumnoJorge, 10, 150, staffVentanilla, new Date().toISOString());
  insertRecarga.run(alumnoAna, 20, 300, staffVentanilla, new Date().toISOString());

  // --- Validaciones de ejemplo --------------------------------------------
  const staffOperador = db.prepare(`SELECT id FROM usuarios WHERE usuario = 'operador.14'`).get().id;
  const insertViaje = db.prepare(`
    INSERT INTO viajes_consumidos (alumno_id, ruta_id, operador_usuario_id, resultado)
    VALUES (?, ?, ?, ?)
  `);
  insertViaje.run(alumnoCamila, rutaUPA, staffOperador, "valido");
  insertViaje.run(alumnoDiego, rutaUPA, staffOperador, "valido");

  console.log("Semilla cargada correctamente.");
  console.log("");
  console.log("Cuentas de prueba (todas con la misma contraseña de demo):");
  console.log(`  contraseña para todas: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("  Alumnos:      upa-20231045 · upa-20230812 · upa-20229981 · upa-20225567");
  console.log("  Desarrollo Social: desarrollo.social");
  console.log("  Recaudación:       recaudacion.andres");
  console.log("  Ventanilla:        ventanilla.01 / ventanilla.02");
  console.log("  Camionero:         operador.14");
  console.log("  Admin transportistas: admin.transportistas");
}

seed();
