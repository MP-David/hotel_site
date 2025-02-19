document.addEventListener("DOMContentLoaded", function() {
    let db;
    const request = indexedDB.open("HotelDB", 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("rooms")) {
            const roomStore = db.createObjectStore("rooms", { keyPath: "id", autoIncrement: true });
            roomStore.createIndex("name", "name", { unique: false });
        }
        if (!db.objectStoreNames.contains("reservations")) {
            const reservationStore = db.createObjectStore("reservations", { keyPath: "id", autoIncrement: true });
            reservationStore.createIndex("clientName", "clientName", { unique: false });
            reservationStore.createIndex("roomId", "roomId", { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log("Database initialized successfully");
        initializeApplication();
    };

    request.onerror = function(event) {
        console.error("Database error:", event.target.error);
    };

    // Move all initialization into a single function
    function initializeApplication() {
        // Initialize services
        initializeServices();
        
        // Load all data
        loadRooms();
        loadRoomsAdmin();
        loadRoomSelect();
        loadReservations();
        
        // Set up event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        const reservationForm = document.getElementById("reservationForm");
        if (reservationForm) {
            reservationForm.addEventListener("submit", handleReservation);
        }

        const addRoomButton = document.getElementById("addRoom");
        if (addRoomButton) {
            addRoomButton.onclick = handleAddRoom;
        }

        const addRoomPhotoButton = document.getElementById("addRoomPhoto");
        if (addRoomPhotoButton) {
            addRoomPhotoButton.onclick = handleAddRoomPhoto;
        }

        // Add navigation setup here
        setupAdminNavigation();
    }

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

    function loadReservations() {
        if (!db) {
            console.error("Database not initialized");
            return;
        }

        try {
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
                                <p><strong>Check-in:</strong> ${new Date(reservation.checkin).toLocaleDateString()}</p>
                                <p><strong>Check-out:</strong> ${new Date(reservation.checkout).toLocaleDateString()}</p>
                                <button class="bntEstilo" onclick="deleteReservation(${reservation.id})">Cancelar Reserva</button>
                            `;
                            reservationsList.appendChild(div);
                        };
                    });
                }
            };
        } catch (error) {
            console.error("Error in loadReservations:", error);
        }
    }

    // Define the room addition function
    function handleAddRoom(event) {
        event.preventDefault(); // Prevent default form submission behavior

        const roomName = document.getElementById("roomName").value;
        const roomPrice = document.getElementById("roomPrice").value;
        const roomDescription = document.getElementById("roomDescription").value;
        // Collect photo URLs from each input added in the photo gallery
        const roomPhotos = Array.from(document.querySelectorAll("#roomPhotoGallery .photo-url"))
                              .map(input => input.value);

        if (!roomName || !roomPrice || !roomDescription) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        const transaction = db.transaction(["rooms"], "readwrite");
        const roomStore = transaction.objectStore("rooms");

        const room = {
            name: roomName,
            price: parseFloat(roomPrice),
            description: roomDescription,
            photos: roomPhotos
        };

        roomStore.add(room);

        transaction.oncomplete = function() {
            console.log("Room added successfully");
            loadRooms();
            loadRoomsAdmin();
            // Clear form fields
            document.getElementById("roomContainer").reset();
            document.getElementById("roomPhotoGallery").innerHTML = "";
        };

        transaction.onerror = function(event) {
            console.error("Transaction error:" + event.target.errorCode);
        };
    }

    // Define the Add Room Photo function
    function handleAddRoomPhoto(event) {
        event.preventDefault(); // Prevent form submission when clicking the button

        const photoUrl = document.getElementById("roomPhotoUrl").value;
        const gallery = document.getElementById("roomPhotoGallery");

        if (photoUrl) {
            const container = document.createElement("div");
            container.className = "photo-container";

            // Create an image preview element
            const img = document.createElement("img");
            img.src = photoUrl;
            img.alt = "Preview do quarto";
            img.style.width = "150px";
            img.style.height = "100px";
            img.style.objectFit = "cover";

            // Create an input to hold the URL text so it can be edited later
            const urlText = document.createElement("input");
            urlText.type = "text";
            urlText.value = photoUrl;
            urlText.className = "photo-url form-control";

            // Create remove button
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remover";
            removeButton.className = "btn btn-danger";
            removeButton.onclick = function() {
                container.remove();
            };

            // Append elements
            container.appendChild(img);
            container.appendChild(urlText);
            container.appendChild(removeButton);
            gallery.appendChild(container);

            // Clean the photo URL input
            document.getElementById("roomPhotoUrl").value = "";
        }
    }

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
    function handleAddRoomPhoto() {
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
            urlText.className = "photo-url";

            // Botão remover
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remover";
            removeButton.className = "bntEstilo";
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
    }

    // Update the loadRooms function
    function loadRooms() {
        if (!db) {
            console.error("Database not initialized");
            return;
        }

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
            console.error("Error loading rooms:", event.target.error);
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
                            <button class="prev" onclick="moveSlide(-1, this.closest('.carousel').querySelector('.carousel-images'))">&#10094;</button>
                            <button class="next" onclick="moveSlide(1, this.closest('.carousel').querySelector('.carousel-images'))">&#10095;</button>
                        </div>
                        <button class="bntEstilo" onclick="editRoom(${room.id})">Editar</button>
                        <button class="bntEstilo" onclick="deleteRoom(${room.id})">Excluir</button>
                    `;
                    roomListAdmin.appendChild(div);
                });
            }
        };

        request.onerror = function(event) {
            console.error("Request error: " + event.target.errorCode);
        };
    }

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
                removeButton.className = "bntEstilo";
                removeButton.onclick = function() {
                    container.remove();
                };

                container.appendChild(img);
                container.appendChild(urlText);
                container.appendChild(removeButton);
                gallery.appendChild(container);
            });

            // Add photo button functionality
            const editAddPhotoButton = document.getElementById("editAddRoomPhoto");
            editAddPhotoButton.onclick = function() {
                const photoUrl = document.getElementById("editRoomPhotoUrl").value;
                if (photoUrl) {
                    addPhotoToGallery(photoUrl, "editRoomPhotoGallery");
                    document.getElementById("editRoomPhotoUrl").value = "";
                }
            };

            // Update button functionality
            const updateButton = document.getElementById("updateRoom");
            updateButton.onclick = function() {
                const updatedRoom = {
                    id: roomId,
                    name: document.getElementById("editRoomName").value,
                    price: parseFloat(document.getElementById("editRoomPrice").value),
                    description: document.getElementById("editRoomDescription").value,
                    photos: Array.from(document.querySelectorAll("#editRoomPhotoGallery .photo-url"))
                        .map(input => input.value)
                };

                const updateTransaction = db.transaction(["rooms"], "readwrite");
                const updateStore = updateTransaction.objectStore("rooms");
                
                const updateRequest = updateStore.put(updatedRoom);

                updateRequest.onsuccess = function() {
                    console.log("Room updated successfully");
                    modal.hide();
                    // Clean up modal backdrop
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                    document.body.classList.remove('modal-open');
                    loadRooms();
                    loadRoomsAdmin();
                };

                updateRequest.onerror = function(event) {
                    console.error("Error updating room:", event.target.error);
                };
            };
        };
    };

    // Helper function to add photos to gallery
    function addPhotoToGallery(photoUrl, galleryId) {
        const gallery = document.getElementById(galleryId);
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
        removeButton.className = "bntEstilo";
        removeButton.onclick = function() {
            container.remove();
        };

        container.appendChild(img);
        container.appendChild(urlText);
        container.appendChild(removeButton);
        gallery.appendChild(container);
    }

    // Update room
    function updateRoom(roomId) {
        const roomName = document.getElementById("roomName").value;
        const roomPrice = document.getElementById("roomPrice").value;
        const roomDescription = document.getElementById("roomDescription").value;
        // Get URLs from the editable inputs instead of img sources
        const roomPhotos = Array.from(document.querySelectorAll("#roomPhotoGallery .photo-url")).map(input => input.value);

        const transaction = db.transaction(["rooms"], "readwrite");
        const roomStore = transaction.objectStore("rooms");

        const room = {
            id: roomId,
            name: roomName,
            price: roomPrice,
            description: roomDescription,
            photos: roomPhotos
        };

        roomStore.put(room);

        transaction.oncomplete = function() {
            console.log("Room updated successfully");
            loadRooms();
            loadRoomsAdmin();
            // Reset form
            document.getElementById("roomName").value = "";
            document.getElementById("roomPrice").value = "";
            document.getElementById("roomDescription").value = "";
            document.getElementById("roomPhotoGallery").innerHTML = "";
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
        carouselImages.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;
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
            clientName: clientName,
            roomId: roomId,
            checkin: checkin,
            checkout: checkout
        };

        reservationStore.add(reservation);

        transaction.oncomplete = function() {
            console.log("Reservation added successfully");
            showReservationMessage("Reserva realizada com sucesso!", "success");
            loadReservations();
            document.getElementById("reservationForm").reset();
        };

        transaction.onerror = function(event) {
            console.error("Transaction error:", event.target.errorCode);
            showReservationMessage("Erro ao realizar a reserva. Tente novamente.", "danger");
        };
    }

    function showReservationMessage(message, type) {
        const reservationMessage = document.getElementById("reservationMessage");
        reservationMessage.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
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

    // Add this inside your DOMContentLoaded event listener
    function initializeServices() {
        const servicesList = document.querySelector('.services-list');
        const servicePreview = document.getElementById('servicePreview');

        if (servicesList && servicePreview) {
            // Show first service image by default
            const firstService = servicesList.querySelector('li');
            if (firstService) {
                servicePreview.src = firstService.dataset.image;
                servicePreview.style.display = 'block';
            }

            // Add click handlers to all service items
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

    // Call the function after your existing initialization code
    initializeServices();
});