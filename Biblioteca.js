const readline = require('readline');

// ---------------- Clase SistemaBiblioteca ----------------
class SistemaBiblioteca {
  constructor() {
    this.libros = [];
    this.librosPrestados = new Map();
  }

  crearLibro(titulo, autor, genero, isbn) {
    const id = Date.now();
    return {
      id,
      titulo,
      autor,
      genero,
      isbn,
      disponible: true,
      prestadoA: null,
      fechaPrestamo: null,
      fechaDevolucion: null,
      creadoEn: new Date(),
    };
  }

  agregarLibro(titulo, autor, genero, isbn) {
    const nuevoLibro = this.crearLibro(titulo, autor, genero, isbn);
    this.libros.push(nuevoLibro);
    console.log(`Libro agregado: "${nuevoLibro.titulo}" (ID: ${nuevoLibro.id})`);
  }

  eliminarLibro(id) {
    const index = this.libros.findIndex(libro => libro.id === id);
    if (index === -1) {
      console.log(`No se encontró ningún libro con el ID: ${id}`);
      return null;
    }
    const [libroEliminado] = this.libros.splice(index, 1);
    console.log(`Libro eliminado: "${libroEliminado.titulo}" (ID: ${id})`);
    return libroEliminado;
  }

  prestarLibro(idLibro, nombrePersona, dias = 14) {
    const libro = this.libros.find(l => l.id === idLibro);

    if (!libro) {
      console.log(`El libro con ID ${idLibro} no existe.`);
      return;
    }
    if (!libro.disponible) {
      console.log(`El libro "${libro.titulo}" ya está prestado por ${libro.prestadoA}.`);
      return;
    }

    const fechaPrestamo = new Date();
    const fechaDevolucion = new Date(fechaPrestamo);
    fechaDevolucion.setDate(fechaPrestamo.getDate() + dias);

    libro.disponible = false;
    libro.prestadoA = nombrePersona;
    libro.fechaPrestamo = fechaPrestamo;
    libro.fechaDevolucion = fechaDevolucion;

    this.librosPrestados.set(idLibro, libro);
    console.log(`Libro prestado: "${libro.titulo}" a ${nombrePersona}. Devolver antes de: ${fechaDevolucion.toLocaleDateString()}`);
  }

  devolverLibro(idLibro) {
    const libro = this.libros.find(l => l.id === idLibro);

    if (!libro || libro.disponible) {
      console.log(`El libro con ID ${idLibro} no se encuentra prestado.`);
      return;
    }

    let multa = 0;
    if (libro.fechaDevolucion < new Date()) {
      multa = this.calcularMulta(libro.fechaDevolucion);
      console.log(`Devolución tardía. Multa: $${multa.toFixed(2)}`);
    }

    libro.disponible = true;
    libro.prestadoA = null;
    libro.fechaPrestamo = null;
    libro.fechaDevolucion = null;

    this.librosPrestados.delete(idLibro);

    console.log(`Libro devuelto: "${libro.titulo}".`);
  }

  calcularMulta(fechaDevolucion, tarifa = 0.50) {
    const ahora = new Date();
    const retraso = ahora.getTime() - fechaDevolucion.getTime();
    if (retraso <= 0) return 0;
    const diasRetraso = Math.ceil(retraso / (1000 * 60 * 60 * 24));
    return diasRetraso * tarifa;
  }

  buscarLibros(criterio) {
    const texto = criterio.toLowerCase();
    const resultados = this.libros.filter(libro =>
      libro.titulo.toLowerCase().includes(texto) ||
      libro.autor.toLowerCase().includes(texto) ||
      libro.genero.toLowerCase().includes(texto)
    );
    console.log(`Resultados de la búsqueda (${criterio}):`, resultados);
  }

  obtenerLibrosPorGenero(genero) {
    const generoMinuscula = genero.toLowerCase();
    const resultados = this.libros.filter(libro => libro.genero.toLowerCase() === generoMinuscula);
    console.log(`Libros en el género "${genero}":`, resultados);
  }

  obtenerLibrosVencidos(tarifa = 0.50) {
    const lista = [];
    const ahora = new Date();
    for (const libro of this.librosPrestados.values()) {
      if (libro.fechaDevolucion < ahora) {
        const multa = this.calcularMulta(libro.fechaDevolucion, tarifa);
        lista.push({ ...libro, multa: parseFloat(multa.toFixed(2)) });
      }
    }
    console.log('Libros vencidos:', lista);
  }

  generarReporte() {
    const cantidadPrestados = this.librosPrestados.size;
    const cantidadDisponibles = this.libros.length - cantidadPrestados;
    let totalMultas = 0;
    const vencidos = [];
    const ahora = new Date();

    for (const libro of this.librosPrestados.values()) {
      if (libro.fechaDevolucion < ahora) {
        const multa = this.calcularMulta(libro.fechaDevolucion);
        totalMultas += multa;
        vencidos.push(libro);
      }
    }

    const reporte = {
      totalLibros: this.libros.length,
      librosPrestados: cantidadPrestados,
      librosDisponibles: cantidadDisponibles,
      librosVencidos: vencidos.length,
      multasTotales: parseFloat(totalMultas.toFixed(2)),
    };
    console.log('Reporte de la biblioteca:', reporte);
  }
}

// ---------------- Interfaz por consola ----------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const biblioteca = new SistemaBiblioteca();

function mostrarMenu() {
  console.log(`
----- MENÚ BIBLIOTECA -----
1. Agregar libro
2. Eliminar libro
3. Prestar libro
4. Devolver libro
5. Buscar libros
6. Ver libros por género
7. Ver libros vencidos
8. Generar reporte
9. Salir
---------------------------
  `);

  rl.question('Elige una opción: ', (opcion) => {
    switch (opcion) {
      case '1':
        rl.question('Título: ', (titulo) => {
          rl.question('Autor: ', (autor) => {
            rl.question('Género: ', (genero) => {
              rl.question('ISBN: ', (isbn) => {
                biblioteca.agregarLibro(titulo, autor, genero, isbn);
                mostrarMenu();
              });
            });
          });
        });
        break;
      case '2':
        rl.question('ID del libro a eliminar: ', (id) => {
          biblioteca.eliminarLibro(Number(id));
          mostrarMenu();
        });
        break;
      case '3':
        rl.question('ID del libro a prestar: ', (id) => {
          rl.question('Nombre de la persona: ', (persona) => {
            rl.question('Cantidad de días (por defecto 14): ', (dias) => {
              biblioteca.prestarLibro(Number(id), persona, dias ? Number(dias) : 14);
              mostrarMenu();
            });
          });
        });
        break;
      case '4':
        rl.question('ID del libro a devolver: ', (id) => {
          biblioteca.devolverLibro(Number(id));
          mostrarMenu();
        });
        break;
      case '5':
        rl.question('Criterio de búsqueda: ', (criterio) => {
          biblioteca.buscarLibros(criterio);
          mostrarMenu();
        });
        break;
      case '6':
        rl.question('Género a buscar: ', (genero) => {
          biblioteca.obtenerLibrosPorGenero(genero);
          mostrarMenu();
        });
        break;
      case '7':
        biblioteca.obtenerLibrosVencidos();
        mostrarMenu();
        break;
      case '8':
        biblioteca.generarReporte();
        mostrarMenu();
        break;
      case '9':
        console.log('Saliendo del sistema...');
        rl.close();
        break;
      default:
        console.log('Opción no válida.');
        mostrarMenu();
        break;
    }
  });
}

// Iniciar programa
mostrarMenu();
