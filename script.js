document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const createPollBtn = document.getElementById('createPollBtn');
    const createPollEmptyBtn = document.getElementById('createPollEmptyBtn');
    const createPollModal = document.getElementById('createPollModal');
    const closeModal = document.getElementById('closeModal');
    const pollForm = document.getElementById('pollForm');
    const addOptionBtn = document.getElementById('addOptionBtn');
    const pollOptionsContainer = document.getElementById('pollOptionsContainer');
    const activePollsContainer = document.getElementById('activePollsContainer');
    const completedPollsContainer = document.getElementById('completedPollsContainer');
    const activeEmptyState = document.getElementById('activeEmptyState');
    const completedEmptyState = document.getElementById('completedEmptyState');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const voterModal = document.getElementById('voterModal');
    const voterForm = document.getElementById('voterForm');
    const closeVoterModal = document.getElementById('closeVoterModal');
    const voterNameInput = document.getElementById('voterName');
    const selectedPollIdInput = document.getElementById('selectedPollId');
    const selectedOptionIndexInput = document.getElementById('selectedOptionIndex');

    // Poll data - with proper date parsing
    let polls = JSON.parse(localStorage.getItem('polls')) || [];
    let voters = JSON.parse(localStorage.getItem('voters')) || {};

    // Convert string dates back to Date objects when loading
    polls = polls.map(poll => {
        return {
            ...poll,
            createdAt: new Date(poll.createdAt)
        };
    });

    // Initialize the app
    function init() {
        renderPolls();
        updateEmptyStates();
    }

    // Save data to localStorage
    function saveData() {
        localStorage.setItem('polls', JSON.stringify(polls));
        localStorage.setItem('voters', JSON.stringify(voters));
    }

    // Render polls to the UI - fixed date handling
    function renderPolls() {
        activePollsContainer.innerHTML = '';
        completedPollsContainer.innerHTML = '';

        const now = new Date();
        
        polls.forEach(poll => {
            // Ensure createdAt is a Date object
            const createdAt = new Date(poll.createdAt);
            
            // Update poll status based on duration
            if (poll.status === "active" && poll.duration > 0) {
                const endDate = new Date(createdAt.getTime() + poll.duration * 86400000);
                if (now > endDate) {
                    poll.status = "completed";
                    saveData();
                }
            }

            const pollElement = createPollElement(poll);
            
            if (poll.status === "active") {
                activePollsContainer.appendChild(pollElement);
            } else {
                completedPollsContainer.appendChild(pollElement);
            }
        });
    }

    // Create a poll element - fixed date handling
    function createPollElement(poll) {
        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        const now = new Date();
        const createdAt = new Date(poll.createdAt);
        const endDate = new Date(createdAt.getTime() + poll.duration * 86400000);
        const timeRemaining = poll.duration > 0 ? Math.ceil((endDate - now) / 86400000) : "âˆž";
        
        const pollElement = document.createElement('div');
        pollElement.className = 'card poll-card';
        pollElement.dataset.id = poll.id;
        
        let optionsHTML = '';
        poll.options.forEach((option, index) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            optionsHTML += `
                <div class="option-item">
                    <input type="radio" name="pollOption_${poll.id}" id="option_${poll.id}_${index}" class="option-radio" ${poll.status === "completed" ? "disabled" : ""}>
                    <label for="option_${poll.id}_${index}" class="option-text">${option.text}</label>
                    <span class="option-percentage">${percentage}%</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        // Get voters for this poll
        const pollVoters = voters[poll.id] || [];
        const votersList = pollVoters.length > 0 ? 
            `<p><strong>Voters:</strong> ${pollVoters.join(', ')}</p>` : 
            '';
        
        pollElement.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${poll.title}</h3>
                <div class="badge ${poll.status === "active" ? "badge-primary" : "badge-success"}">
                    ${poll.status === "active" ? "Active" : "Completed"}
                </div>
            </div>
            ${poll.description ? `<p>${poll.description}</p>` : ''}
            ${votersList}
            
            <div class="poll-options">
                ${optionsHTML}
            </div>

            <div class="poll-results">
                <div class="result-item">
                    <div class="result-header">
                        <span class="result-label">Total Votes:</span>
                        <span class="result-value">${totalVotes}</span>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-header">
                        <span class="result-label">${poll.status === "active" ? "Time Remaining:" : "Ended:"}</span>
                        <span class="result-value">${poll.status === "active" ? 
                            (poll.duration === 0 ? "No end date" : `${timeRemaining} day${timeRemaining !== 1 ? "s" : ""}`) : 
                            endDate.toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            ${poll.status === "active" ? `
                <button class="btn btn-primary submit-vote" style="width: 100%; margin-top: 1rem;" data-id="${poll.id}">
                    <i class="fas fa-vote-yea"></i> Submit Vote
                </button>
            ` : ''}
        `;
        
        return pollElement;
    }

    // Update empty states
    function updateEmptyStates() {
        const activePolls = polls.filter(poll => poll.status === "active").length;
        const completedPolls = polls.filter(poll => poll.status === "completed").length;
        
        activeEmptyState.style.display = activePolls === 0 ? "block" : "none";
        completedEmptyState.style.display = completedPolls === 0 ? "block" : "none";
    }

    // Show toast notification
    function showToast(message, type = "success") {
        toast.className = `toast ${type}`;
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Event Listeners
    createPollBtn.addEventListener('click', () => {
        createPollModal.classList.add('active');
    });

    createPollEmptyBtn.addEventListener('click', () => {
        createPollModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        createPollModal.classList.remove('active');
    });

    closeVoterModal.addEventListener('click', () => {
        voterModal.classList.remove('active');
    });

    // Close modals when clicking outside
    [createPollModal, voterModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Add option input
    addOptionBtn.addEventListener('click', () => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'participant-item';
        optionDiv.style.marginBottom = '0.5rem';
        optionDiv.innerHTML = `
            <input type="text" class="form-control option-input" placeholder="Enter option text" required>
            <button type="button" class="action-btn delete remove-option">
                <i class="fas fa-trash"></i>
            </button>
        `;
        pollOptionsContainer.appendChild(optionDiv);
        
        // Add event listener to the new remove button
        optionDiv.querySelector('.remove-option').addEventListener('click', () => {
            if (pollOptionsContainer.children.length > 2) {
                optionDiv.remove();
            } else {
                showToast("A poll must have at least 2 options", "error");
            }
        });
    });

    // Remove option input
    document.querySelectorAll('.remove-option').forEach(btn => {
        btn.addEventListener('click', function() {
            if (pollOptionsContainer.children.length > 2) {
                this.parentElement.remove();
            } else {
                showToast("A poll must have at least 2 options", "error");
            }
        });
    });

    // Submit poll form
    pollForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('pollTitle').value.trim();
        const description = document.getElementById('pollDescription').value.trim();
        const duration = parseInt(document.getElementById('pollDuration').value);
        
        // Get options
        const optionInputs = document.querySelectorAll('.option-input');
        const options = [];
        
        optionInputs.forEach(input => {
            if (input.value.trim()) {
                options.push({
                    text: input.value.trim(),
                    votes: 0
                });
            }
        });
        
        if (options.length < 2) {
            showToast("Please add at least 2 options", "error");
            return;
        }
        
        // Create new poll
        const newPoll = {
            id: polls.length > 0 ? Math.max(...polls.map(p => p.id)) + 1 : 1,
            title,
            description,
            options,
            createdAt: new Date(),
            duration,
            status: "active"
        };
        
        polls.push(newPoll);
        if (!voters[newPoll.id]) {
            voters[newPoll.id] = [];
        }
        saveData();
        renderPolls();
        updateEmptyStates();
        
        // Reset form
        pollForm.reset();
        pollOptionsContainer.innerHTML = `
            <div class="participant-item" style="margin-bottom: 0.5rem;">
                <input type="text" class="form-control option-input" placeholder="Enter option text" required>
                <button type="button" class="action-btn delete remove-option">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="participant-item" style="margin-bottom: 0.5rem;">
                <input type="text" class="form-control option-input" placeholder="Enter option text" required>
                <button type="button" class="action-btn delete remove-option">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Re-add event listeners to remove buttons
        document.querySelectorAll('.remove-option').forEach(btn => {
            btn.addEventListener('click', function() {
                if (pollOptionsContainer.children.length > 2) {
                    this.parentElement.remove();
                } else {
                    showToast("A poll must have at least 2 options", "error");
                }
            });
        });
        
        createPollModal.classList.remove('active');
        showToast("Poll created successfully!");
    });

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Prepare to submit vote
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('submit-vote') || e.target.closest('.submit-vote')) {
            const pollId = parseInt(e.target.dataset.id || e.target.closest('.submit-vote').dataset.id);
            const poll = polls.find(p => p.id === pollId);
            const selectedOption = document.querySelector(`input[name="pollOption_${pollId}"]:checked`);
            
            if (!selectedOption) {
                showToast("Please select an option to vote", "error");
                return;
            }
            
            const optionIndex = parseInt(selectedOption.id.split('_')[2]);
            
            // Store the selected poll and option
            selectedPollIdInput.value = pollId;
            selectedOptionIndexInput.value = optionIndex;
            
            // Show voter name modal
            voterModal.classList.add('active');
            voterNameInput.focus();
        }
    });

    // Submit vote with voter name
    voterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const pollId = parseInt(selectedPollIdInput.value);
        const optionIndex = parseInt(selectedOptionIndexInput.value);
        const voterName = voterNameInput.value.trim();
        
        if (!voterName) {
            showToast("Please enter your name", "error");
            return;
        }
        
        const poll = polls.find(p => p.id === pollId);
        
        // Check if this voter has already voted
        if (voters[pollId] && voters[pollId].includes(voterName)) {
            showToast("You have already voted in this poll", "error");
            voterModal.classList.remove('active');
            return;
        }
        
        // Record the vote
        poll.options[optionIndex].votes++;
        
        // Record the voter
        if (!voters[pollId]) {
            voters[pollId] = [];
        }
        voters[pollId].push(voterName);
        
        saveData();
        renderPolls();
        voterModal.classList.remove('active');
        voterForm.reset();
        showToast("Vote submitted successfully!");
    });

    // Initialize the app
    init();
});