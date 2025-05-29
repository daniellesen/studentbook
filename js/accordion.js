function toggleAccordion(button) {
    // Toggle active class on the button
    button.classList.toggle('active');
    
    // Get the content element
    const content = button.nextElementSibling;
    
    // Toggle active class on the content
    content.classList.toggle('active');
    
    // Update the icon
    const icon = button.querySelector('.accordion-icon');
    if (button.classList.contains('active')) {
        icon.style.transform = 'rotate(45deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
} 