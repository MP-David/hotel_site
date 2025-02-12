function moveSlide(direction, carouselImages) {
    const slides = carouselImages.querySelectorAll('img'); 
    const totalSlides = slides.length;
    let currentSlideIndex = parseInt(carouselImages.getAttribute('data-index')) || 0;

    // Atualiza o índice do slide atual
    currentSlideIndex += direction;

    // Garante que o índice nunca ultrapasse os limites
    if (currentSlideIndex < 0) {
        currentSlideIndex = totalSlides - 1; // Volta para o último slide
    } else if (currentSlideIndex >= totalSlides) {
        currentSlideIndex = 0; // Volta para o primeiro slide
    }

    // Move o carrossel horizontalmente
    const slideWidth = slides[0].clientWidth; // Obtém a largura do slide
    carouselImages.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;

    // Atualiza o índice do slide no atributo 'data-index'
    carouselImages.setAttribute('data-index', currentSlideIndex);
}

// Adicionando eventos para os botões de navegação
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
