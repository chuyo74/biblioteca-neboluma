// ==========================================================================
// 1. SELECCIÓN DE ELEMENTOS DEL DOM
// ==========================================================================
const contenedorLibros = document.getElementById('seccion-libros');
const selectCategoria = document.getElementById('filtrar-categoria');
const selectIdioma = document.getElementById('filtro-idioma');
const inputBuscar = document.getElementById('buscar-texto');
const contadorLibros = document.getElementById('contador-libros');
const btnCargarMas = document.getElementById('btn-cargar-mas');
const selectOrden = document.getElementById('filtro-orden');

// Variables de estado para paginación y datos
const LIBROS_POR_PAGINA = 25;            // Cantidad de tarjetas por tanda
let librosVisibles = LIBROS_POR_PAGINA;  // Control acumulativo
let coleccionLibros = [];                // Colección global en memoria

// ==========================================================================
// 2. FUNCIÓN ASÍNCRONA PARA CARGAR LOS DATOS DESDE LIBROS.JSON
// ==========================================================================
async function cargarLibros() {
    try {
        const respuesta = await fetch('libros.json');
        
        if (!respuesta.ok) {
            throw new Error(`Error al obtener los datos. Estado HTTP: ${respuesta.status}`);
        }

        coleccionLibros = await respuesta.json();
        coleccionLibros.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }));

        // Poblamos los desplegables de forma dinámica
        poblarCategorias(coleccionLibros);
        poblarIdiomas(coleccionLibros);

        // Ejecutamos filtrarLibros para aplicar la primera tanda de 20 tarjetas y el contador
        filtrarLibros(); 

    } catch (error) {
        console.error('Error al cargar la colección de libros:', error);
        contenedorLibros.innerHTML = '<p>Error al cargar el catálogo de libros.</p>';
    }
}

// ==========================================================================
// 3. FUNCIÓN PARA MOSTRAR / RENDERIZAR LAS TARJETAS EN PANTALLA
// ==========================================================================
function renderizarLibros(lista) {
    // Limpiamos el contenedor previo
    contenedorLibros.innerHTML = '';

    // Manejo del estado vacío cuando no hay coincidencias
    if (lista.length === 0) {
        contenedorLibros.innerHTML = `
            <div class="mensaje-vacio">
                <p>🔍 No se encontraron libros que coincidan con su búsqueda.</p>
            </div>
        `;
        return;
    }

    // Recorremos el arreglo de libros y generamos el HTML para cada tarjeta
    lista.forEach(libro => {
        const tarjeta = document.createElement('article');
        tarjeta.classList.add('tarjeta-libro');

        const ubicacionTexto = libro.ubicacion || 'No especificada';
        const idiomaTexto = libro.idioma || 'No especificado';
        const anoTexto = libro.ano || libro.anio || 'No especificado';
        const sinopsisTexto = libro.sinopsis || 'Sin sinopsis disponible para este libro.';

        tarjeta.innerHTML = `
            <div class="tarjeta-interior">
                <!-- CARA FRONTAL -->
                <div class="tarjeta-frente">
                    <div class="tarjeta-cuerpo">
                        <h3>${libro.titulo}</h3>
                        <p class="autor-texto"><strong>Autor:</strong> ${libro.autor}</p>
                        <p><strong>Año:</strong> ${anoTexto}</p>
                        <p><strong>Idioma:</strong> <span class="idioma-badge">${idiomaTexto}</span></p>
                        <p><strong>Ubicación:</strong> <span class="ubicacion-info">${ubicacionTexto}</span></p>
                    </div>
                    
                    <div class="tarjeta-pie">
                        <span class="categoria-badge">${libro.categoria}</span>
                    </div>

                    <span class="indicador-girar">🔄 Sinopsis</span>
                </div>

                <!-- CARA TRASERA (Sinopsis) -->
                <div class="tarjeta-dorso">
                    <h3 class="titulo-dorso">${libro.titulo}</h3>
                    <h4>📖 Sinopsis</h4>
                    <p class="sinopsis-texto">${sinopsisTexto}</p>
                    <span class="indicador-girar">🔄 Volver</span>
                </div>
            </div>
        `;

        // Evento para activar la rotación 3D al hacer clic
        tarjeta.addEventListener('click', () => {
            tarjeta.classList.toggle('volteada');
        });

        contenedorLibros.appendChild(tarjeta);
    });
}

// ==========================================================================
// 4. FUNCIONES PARA LLENAR LOS DESPLEGABLES DINÁMICAMENTE
// ==========================================================================
function poblarCategorias(libros) {
    const todasLasCategorias = libros.map(libro => libro.categoria);
    const conjuntoSinDuplicados = new Set(todasLasCategorias);
    const categoriasUnicas = Array.from(conjuntoSinDuplicados);

    categoriasUnicas.sort((a, b) => a.localeCompare(b, 'es'));

    // Reiniciamos el menú asegurando la opción por defecto
    selectCategoria.innerHTML = '<option value="todas">Todas las categorías</option>';

    categoriasUnicas.forEach(categoria => {
        const opcion = document.createElement('option');
        opcion.value = categoria;
        opcion.textContent = categoria;
        selectCategoria.appendChild(opcion);
    });
}

function poblarIdiomas(libros) {
    const idiomasUnicos = [...new Set(libros.map(libro => libro.idioma).filter(Boolean))];
    idiomasUnicos.sort((a, b) => a.localeCompare(b, 'es'));

    selectIdioma.innerHTML = '<option value="todos">Todos los idiomas</option>';

    idiomasUnicos.forEach(idioma => {
        const opcion = document.createElement('option');
        opcion.value = idioma;
        opcion.textContent = idioma;
        selectIdioma.appendChild(opcion);
    });
}

