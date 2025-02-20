document.addEventListener("DOMContentLoaded", function() {
    // IndexedDB setup
    let db;
    const request = indexedDB.open("HotelDB", 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // Check if stores exist before creating them
        if (!db.objectStoreNames.contains("rooms")) {
            const roomStore = db.createObjectStore("rooms", { keyPath: "id", autoIncrement: true });
            roomStore.createIndex("name", "name", { unique: false });
            
            // Create default rooms
            const defaultRooms = [
                {
                    name: "Gênova - Itália",
                    price: 2950, // ~R$680 (visto) + custo mensal médio convertido 
                    description: "Quarto náutico com elementos em madeira envelhecida e vista simulada para o porto histórico. Gênova lidera rankings por sua internet ultrarrápida (248 Mbps) e política de visto de 12 meses. Inclui estação de trabalho integrada à cabeceira multifuncional.",
                    photos: [
                        "https://images.pexels.com/photos/7245535/pexels-photo-7245535.jpeg", // Porto histórico
                        "https://images.pexels.com/photos/3757144/pexels-photo-3757144.jpeg", // Arquitetura medieval
                        "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg"  // Detalhes em madeira
                    ]
                },
                {
                    name: "Valência - Espanha",
                    price: 2650,
                    description: "Ambiente futurista com revestimentos 3D nas paredes, refletindo a Ciudad de las Artes y las Ciencias. Oferece balcão ergonômico e acesso a comunidade nômade. Destaque para o custo-benefício: 45% mais barato que Barcelona.",
                    photos: [
                        "https://images.pexels.com/photos/2386310/pexels-photo-2386310.jpeg", // Arquitetura moderna
                        "https://images.pexels.com/photos/4356144/pexels-photo-4356144.jpeg"  // Vista urbana
                    ]
                },
                {
                    name: "Lisboa - Portugal",
                    price: 3400,
                    description: "Decoração em estilo 'Japandi' com azulejos portugueses e varanda panorâmica. Lisboa atrai por 300 dias de sol/ano e ecossistema de startups. Inclui iluminação inteligente controlada por voz.",
                    photos: [
                        "https://images.pexels.com/photos/3379049/pexels-photo-3379049.jpeg",
                        "https://images.pexels.com/photos/3747236/pexels-photo-3747236.jpeg",
                        "https://images.pexels.com/photos/3131971/pexels-photo-3131971.jpeg", // Vista do Tejo
                        "https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg"  // Varanda urbana
                    ]
                },
                {
                    name: "Medellín - Colômbia",
                    price: 1850,
                    description: "Jardim vertical integrado e móveis multifuncionais. Reflete a 'Cidade da Eterna Primavera' com clima perfeito e custo 35% menor que EUA. Inclui mesa de trabalho com iluminação natural otimizada.",
                    photos: [
                        "https://images.pexels.com/photos/5128783/pexels-photo-5128783.jpeg", // Arquitetura moderna
                    ]
                },
                {
                    name: "Chiang Mai - Tailândia",
                    price: 1620,
                    description: "Minimalismo budista com espaços zen e proteção antimosquitos. Representa o hub asiático com cafés 24h e custo mensal médio de R$2,8k. Inclui nichos de meditação com revestimento em bambu.",
                    photos: [
                        "https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg", // Templo
                        "https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg",  // Ambiente zen
                        "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg"   // Mercado noturno
                    ]
                },
                {
                    name: "Canggu - Bali",
                    price: 4550,
                    description: "Suíte boutique com piscina privativa e deck externo. Combina surf, vida saudável e coworking tropical. Preço inclui acesso premium a eventos da comunidade global.",
                    photos: [
                        "https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg", // Praia
                        "https://images.pexels.com/photos/2583852/pexels-photo-2583852.jpeg",  // Piscina
                        "https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg",  // Cafés
                        "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg"   // Vida noturna
                    ]
                }
            ];



              defaultRooms.forEach(room => {
                roomStore.add(room);
            });
        }

        if (!db.objectStoreNames.contains("reservations")) {
            const reservationStore = db.createObjectStore("reservations", { keyPath: "id", autoIncrement: true });
            reservationStore.createIndex("clientName", "clientName", { unique: false });
            reservationStore.createIndex("roomId", "roomId", { unique: false });
        }
    };

    // Add a function to check database status
    function checkDatabase() {
        const transaction = db.transaction(["rooms", "reservations"], "readonly");
        
        // Check rooms store
        const roomStore = transaction.objectStore("rooms");
        const roomRequest = roomStore.count();
        roomRequest.onsuccess = function() {
            console.log(`Number of rooms in database: ${roomRequest.result}`);
        };
        
        // Check reservations store
        const reservationStore = transaction.objectStore("reservations");
        const reservationRequest = reservationStore.count();
        reservationRequest.onsuccess = function() {
            console.log(`Number of reservations in database: ${reservationRequest.result}`);
        };
    }

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log("Database version:", db.version);
        console.log("Object stores:", Array.from(db.objectStoreNames));
        checkDatabase();
        loadRooms();
        loadRoomsAdmin();
        loadRoomSelect(); // Now db will be defined
        loadReservations(); // Now db will be defined
        initializeServices(); // Initialize services after db is defined
    };

    // Add better error handling
    request.onerror = function(event) {
        console.error("Database error:", event.target.error);
        console.error("Error code:", event.target.errorCode);
    };

    // Add room
    const addRoomButton = document.getElementById("addRoom");
    if (addRoomButton) {
        addRoomButton.addEventListener("click", function() {
            const roomName = document.getElementById("roomName").value;
            const roomPrice = document.getElementById("roomPrice").value;
            const roomDescription = document.getElementById("roomDescription").value;
            const roomPhotos = Array.from(document.querySelectorAll("#roomPhotoGallery img")).map(img => img.src);

            const transaction = db.transaction(["rooms"], "readwrite");
            const roomStore = transaction.objectStore("rooms");

            const room = {
                name: roomName,
                price: roomPrice,
                description: roomDescription,
                photos: roomPhotos
            };

            roomStore.add(room);

            transaction.oncomplete = function() {
                console.log("Room added successfully");
                loadRooms();
                loadRoomsAdmin();
            };

            transaction.onerror = function(event) {
                console.error("Transaction error: " + event.target.errorCode);
            };
        });
    }

    // Add room photo
    const addRoomPhotoButton = document.getElementById("addRoomPhoto");
    if (addRoomPhotoButton) {
        addRoomPhotoButton.addEventListener("click", function() {
            const photoUrl = document.getElementById("roomPhotoUrl").value;
            const gallery = document.getElementById("roomPhotoGallery");
    
            if (photoUrl) {
                const container = document.createElement("div");
                container.className = "photo-container";
    
                // Preview da imagem
                const img = document.createElement("img");
                img.src = photoUrl;
                img.alt = "Preview do quarto";
                img.style.width = "150px";
                img.style.height = "100px";
                img.style.objectFit = "cover";
    
                // URL da imagem
                const urlText = document.createElement("input");
                urlText.type = "text";
                urlText.value = photoUrl;
                urlText.readOnly = true;
                urlText.className = "photo-url";
    
                // Botão remover
                const removeButton = document.createElement("button");
                removeButton.textContent = "Remover";
                removeButton.className = "btnEditRoom";
                removeButton.onclick = function() {
                    container.remove();
                };
    
                container.appendChild(img);
                container.appendChild(urlText);
                container.appendChild(removeButton);
                gallery.appendChild(container);
    
                // Limpa o campo de input
                document.getElementById("roomPhotoUrl").value = "";
            }
        });
    }

    // Load rooms
    function loadRooms() {
        const transaction = db.transaction(["rooms"], "readonly");
        const roomStore = transaction.objectStore("rooms");
        const request = roomStore.getAll();

        request.onsuccess = function(event) {
            const rooms = event.target.result;
            const roomList = document.getElementById("roomList");
            if (roomList) {
                roomList.innerHTML = "";

                rooms.forEach(room => {
                    const col = document.createElement("div");
                    col.className = "col-12 col-md-6 col-lg-4";
                    
                    col.innerHTML = `
                        <div class="card h-100 shadow-sm">
                            <div class="carousel slide" data-bs-ride="carousel">
                                <div class="carousel-inner">
                                    ${room.photos.map((photo, index) => `
                                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                            <img src="${photo}" class="d-block w-100" alt="${room.name}" 
                                                style="height: 250px; object-fit: cover;">
                                        </div>
                                    `).join('')}
                                </div>
                                ${room.photos.length > 1 ? `
                                    <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${room.id}" data-bs-slide="prev">
                                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">Anterior</span>
                                    </button>
                                    <button class="carousel-control-next" type="button" data-bs-target="#carousel-${room.id}" data-bs-slide="next">
                                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">Próximo</span>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${room.name}</h5>
                                <p class="card-text">${room.description}</p>
                            </div>
                            <div class="card-footer bg-transparent border-top-0">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="h5 mb-0">R$ ${room.price}/noite</span>
                                    <a href="#reservas" class="btn btn-primary">
                                        <i class="fas fa-calendar-check me-2"></i>Reservar
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    roomList.appendChild(col);

                    // Initialize carousel for this room
                    if (room.photos.length > 1) {
                        const carousel = col.querySelector('.carousel');
                        carousel.id = `carousel-${room.id}`;
                        new bootstrap.Carousel(carousel, {
                            interval: 3000
                        });
                    }
                });
            }
        };

        request.onerror = function(event) {
            console.error("Request error: " + event.target.errorCode);
        };
    }

    // Load rooms for admin
    function loadRoomsAdmin() {
        const transaction = db.transaction(["rooms"], "readonly");
        const roomStore = transaction.objectStore("rooms");

        const request = roomStore.getAll();

        request.onsuccess = function(event) {
            const rooms = event.target.result;
            const roomListAdmin = document.getElementById("roomListAdmin");
            if (roomListAdmin) {
                roomListAdmin.innerHTML = "";

                rooms.forEach(room => {
                    const div = document.createElement("div");
                    div.className = "room-item-admin";
                    div.innerHTML = `
                        <h3>${room.name}</h3>
                        <p>Preço: R$${room.price}</p>
                        <p>${room.description}</p>
                        <div class="carousel">
                            <div class="carousel-images" data-index="0">
                                ${room.photos.map(photo => `<img src="${photo}" alt="${room.name}" style="width: 100px; margin: 5px;">`).join('')}
                            </div>
                            <button class="btn btn-secondary prev" onclick="moveSlide(-1, this.closest('.carousel').querySelector('.carousel-images'))">&#10094;</button>
                            <button class="btn btn-secondary next" onclick="moveSlide(1, this.closest('.carousel').querySelector('.carousel-images'))">&#10095;</button>
                        </div>
                        <button class="btn btn-primary btnEditRoom" onclick="editRoom(${room.id})">Editar</button>
                        <button class="btn btn-danger btnEditRoom" onclick="deleteRoom(${room.id})">Excluir</button>
                    `;
                    roomListAdmin.appendChild(div);
                });
            }
        };

        request.onerror = function(event) {
            console.error("Request error: " + event.target.errorCode);
        };
    }

    // Edit room
    window.editRoom = function(roomId) {
        // Get the modal element
        const modalElement = document.getElementById('editRoomModal');
        const modal = new bootstrap.Modal(modalElement);

        modal.show();

        // Add event listener for when modal is hidden
        modalElement.addEventListener('hidden.bs.modal', function () {
            // Remove backdrop manually
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });

        const transaction = db.transaction(["rooms"], "readonly");
        const roomStore = transaction.objectStore("rooms");
        const request = roomStore.get(roomId);

        request.onsuccess = function(event) {
            const room = event.target.result;
            
            // Fill form with room data
            document.getElementById("editRoomName").value = room.name;
            document.getElementById("editRoomPrice").value = room.price;
            document.getElementById("editRoomDescription").value = room.description;
            
            // Clear and populate photo gallery
            const gallery = document.getElementById("editRoomPhotoGallery");
            gallery.innerHTML = "";
            
            room.photos.forEach(photo => {
                const container = document.createElement("div");
                container.className = "photo-container";

                const img = document.createElement("img");
                img.src = photo;
                img.alt = "Preview do quarto";
                img.style.width = "150px";
                img.style.height = "100px";
                img.style.objectFit = "cover";

                const urlText = document.createElement("input");
                urlText.type = "text";
                urlText.value = photo;
                urlText.className = "photo-url";

                const removeButton = document.createElement("button");
                removeButton.textContent = "Remover";
                removeButton.className = "btn btn-danger";
                removeButton.onclick = function() {
                    container.remove();
                };

                container.appendChild(img);
                container.appendChild(urlText);
                container.appendChild(removeButton);
                gallery.appendChild(container);
            });

            // Add event listener to the add photo button
            const addRoomPhotoButton = document.getElementById("editAddRoomPhoto");
            addRoomPhotoButton.onclick = function(event) {
                event.preventDefault(); // Prevent form submission
                const photoUrl = document.getElementById("editRoomPhotoUrl").value;
                if (photoUrl) {
                    const container = document.createElement("div");
                    container.className = "photo-container";

                    const img = document.createElement("img");
                    img.src = photoUrl;
                    img.alt = "Preview do quarto";
                    img.style.width = "150px";
                    img.style.height = "100px";
                    img.style.objectFit = "cover";

                    const urlText = document.createElement("input");
                    urlText.type = "text";
                    urlText.value = photoUrl;
                    urlText.className = "photo-url";

                    const removeButton = document.createElement("button");
                    removeButton.textContent = "Remover";
                    removeButton.className = "btn btn-danger";
                    removeButton.onclick = function() {
                        container.remove();
                    };

                    container.appendChild(img);
                    container.appendChild(urlText);
                    container.appendChild(removeButton);
                    gallery.appendChild(container);

                    // Clear the input field
                    document.getElementById("editRoomPhotoUrl").value = "";
                }
            };

            // Change addRoom button to update mode
            const updateRoomButton = document.getElementById("updateRoom");
            updateRoomButton.onclick = function() {
                const updatedRoom = {
                    id: roomId,
                    name: document.getElementById("editRoomName").value,
                    price: document.getElementById("editRoomPrice").value,
                    description: document.getElementById("editRoomDescription").value,
                    photos: Array.from(document.querySelectorAll("#editRoomPhotoGallery .photo-url")).map(input => input.value)
                };
                updateRoom(updatedRoom, modal);
            };
        };

        request.onerror = function(event) {
            console.error("Request error: " + event.target.errorCode);
        };
    };

    // Update room
    function updateRoom(room, modal) {
        const transaction = db.transaction(["rooms"], "readwrite");
        const roomStore = transaction.objectStore("rooms");

        roomStore.put(room);

        transaction.oncomplete = function() {
            console.log("Room updated successfully");
            loadRooms();
            loadRoomsAdmin();
            // Reset form
            document.getElementById("editRoomName").value = "";
            document.getElementById("editRoomPrice").value = "";
            document.getElementById("editRoomDescription").value = "";
            document.getElementById("editRoomPhotoGallery").innerHTML = "";
            // Hide the modal
            modal.hide();
        };

        transaction.onerror = function(event) {
            console.error("Transaction error: " + event.target.errorCode);
        };
    }

    // Delete room
    window.deleteRoom = function(roomId) {
        const transaction = db.transaction(["rooms"], "readwrite");
        const roomStore = transaction.objectStore("rooms");

        roomStore.delete(roomId);

        transaction.oncomplete = function() {
            console.log("Room deleted successfully");
            loadRooms();
            loadRoomsAdmin();
        };

        transaction.onerror = function(event) {
            console.error("Transaction error: " + event.target.errorCode);
        };
    }

    // Existing code for carousels and services
    function moveSlide(direction, carouselImages) {
        const slides = carouselImages.querySelectorAll('img'); 
        const totalSlides = slides.length;
        let currentSlideIndex = parseInt(carouselImages.getAttribute('data-index')) || 0;

        currentSlideIndex += direction;

        if (currentSlideIndex < 0) {
            currentSlideIndex = totalSlides - 1; 
        } else if (currentSlideIndex >= totalSlides) {
            currentSlideIndex = 0; 
        }

        const slideWidth = slides[0].clientWidth;
        carouselImages.style.transform = `translateX(-${(currentSlideIndex * 100) / totalSlides}%)`;
        carouselImages.setAttribute('data-index', currentSlideIndex);
    }

    document.querySelectorAll('.prev').forEach(button => {
        button.addEventListener('click', function() {
            const carouselImages = this.closest('.carousel').querySelector('.carousel-images');
            moveSlide(-1, carouselImages);
        });
    });

    document.querySelectorAll('.next').forEach(button => {
        button.addEventListener('click', function() {
            const carouselImages = this.closest('.carousel').querySelector('.carousel-images');
            moveSlide(1, carouselImages);
        });
    });

    // Move loadRoomSelect inside DOMContentLoaded and after db is defined
    function loadRoomSelect() {
        if (!db) {
            console.error("Database not initialized");
            return;
        }

        try {
            const transaction = db.transaction(["rooms"], "readonly");
            const roomStore = transaction.objectStore("rooms");
            const request = roomStore.getAll();

            request.onsuccess = function(event) {
                const rooms = event.target.result;
                const roomSelect = document.getElementById("roomSelect");
                if (roomSelect) {
                    roomSelect.innerHTML = '<option value="">Selecione um quarto</option>';
                    rooms.forEach(room => {
                        roomSelect.innerHTML += `
                            <option value="${room.id}">
                                ${room.name} - R$${room.price} - ${room.description}
                            </option>
                        `;
                    });
                }
            };

            request.onerror = function(event) {
                console.error("Error loading rooms:", event.target.error);
            };
        } catch (error) {
            console.error("Error in loadRoomSelect:", error);
        }
    }

    // Add reservation handler
    function handleReservation(event) {
        event.preventDefault();
    
        const clientName = document.getElementById("clientName").value;
        const roomId = parseInt(document.getElementById("roomSelect").value);
        const checkin = document.getElementById("checkin").value;
        const checkout = document.getElementById("checkout").value;
    
        if (!clientName || !roomId || !checkin || !checkout) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
    
        const transaction = db.transaction(["reservations"], "readwrite");
        const reservationStore = transaction.objectStore("reservations");
    
        const reservation = {
            clientName,
            checkin,
            checkout,
            roomId: parseInt(roomId),
            createdAt: new Date().toISOString()
        };
    
        reservationStore.add(reservation);
    
        transaction.oncomplete = function() {
            document.getElementById("reservationForm").reset();
            loadReservations(); // Add this function to update admin view
    
            // Exibir toast de sucesso
            const toastBody = document.getElementById("reservationToastBody");
            toastBody.textContent = "Reserva realizada com sucesso!";
            const toastElement = document.getElementById("reservationToast");
            toastElement.classList.remove("bg-danger");
            toastElement.classList.add("bg-success");
            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        };
    
        transaction.onerror = function(event) {
            // Exibir toast de erro
            const toastBody = document.getElementById("reservationToastBody");
            toastBody.textContent = "Erro ao fazer reserva. Tente novamente.";
            const toastElement = document.getElementById("reservationToast");
            toastElement.classList.remove("bg-success");
            toastElement.classList.add("bg-danger");
            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        };
    }

    // Add this to load reservations in admin panel
    function loadReservations() {
        const transaction = db.transaction(["reservations", "rooms"], "readonly");
        const reservationStore = transaction.objectStore("reservations");
        const roomStore = transaction.objectStore("rooms");
        const request = reservationStore.getAll();
    
        request.onsuccess = function(event) {
            const reservations = event.target.result;
            const reservationsList = document.getElementById("reservasList");
            if (reservationsList) {
                reservationsList.innerHTML = "<h3>Reservas Atuais</h3>";
                
                reservations.forEach(reservation => {
                    const roomRequest = roomStore.get(reservation.roomId);
                    roomRequest.onsuccess = function(event) {
                        const room = event.target.result;
                        const div = document.createElement("div");
                        div.className = "reservation-item";
                        div.innerHTML = `
                            <p><strong>Cliente:</strong> ${reservation.clientName}</p>
                            <p><strong>Quarto:</strong> ${room.name}</p>
                            <p><strong>Check-in:</strong> ${formatDate(reservation.checkin)}</p>
                            <p><strong>Check-out:</strong> ${formatDate(reservation.checkout)}</p>
                            <button class="btnEditRoom" onclick="deleteReservation(${reservation.id})">Cancelar Reserva</button>
                        `;
                        reservationsList.appendChild(div);
                    };
                });
            }
        };
    }

    // Add delete reservation function
    window.deleteReservation = function(reservationId) {
        const transaction = db.transaction(["reservations"], "readwrite");
        const reservationStore = transaction.objectStore("reservations");
        reservationStore.delete(reservationId);

        transaction.oncomplete = function() {
            loadReservations();
        };
    };

    // Load rooms into select when page loads
    loadRoomSelect();

    // Add reservation form handler
    const reservationForm = document.getElementById("reservationForm");
    if (reservationForm) {
        reservationForm.addEventListener("submit", handleReservation);
    }

    // Load reservations in admin panel
    loadReservations();

    // Initialize services section
    function initializeServices() {
        const servicesList = document.querySelector('.services-list');
        const servicePreview = document.getElementById('servicePreview');

        if (servicesList && servicePreview) {
            const firstService = servicesList.querySelector('li');
            if (firstService) {
                servicePreview.src = firstService.dataset.image;
                servicePreview.style.display = 'block';
            }

            servicesList.querySelectorAll('li').forEach(item => {
                item.addEventListener('click', function() {
                    servicePreview.style.opacity = '0';
                    setTimeout(() => {
                        servicePreview.src = this.dataset.image;
                        servicePreview.style.opacity = '1';
                    }, 300);
                });
            });
        }
    }

    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    // Recolher o menu quando uma opção é selecionada
    document.querySelectorAll('.navbar-nav .nav-link').forEach(function(navLink) {
        navLink.addEventListener('click', function() {
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });

    // Recolher o menu quando se clica fora do menu
    document.addEventListener('click', function(event) {
        const isClickInside = navbarCollapse.contains(event.target) || navbarToggler.contains(event.target);
        if (!isClickInside && navbarCollapse.classList.contains('show')) {
            navbarToggler.click();
        }
    });
});

// Função para formatar a data no formato dd/mm/yyyy
function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}