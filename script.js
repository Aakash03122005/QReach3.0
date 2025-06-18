document.addEventListener('DOMContentLoaded', () => {
    const helpIcon = document.getElementById('helpIcon');
    const contactInfoModal = document.getElementById('contactInfoModal');
    const closeButton = contactInfoModal.querySelector('.close-button');

    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');

    // Excel Import elements
    const excelFileInput = document.getElementById('excelFileInput');
    const importExcelBtn = document.getElementById('importExcelBtn');
    const excelTableDisplay = document.getElementById('excelTableDisplay');

    const pages = [
        'home-page',
        'import-database-page',
        'dashboard-page'
    ];
    let currentPageIndex = 0; // Start at the Home page

    const navLinks = document.querySelectorAll('.nav-menu a');
    const activeUnderline = document.querySelector('.active-underline');

    // Get specific navigation links for direct access
    const homeNavLink = navLinks[0]; // 'Home' is the first link (index 0)
    const importDBNavLink = navLinks[1]; // 'Import Database' is the second link (index 1)
    const dashboardNavLink = navLinks[2]; // 'Dashboard' is the third link (index 2)

    function updateUnderlinePosition() {
        const currentNavLink = navLinks[currentPageIndex];
        if (currentNavLink) {
            // Position the underline relative to the header, so we need the offset from the navbar's left edge
            const navBar = document.querySelector('.navbar');
            const navBarOffsetLeft = navBar.getBoundingClientRect().left;

            const linkRect = currentNavLink.getBoundingClientRect();
            activeUnderline.style.width = `${linkRect.width}px`;
            activeUnderline.style.left = `${linkRect.left - navBarOffsetLeft}px`;
        }
    }

    function showPage(index) {
        // Update content pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pages[index]).classList.add('active');

        // Update active class on nav links
        navLinks.forEach((link, i) => {
            if (i === index) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        updateUnderlinePosition(); // Update underline position after page change

        if (pages[index] === 'import-database-page') {
            displaySavedExcelData();
        }

        if (pages[index] === 'dashboard-page') {
            fetch('http://localhost:3001/api/get-excel')
                .then(res => res.json())
                .then(result => {
                    if (result.data) {
                        showDashboardChart(result.data);
                    } else {
                        if (dashboardChartInstance) dashboardChartInstance.destroy();
                    }
                });
        }
    }

    // Initial page load
    showPage(currentPageIndex);

    // Arrow navigation
    rightArrow.addEventListener('click', () => {
        currentPageIndex = (currentPageIndex + 1) % pages.length;
        showPage(currentPageIndex);
    });

    leftArrow.addEventListener('click', () => {
        currentPageIndex = (currentPageIndex - 1 + pages.length) % pages.length;
        showPage(currentPageIndex);
    });

    // Direct navigation for 'Import Database' link
    importDBNavLink.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        currentPageIndex = 1; // Set to the index of 'import-database-page'
        showPage(currentPageIndex);
    });

    // Direct navigation for 'Home' link
    homeNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentPageIndex = 0; // Set to the index of 'home-page'
        showPage(currentPageIndex);
    });

    // Direct navigation for 'Dashboard' link
    dashboardNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        currentPageIndex = 2; // Set to the index of 'dashboard-page'
        showPage(currentPageIndex);
    });

    // Excel Import Functionality
    importExcelBtn.addEventListener('click', () => {
        excelFileInput.click(); // Trigger the hidden file input click
    });

    excelFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Assume the first sheet is the one we want
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert sheet to JSON and HTML table
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const html = XLSX.utils.sheet_to_html(worksheet);
                excelTableDisplay.innerHTML = html;

                // Send JSON data to backend
                fetch('http://localhost:3001/api/save-excel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: json })
                });

                // Apply table styling class (optional, but good practice)
                const table = excelTableDisplay.querySelector('table');
                if (table) {
                    table.classList.add('imported-excel-table');
                }
            };

            reader.readAsArrayBuffer(file);
        }
    });

    // On page load, check for saved data in backend and display it
    function displaySavedExcelData() {
        fetch('http://localhost:3001/api/get-excel')
            .then(res => res.json())
            .then(result => {
                if (result.data) {
                    const worksheet = XLSX.utils.aoa_to_sheet(result.data);
                    const html = XLSX.utils.sheet_to_html(worksheet);
                    excelTableDisplay.innerHTML = html;
                    const table = excelTableDisplay.querySelector('table');
                    if (table) {
                        table.classList.add('imported-excel-table');
                    }
                } else {
                    excelTableDisplay.innerHTML = '';
                }
            });
    }

    // Help icon click handler to show modal
    helpIcon.addEventListener('click', () => {
        contactInfoModal.style.display = 'flex'; // Use flex to center it
    });

    // Close button click handler to hide modal
    closeButton.addEventListener('click', () => {
        contactInfoModal.style.display = 'none';
    });

    // Click outside modal content to hide modal
    contactInfoModal.addEventListener('click', (event) => {
        if (event.target === contactInfoModal) {
            contactInfoModal.style.display = 'none';
        }
    });

    // Update underline position on window resize
    window.addEventListener('resize', updateUnderlinePosition);

    // Chart.js chart instance
    let dashboardChartInstance = null;

    function showDashboardChart(data) {
        const ctx = document.getElementById('dashboardChart').getContext('2d');
        if (dashboardChartInstance) {
            dashboardChartInstance.destroy();
        }
        // Example: Assume first row is header, first column is labels, second column is values
        const labels = data.slice(1).map(row => row[0]);
        const rawValues = data.slice(1).map(row => row[1]);
        const values = rawValues
            .map(val => Number(val))
            .filter(val => !isNaN(val)); // Only keep valid numbers

        const min = values.length ? Math.min(...values) : 'N/A';
        const max = values.length ? Math.max(...values) : 'N/A';

        if (!values.length) {
            chartDetails.innerHTML = 'No numeric data available for scale.';
            return;
        }

        dashboardChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: data[0][1],
                    data: values,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: 'rgba(255,255,255,1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    x: { ticks: { color: '#fff' } },
                    y: { ticks: { color: '#fff' } }
                }
            }
        });

        // Show chart details
        const chartDetails = document.getElementById('chartDetails');
        const about = data[0][1] || 'No description available';
        chartDetails.innerHTML = `
            <strong>Chart Details:</strong><br>
            <b>About:</b> ${about}<br>
            <b>Scale:</b> Min = ${min}, Max = ${max}<br>
            <b>Categories:</b> ${labels.join(', ')}
        `;
    }

    // Simple FAQ logic for the chatbot
    const chatbotFAQs = [
        { q: /hello|hi|hey/i, a: "Hello! How can I help you today?" },
        { q: /import/i, a: "To import an Excel file, go to the Import Database page and click 'Import Excel File'." },
        { q: /dashboard|chart/i, a: "The Dashboard page shows your imported data in chart form." },
        { q: /contact|email|phone/i, a: "You can contact us at contact@qreach.com or +1 (123) 456-7890." },
        { q: /help/i, a: "Click the help icon at the top right for more information." },
        { q: /.*/, a: "Sorry, I don't understand that yet. Please try another question!" }
    ];

    function chatbotReply(msg) {
        for (let i = 0; i < chatbotFAQs.length; i++) {
            if (chatbotFAQs[i].q.test(msg)) return chatbotFAQs[i].a;
        }
        return "Sorry, I don't understand that yet.";
    }

    const chatbotWidget = document.getElementById('chatbot-widget');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');

    chatbotToggle.onclick = () => chatbotWidget.style.display = 'flex';
    chatbotClose.onclick = () => chatbotWidget.style.display = 'none';

    chatbotInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && chatbotInput.value.trim()) {
            const userMsg = chatbotInput.value.trim();
            chatbotMessages.innerHTML += `<div><b>You:</b> ${userMsg}</div>`;
            const botMsg = chatbotReply(userMsg);
            setTimeout(() => {
                chatbotMessages.innerHTML += `<div><b>Bot:</b> ${botMsg}</div>`;
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            }, 400);
            chatbotInput.value = '';
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    });
}); 