// ==========================================================================
// 5. FUNCIÓN PRINCIPAL DE FILTRADO COMBINADO Y CARGA PROGRESIVA
// ==========================================================================
function filtrarLibros() {
    // 1. Obtener y limpiar valores ingresados
    const textoBusqueda = inputBuscar.value.toLowerCase().trim();
    const categoriaSeleccionada = selectCategoria.value;
    const idiomaSeleccionado = selectIdioma.value;
    const criterioOrden = selectOrden.value;

    // 2. Filtrar la colección completa
    const librosFiltrados = coleccionLibros.filter(libro => {
        const tituloEnMinusculas = libro.titulo.toLowerCase();
        const autorEnMinusculas = libro.autor.toLowerCase();

        const coincideTexto = tituloEnMinusculas.includes(textoBusqueda) ||
                              autorEnMinusculas.includes(textoBusqueda);
        const coincideCategoria = (categoriaSeleccionada === 'todas') || 
                                  (libro.categoria === categoriaSeleccionada);
        const coincideIdioma = (idiomaSeleccionado === 'todos') || 
                               (libro.idioma === idiomaSeleccionado);

        return coincideTexto && coincideCategoria && coincideIdioma;
    });

    // 2. APLICAR ORDENAMIENTO DINÁMICO
    librosFiltrados.sort((a, b) => {
        // Convertimos a número el año (usando 0 si no estuviera especificado)
        const anoA = Number(a.ano || a.anio) || 0;
        const anoB = Number(b.ano || b.anio) || 0;

        if (criterioOrden === 'ano-desc') {
            return anoB - anoA; // Del más reciente al más antiguo
        } else if (criterioOrden === 'ano-asc') {
            return anoA - anoB; // Del más antiguo al más reciente
        } else if (criterioOrden === 'autor-asc') {
            // Orden alfabético directo por la nueva propiedad 'apellido'
            const apellidoA = a.apellido || a.autor;
            const apellidoB = b.apellido || b.autor;
            return apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' });
        }
        else {
            // 'titulo-asc' por defecto: Orden alfabético
        const tituloA = limpiarTituloParaOrden(a.titulo);
        const tituloB = limpiarTituloParaOrden(b.titulo);
        return tituloA.localeCompare(tituloB, 'es', { sensitivity: 'base' });
        }
    });

    // 3. ACTUALIZACIÓN DEL CONTADOR DINÁMICO DE RESULTADOS
    const totalFiltrados = librosFiltrados.length;
    const cantidadMostrada = Math.min(librosVisibles, totalFiltrados);

    // Obtenemos el número de categorías únicas presentes en la selección actual
    const numCategorias = new Set(librosFiltrados.map(libro => libro.categoria)).size;


    if (totalFiltrados === 0) {
        contadorLibros.textContent = 'No se encontraron libros que coincidan con la búsqueda';
    } else {
        // "Mostrando 20 de XXX libros" (donde XXX es la cantidad que cumple con los filtros)
        const textoCategoria = numCategorias === 1 ? 'categoría' : 'categorías';
        contadorLibros.textContent = `Mostrando ${cantidadMostrada} de ${totalFiltrados} libros en ${numCategorias} ${textoCategoria}`;
    }

    // 4. Recorte progresivo y renderizado
    const tandaVisibles = librosFiltrados.slice(0, librosVisibles);
    renderizarLibros(tandaVisibles);

    // 5. Ocultar o mostrar el botón "Cargar más"
    if (librosVisibles < totalFiltrados) {
        btnCargarMas.style.display = 'inline-block';
    } else {
        btnCargarMas.style.display = 'none';
    }
}

// Resetea el conteo visible a 20 al cambiar cualquier filtro
function manejarCambioDeFiltro() {
    librosVisibles = LIBROS_POR_PAGINA;
    filtrarLibros();
}

// ==========================================================================
// FUNCIÓN AUXILIAR PARA IGNOAR SIGNOS EN EL ORDENAMIENTO ALFABÉTICO
// ==========================================================================
function limpiarTituloParaOrden(titulo) {
    if (!titulo) return '';
    // Elimina comillas (simples/dobles/tipográficas) y signos de admiración/interrogación
    return titulo.replace(/["'“”«»¡!¿?]/g, '').trim();
}

// ==========================================================================
// OPTIMIZACIÓN DE RENDIMIENTO: DESACTIVAR HOVER DURANTE SCROLL
// ==========================================================================
let temporizadorScroll;

window.addEventListener('scroll', () => {
    // Si el usuario empieza a hacer scroll, agregamos la clase que deshabilita el hover
    if (!document.body.classList.contains('desactivar-hover')) {
        document.body.classList.add('desactivar-hover');
    }

    // Reiniciamos el temporizador
    clearTimeout(temporizadorScroll);

    // Cuando el usuario detiene el scroll por 150ms, reactivamos las interacciones del ratón
    temporizadorScroll = setTimeout(() => {
        document.body.classList.remove('desactivar-hover');
    }, 150);
}, { passive: true }); // { passive: true } le indica al navegador que el evento no bloqueará el hilo principal


// ==========================================================================
// 6. ASIGNACIÓN DE ESCUCHADORES DE EVENTOS
// ==========================================================================
inputBuscar.addEventListener('input', manejarCambioDeFiltro);
selectCategoria.addEventListener('change', manejarCambioDeFiltro);
selectIdioma.addEventListener('change', manejarCambioDeFiltro);
selectOrden.addEventListener('change', manejarCambioDeFiltro);

btnCargarMas.addEventListener('click', () => {
    librosVisibles += LIBROS_POR_PAGINA; // Suma 20 tarjetas más por clic
    filtrarLibros();
});

// Inicializamos la carga al abrir la aplicación
cargarLibros();

