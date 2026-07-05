// CONFIGURACIÓN COMERCIAL
const TELEFONO_REPARTO = "56xxxxx"; // Escribe aquí tu número real con código de país

let productosData = [];

// Captura de elementos de la interfaz (DOM)
const container = document.getElementById('productsContainer');
const searchInput = document.getElementById('searchInput');
const productForm = document.getElementById('productForm');
const prodName = document.getElementById('prodName');
const prodDesc = document.getElementById('prodDesc');
const prodPrice = document.getElementById('prodPrice');
const prodImg = document.getElementById('prodImg');
const editIndexInput = document.getElementById('editIndex');
const submitFormBtn = document.getElementById('submitFormBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const jsonTextarea = document.getElementById('jsonTextarea');

// Sincronizar el botón superior de consultas de WhatsApp si existe en la página
const mainWhatsapp = document.getElementById('mainWhatsapp');
if (mainWhatsapp) {
    mainWhatsapp.href = `https://wa.me/${TELEFONO_REPARTO}?text=Hola!%20Quiero%20hacer%20un%20pedido%20de%20gas%20a%20domicilio.`;
}

// 1. LEER ARCHIVO: Carga los datos desde productos.json
async function iniciarBaseDeDatos() {
    try {
        const respuesta = await fetch('productos.json');
        if (!respuesta.ok) {
            throw new Error(`Error al cargar el archivo: ${respuesta.status}`);
        }
        productosData = await respuesta.json();
        renderProducts();
    } catch (error) {
        console.error("Aviso: Cargando base de datos de respaldo en memoria debido a entorno local sin servidor o archivo ausente.", error);
        productosData = [
            { "id": 1, "nombre": "Cilindro Gas 5 Kg", "descripcion": "Modo Local: Ideal para camping.", "precio": "$11.500", "imagen": "imagenes/gas-5kg.jpg" },
            { "id": 2, "nombre": "Cilindro Gas 11 Kg", "descripcion": "Modo Local: Uso de cocina.", "precio": "$19.800", "imagen": "imagenes/gas-11kg.jpg" }
        ];
        renderProducts();
    }
}

// 2. DIBUJAR PÁGINA: Renderiza las tarjetas de gas
function renderProducts(filterText = "") {
    if (!container) return; // Si la página actual no muestra productos, salimos de la función
    
    container.innerHTML = "";
    
    const filtered = productosData.filter(p => 
        p.nombre.toLowerCase().includes(filterText.toLowerCase()) || 
        p.descripcion.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 3rem; color: #64748b; background: white; border-radius:12px; font-weight:500;">No encontramos el formato de gas que buscas. Intenta otra medida.</div>`;
        if (jsonTextarea) jsonTextarea.value = JSON.stringify(productosData, null, 4);
        return;
    }

    filtered.forEach((producto) => {
        const mensajeWhatsApp = `¡Hola Express! Me interesa solicitar el reparto a domicilio de: "${producto.nombre}" que vi en la web con precio de ${producto.precio}.`;
        const linkWhatsApp = `https://wa.me/${TELEFONO_REPARTO}?text=${encodeURIComponent(mensajeWhatsApp)}`;
        const realIndex = productosData.findIndex(p => p.id === producto.id);

        // CORRECCIÓN 1: Los botones de editar/borrar solo se generan si estamos en la vista de administración (admin.html)
        let adminButtonsHTML = "";
        if (productForm) {
            adminButtonsHTML = `
                <div class="admin-actions-block" style="float: right;">
                    <button class="btn-admin btn-secondary" style="padding:4px 8px; font-size:0.75rem; margin:0;" onclick="startEdit(${realIndex})">✏️ Editar Precio</button>
                    <button class="btn-admin" style="padding:4px 8px; font-size:0.75rem; margin:0; background-color:#ef4444;" onclick="deleteProduct(${realIndex})">🗑️ Borrar</button>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'product-card clearfix';
        card.innerHTML = `
            ${adminButtonsHTML}
            <img src="${producto.imagen}" alt="${producto.nombre}" class="product-img" onerror="this.src='https://via.placeholder.com/100?text=Sin+Foto'">
            <h3 class="product-header">${producto.nombre}</h3>
            <p class="product-desc">${producto.descripcion}</p>
            <div class="product-footer">
                <span class="product-price">${producto.precio}</span>
                <a href="${linkWhatsApp}" target="_blank" class="btn-buy">Pedir Balón 🚚</a>
            </div>
        `;
        container.appendChild(card);
    });

    if (jsonTextarea) {
        jsonTextarea.value = JSON.stringify(productosData, null, 4);
    }
}

// 3. EVENTO BUSCADOR
if (searchInput) {
    searchInput.addEventListener('input', (e) => renderProducts(e.target.value));
}

// 4. EVENTO FORMULARIO (SÓLO ADMIN)
if (productForm) {
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = parseInt(editIndexInput.value);

        if (index === -1) {
            productosData.push({
                id: Date.now(),
                nombre: prodName.value,
                descripcion: prodDesc.value,
                precio: prodPrice.value,
                imagen: prodImg.value
            });
        } else {
            productosData[index].nombre = prodName.value;
            productosData[index].descripcion = prodDesc.value;
            productosData[index].precio = prodPrice.value;
            productosData[index].imagen = prodImg.value;
            
            editIndexInput.value = "-1";
            submitFormBtn.innerText = "Guardar en Catálogo";
            if (cancelEditBtn) cancelEditBtn.style.display = "none";
        }
        
        productForm.reset();
        renderProducts();
    });
}

// 5. PASAR DATOS AL FORMULARIO PARA EDITAR
window.startEdit = function(index) {
    if (!productForm) return;
    const prod = productosData[index];
    prodName.value = prod.nombre;
    prodDesc.value = prod.descripcion;
    prodPrice.value = prod.precio;
    prodImg.value = prod.imagen;
    
    editIndexInput.value = index;
    submitFormBtn.innerText = "Actualizar Cilindro";
    if (cancelEditBtn) cancelEditBtn.style.display = "inline-block";
    prodPrice.focus();
};

if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
        productForm.reset();
        editIndexInput.value = "-1";
        submitFormBtn.innerText = "Guardar en Catálogo";
        cancelEditBtn.style.display = "none";
    });
}

window.deleteProduct = function(index) {
    if (confirm("¿Estás seguro de que deseas eliminar este formato del catálogo JSON?")) {
        productosData.splice(index, 1);
        renderProducts();
    }
};

// CORRECCIÓN 3: API moderna para copiar al portapapeles sin usar execCommand obsoleto
window.copyJSON = function() {
    if (!jsonTextarea) return;
    navigator.clipboard.writeText(jsonTextarea.value)
        .then(() => {
            alert("¡Código JSON copiado! Puedes pegarlo dentro de tu archivo productos.json real.");
        })
        .catch(err => {
            console.error("Error al copiar código: ", err);
        });
};

window.downloadJSON = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(productosData, null, 4));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "productos.json");
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
};

// CORRECCIÓN 2: Ejecución controlada cuando el DOM esté listo (Prioridad de carga de Googlebot)
document.addEventListener("DOMContentLoaded", iniciarBaseDeDatos);

