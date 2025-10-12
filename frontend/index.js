
document.addEventListener('DOMContentLoaded', function() {
    // Get all sections on the page
    const sections = document.querySelectorAll('section');
    
    // Get all navigation links that point to a section
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    // Function to show a specific section and hide all others
    function showSection(targetId) {
        sections.forEach(section => {
            if ('#' + section.id === targetId) {
                section.classList.remove('hidden');
                // Use scrollIntoView with smooth behavior for a better user experience
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                section.classList.add('hidden');
            }
        });
    }

    // Set the initial state: show only the home section
    showSection('#home');

    // Add click event listeners to all navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent the default anchor jump
            e.preventDefault();
            // Get the ID of the section to show
            const targetId = this.getAttribute('href');
            // Call the function to show the new section
            showSection(targetId);
        });
    });
});





//for client side

        document.getElementById('contactForm').addEventListener('submit', async (event) => {
          event.preventDefault();
    
          const statusMessage = document.getElementById('statusMessage');
          // This part of the code assumes you have a status message element,
          // but it's not present in your HTML. We'll add it in our next iteration if you want.
    
          const formData = new FormData(event.target);
          const data = Object.fromEntries(formData.entries());
          
          // Log the data to the console to check if all fields are being captured correctly
          console.log('Sending data:', data);

          try {
            const response = await fetch('http://localhost:3000/api/contact.html', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            });
    
            const result = await response.json();
    
            if (response.ok) {
              // Message for successful submission
              alert('Message sent successfully!');
              document.getElementById('contactForm').reset();
            } else {
              // Message for error
              alert('Error: ' + (result.error || 'Something went wrong.'));
            }
          } catch (error) {
            // Message for network error
            alert('Network error. Could not connect to the server.');
          }
        });
      
    