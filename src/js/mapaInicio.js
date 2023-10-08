(function() {
    const lat = document.querySelector('#lat').value ||-38.0061923;
    const lng = document.querySelector('#lng').value ||-57.5424873;
    const mapa = L.map('mapa-inicio').setView([lat, lng ], 14);

    let markers = new L.FeatureGroup().addTo(mapa)

    let propiedades = [];

    // Filtros
    const filtros =  {
        categoria: '',
        precio: ''
    }


    const categoriasSelect = document.querySelector('#categorias')
    const preciosSelect = document.querySelector('#precios')


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);


    // Filtrado de Categorias y Precios

    categoriasSelect.addEventListener('change', e => {
        filtros.categoria = +e.target.value
        filtrarPropiedades()
    })

    preciosSelect.addEventListener('change', e => {
        filtros.precio = +e.target.value
        filtrarPropiedades()
    })
    
    const obtenerPropiedades = async () => {
        try {
            const url = '/api/propiedades'
            const respuesta = await fetch(url)
            propiedades = await respuesta.json()

            mostrarProp(propiedades)

        } catch (error) {
            console.log(error)
        }
    }

    const mostrarProp = propiedades => {

            // Limpiar los markers previos
            markers.clearLayers()

            // clearLayers, es una función que trae en el prototype el marker

        propiedades.forEach(propiedad => {
            // Agregar pin
            const marker = new L.marker([propiedad?.lat, propiedad?.lng], {
                autoPan: true
            })
            .addTo(mapa)
            .bindPopup(`
            <p class="text-blue-600 font-bold">${propiedad.categoria.nombre}</p>
            <h1 class="text-xl font-extrabold uppercase my-2">${propiedad.titulo}</h1>
            <img src="/uploads/${propiedad.imagen}" alt="Imagen de la Propiedad ${propiedad.titulo}">
            <p class="text-blue-600 font-bold">${propiedad.precio.nombre}</p>
            <a href="/propiedades/${propiedad.id}" class="bg-blue-400 block p-2 text-black text-center font-bold uppercase">Ver Propiedad</a>
            `)
        markers.addLayer(marker)
        })
    }

    const filtrarPropiedades = () => {
        const resultado = propiedades.filter(filtrarCategoria).filter(filtrarPrecio)
        mostrarProp(resultado)
    }


    const filtrarCategoria = propiedad => filtros.categoria ? propiedad.categoriaID === filtros.categoria : propiedad

    const filtrarPrecio = propiedad => filtros.precio ? propiedad.precioID === filtros.precio : propiedad
    

    obtenerPropiedades()

})()