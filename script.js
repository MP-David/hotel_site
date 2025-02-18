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
                    name: "Quarto Standard",
                    price: 150,
                    description: "Um quarto confortável e acessível.",
                    photos: [
                        "https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg?auto=compress&cs=tinysrgb&w=1200",
                        "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200"
                    ]
                },
                {
                    name: "Quarto Familiar",
                    price: 200,
                    description: "Ideal para famílias, com espaço extra.",
                    photos: [
                        "https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=1200",
                        "https://images.pexels.com/photos/2029731/pexels-photo-2029731.jpeg?auto=compress&cs=tinysrgb&w=1200"
                    ]
                },
                {
                    name: "Quarto Luxo",
                    price: 400,
                    description: "Luxo e conforto para uma estadia inesquecível.",
                    photos: [
                        "https://images.pexels.com/photos/2417842/pexels-photo-2417842.jpeg?auto=compress&cs=tinysrgb&w=1200",
                        "https://images.pexels.com/photos/2417856/pexels-photo-2417856.jpeg?auto=compress&cs=tinysrgb&w=1200"
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
        loadReservations();
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
                    const li = document.createElement("li");
                    li.className = "room-item";
                    li.innerHTML = `
                        <h3>${room.name}</h3>
                        <div class="carousel">
                            <div class="carousel-images" data-index="0" style="width: ${room.photos.length * 100}%">
                                ${room.photos.map(photo => `
                                    <img src="${photo}" 
                                         alt="${room.name}" 
                                         style="width: ${100 / room.photos.length}%"
                                    >
                                `).join('')}
                            </div>
                            <button class="prev" onclick="moveSlide(-1, this.closest('.carousel').querySelector('.carousel-images'))">&#10094;</button>
                            <button class="next" onclick="moveSlide(1, this.closest('.carousel').querySelector('.carousel-images'))">&#10095;</button>
                        </div>
                        <p>${room.description}</p>
                        <p>Valores a partir de R$${room.price}</p>
                    `;
                    roomList.appendChild(li);
                });

                // Initialize slide functionality
                window.moveSlide = function(direction, carouselImages) {
                    const slides = carouselImages.querySelectorAll('img');
                    const totalSlides = slides.length;
                    let currentSlideIndex = parseInt(carouselImages.getAttribute('data-index')) || 0;

                    currentSlideIndex += direction;

                    if (currentSlideIndex < 0) {
                        currentSlideIndex = totalSlides - 1;
                    } else if (currentSlideIndex >= totalSlides) {
                        currentSlideIndex = 0;
                    }

                    carouselImages.style.transform = `translateX(-${(currentSlideIndex * 100) / totalSlides}%)`;
                    carouselImages.setAttribute('data-index', currentSlideIndex);
                };
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

    // Edit room
    window.editRoom = function(roomId) {
        const transaction = db.transaction(["rooms"], "readonly");
        const roomStore = transaction.objectStore("rooms");
        const request = roomStore.get(roomId);

        request.onsuccess = function(event) {
            const room = event.target.result;
            document.getElementById("roomName").value = room.name;
            document.getElementById("roomPrice").value = room.price;
            document.getElementById("roomDescription").value = room.description;
            
            // Clear and populate photo gallery with editable containers
            const gallery = document.getElementById("roomPhotoGallery");
            gallery.innerHTML = "";
            
            room.photos.forEach(photo => {
                const container = document.createElement("div");
                container.className = "photo-container";

                // Preview da imagem
                const img = document.createElement("img");
                img.src = photo;
                img.alt = "Preview do quarto";
                img.style.width = "150px";
                img.style.height = "100px";
                img.style.objectFit = "cover";

                // URL da imagem editável
                const urlText = document.createElement("input");
                urlText.type = "text";
                urlText.value = photo;
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
            });

            // Change addRoom button to update mode
            const addRoomButton = document.getElementById("addRoom");
            addRoomButton.textContent = "Atualizar Quarto";
            addRoomButton.onclick = function() {
                updateRoom(roomId);
                // Reset button after update
                addRoomButton.textContent = "Adicionar Quarto";
                addRoomButton.onclick = function() {
                    const room = {
                        name: document.getElementById("roomName").value,
                        price: document.getElementById("roomPrice").value,
                        description: document.getElementById("roomDescription").value,
                        photos: Array.from(document.querySelectorAll("#roomPhotoGallery .photo-url")).map(input => input.value)
                    };
                    addRoom(room);
                };
            };
        };

        request.onerror = function(event) {
            console.error("Request error: " + event.target.errorCode);
        };
    };

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
        const checkin = document.getElementById("checkin").value;
        const checkout = document.getElementById("checkout").value;
        const roomId = document.getElementById("roomSelect").value;

        if (!clientName || !checkin || !checkout || !roomId) {
            document.getElementById("reservationMessage").innerHTML = 
                '<p style="color: red;">Por favor, preencha todos os campos</p>';
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
            document.getElementById("reservationMessage").innerHTML = 
                '<p style="color: green;">Reserva realizada com sucesso!</p>';
            document.getElementById("reservationForm").reset();
            loadReservations(); // Add this function to update admin view
        };

        transaction.onerror = function(event) {
            document.getElementById("reservationMessage").innerHTML = 
                '<p style="color: red;">Erro ao fazer reserva. Tente novamente.</p>';
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
                            <p><strong>Check-in:</strong> ${new Date(reservation.checkin).toLocaleDateString()}</p>
                            <p><strong>Check-out:</strong> ${new Date(reservation.checkout).toLocaleDateString()}</p>
                            <button class="bntEstilo" onclick="deleteReservation(${reservation.id})">Cancelar Reserva</button>
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
});