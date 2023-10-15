(function() {
    const cambiarEstadoBotones = document.querySelectorAll('.cambiar-estado')
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

    cambiarEstadoBotones.forEach(boton => {
        boton.addEventListener('click', cambiarEstadoPropiedad)
    })

    async function cambiarEstadoPropiedad(e) {
        const {propiedadId: id} = e.target.dataset

        const url = `/propiedades/${id}`

        try {
            const respuesta = await fetch(url, {
                method: 'PUT',
                headers: {
                    'CSRF-Token': token
                }
            })
    
            const resultado = await respuesta.json()

            console.log(e.target)

            if(resultado) {
                if(e.target.classList.contains('bg-gray-100')) {
                    e.target.classList.add('bg-green-100', 'text-green-800')
                    e.target.classList.remove('bg-gray-100', 'text-red-800')
                    e.target.textContent = 'Publicado'
                } else {
                    e.target.classList.add('bg-gray-100', 'text-red-800')
                    e.target.classList.remove('bg-green-100', 'text-green-800')
                    e.target.textContent = 'No Publicado'
                }
            }

        } catch (error) {
            console.log(error)
        }
        
    }
})()