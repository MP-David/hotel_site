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

document.querySelectorAll(".services-list li").forEach(item => {

    item.addEventListener("mouseover", function () {
        const imageSrc = this.getAttribute("data-image");
        const imageElement = document.getElementById("servicePreview");
        imageElement.src = imageSrc;
        imageElement.style.display = "block";
    });

    item.addEventListener("mouseleave", function () {
        document.getElementById("servicePreview").style.display = "none";
    });
});


document.getElementById("addPhoto").addEventListener("click", function() {

    const photoUrl = document.getElementById("photoUrl").value;
    if (photoUrl) {
        const image = document.createElement("img");
        image.src = photoUrl;
        image.alt = "Foto do Hotel";
        document.getElementById("photoGallery").appendChild(image);
        document.getElementById("photoUrl").value = "";
    }
});

document.getElementById('addService').addEventListener('click', function() {

    const serviceName = document.getElementById('serviceName').value;
    
    if (serviceName.trim() !== "") {
        const li = document.createElement('li');
        
        li.innerHTML = `
            <h3>${serviceName}</h3>
            <button class="bntEstilo">Excluir</button>
        `;
        
        document.getElementById('serviceList').appendChild(li);
        document.getElementById('serviceName').value = "";
        
        li.querySelector('button').addEventListener('click', function() {li.remove();});
        
    } else {
        alert("Por favor, insira o nome de um serviço.");
    }
});
